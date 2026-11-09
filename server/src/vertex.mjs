// Cliente mínimo do Vertex AI para generateContent com saída JSON.
// Não envia temperature, topP, topK nem seed: o 3.8 Flash os ignora.

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const BLOCKED_FINISH = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION', 'IMAGE_SAFETY']);
const STATUS_TTL_OK_MS = 10 * 60 * 1000;
const STATUS_TTL_FAIL_MS = 30 * 1000;

let auth;
let cachedStatus = null;

/** Erro com código estável, usado pela API para escolher o status HTTP e a mensagem da tela. */
export class VertexError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'VertexError';
    this.code = code;
    Object.assign(this, extra);
  }
}

export function vertexHost(location = process.env.VERTEX_LOCATION || 'global') {
  if (process.env.VERTEX_API_HOST) return process.env.VERTEX_API_HOST;
  if (location === 'global') return 'aiplatform.googleapis.com';
  // Multirregiões us e eu usam o host .rep, conforme a documentação de locais do Vertex AI.
  if (location === 'us' || location === 'eu') return `aiplatform.${location}.rep.googleapis.com`;
  return `${location}-aiplatform.googleapis.com`;
}

/**
 * Diz se o Vertex pode ser chamado agora: projeto definido, dependência instalada e credencial válida.
 * Resultado em cache para não pedir token a cada requisição.
 */
export async function vertexStatus({ refresh = false } = {}) {
  if (!refresh && cachedStatus && Date.now() < cachedStatus.expiresAt) {
    return cachedStatus.value;
  }
  const value = await probe();
  cachedStatus = { value, expiresAt: Date.now() + (value.configured ? STATUS_TTL_OK_MS : STATUS_TTL_FAIL_MS) };
  return value;
}

async function probe() {
  const location = process.env.VERTEX_LOCATION || 'global';
  const base = { project: process.env.GOOGLE_CLOUD_PROJECT || '', location, host: vertexHost(location) };
  if (!base.project) {
    return { ...base, configured: false, reason: 'GOOGLE_CLOUD_PROJECT não está definido no .env da raiz.' };
  }
  try {
    await accessToken();
    return { ...base, configured: true, reason: '' };
  } catch (err) {
    return { ...base, configured: false, reason: err.message };
  }
}

async function accessToken() {
  if (!auth) {
    let GoogleAuth;
    try {
      ({ GoogleAuth } = await import('google-auth-library'));
    } catch {
      throw new VertexError('NOT_CONFIGURED', 'Dependências do servidor não instaladas. Rode npm install na pasta server.');
    }
    auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  }
  try {
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    if (!token) throw new Error('token vazio');
    return token;
  } catch (err) {
    throw new VertexError(
      'NOT_CONFIGURED',
      `Sem credencial do Google para o Vertex (${err.message}). Rode gcloud auth application-default login ou defina GOOGLE_APPLICATION_CREDENTIALS.`,
    );
  }
}

/**
 * Uma chamada generateContent com responseSchema.
 * Repete com espera crescente em 429, 5xx, falha de rede e tempo esgotado, dentro do prazo `deadline`.
 * Devolve { finishReason, data, usage }; `data` é null quando a saída estourou maxOutputTokens.
 * Bloqueio de segurança vira VertexError BLOCKED: dividir ou repetir não resolve.
 */
export async function generateJson({ model, systemInstruction, userText, generationConfig, responseSchema, timeoutMs, retries = 2, deadline }) {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_LOCATION || 'global';
  if (!project) {
    throw new VertexError('NOT_CONFIGURED', 'GOOGLE_CLOUD_PROJECT não está definido no .env da raiz.');
  }

  const url = `https://${vertexHost(location)}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: { ...generationConfig, responseSchema },
  });

  for (let attempt = 0; ; attempt++) {
    const remaining = deadline ? deadline - Date.now() : timeoutMs;
    if (remaining < 2000) {
      throw new VertexError('TIMEOUT', 'O prazo total do pedido acabou antes de o Vertex responder.');
    }
    try {
      return await callOnce(url, body, Math.min(timeoutMs, remaining));
    } catch (err) {
      const canRetry = err instanceof VertexError && err.retryable && attempt < retries;
      if (!canRetry) throw err;
      const wait = Math.min(8000, 800 * 2 ** attempt) + Math.round(Math.random() * 300);
      if (deadline && Date.now() + wait > deadline - 2000) throw err;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

async function callOnce(url, body, timeoutMs) {
  const token = await accessToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  let payload;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    // O corpo também fica sob o tempo limite: um corpo travado não prende o pedido.
    const text = await res.text();
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = {};
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new VertexError('TIMEOUT', `O Vertex não respondeu em ${Math.round(timeoutMs / 1000)} s.`, { retryable: true });
    }
    throw new VertexError('NETWORK', `Falha de rede com o Vertex: ${err.message}`, { retryable: true });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = payload?.error?.message ?? 'sem detalhe';
    if (RETRYABLE_STATUS.has(res.status)) {
      throw new VertexError(res.status === 429 ? 'RATE_LIMIT' : 'UNAVAILABLE', `O Vertex respondeu ${res.status}: ${detail}`, { retryable: true, status: res.status });
    }
    if (res.status === 401 || res.status === 403) {
      throw new VertexError('AUTH', `Sem permissão no Vertex (${res.status}): ${detail}`, { status: res.status });
    }
    if (res.status === 404) {
      throw new VertexError('MODEL_NOT_FOUND', `Modelo ou região não encontrados no Vertex (404): ${detail}`, { status: res.status });
    }
    throw new VertexError('BAD_REQUEST', `O Vertex recusou o pedido (${res.status}): ${detail}`, { status: res.status });
  }

  const usage = payload.usageMetadata;
  const blockReason = payload.promptFeedback?.blockReason;
  if (blockReason) {
    throw new VertexError('BLOCKED', `O Vertex bloqueou o texto enviado (${blockReason}).`, { blockReason });
  }
  const candidate = payload.candidates?.[0];
  const finishReason = candidate?.finishReason ?? 'NO_CANDIDATE';
  if (BLOCKED_FINISH.has(finishReason)) {
    throw new VertexError('BLOCKED', `O Vertex interrompeu a resposta (${finishReason}).`, { blockReason: finishReason });
  }
  // Thinking conta contra maxOutputTokens; o estouro chega sem exceção e com texto vazio.
  if (finishReason === 'MAX_TOKENS') {
    return { finishReason, data: null, usage };
  }
  if (!candidate) {
    throw new VertexError('EMPTY', 'O Vertex não devolveu nenhuma resposta.', { retryable: true });
  }

  const text = (candidate.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
  try {
    return { finishReason, data: JSON.parse(text), usage };
  } catch {
    throw new VertexError('BAD_JSON', `A resposta do Vertex não é JSON válido (finishReason=${finishReason}).`, { retryable: true });
  }
}

/** Só para testes: limpa o cache de estado. */
export function resetVertexStatusCache() {
  cachedStatus = null;
}
