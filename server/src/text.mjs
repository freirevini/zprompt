// Texto que vai para os agentes: isolamento dos blocos de dados, redação de segredos e contagem.

/** Blocos que a mensagem dos agentes usa. Texto de fora nunca pode abrir nem fechar um deles. */
const BLOCK_TAGS = [
  'rascunho',
  'configuracao',
  'skills_selecionadas',
  'catalogo',
  'skill',
  'pedido',
  'falhas_da_tentativa_anterior',
  'prompt_anterior',
];
const TAG_RE = new RegExp(`<(\\s*\\/?\\s*)(${BLOCK_TAGS.join('|')})\\b`, 'gi');

/**
 * Para o rascunho: neutraliza só as tags dos nossos blocos, trocando `<` por `<\`.
 * Mantém intactos outros `<` e `>`, como `Map<string, number>` ou HTML, que são literais a preservar.
 */
export function neutralizeTags(text) {
  return String(text).replace(TAG_RE, '<\\$1$2');
}

/** Para texto vindo do disco, como descrições de skills: escapa todo `<` e `>` e achata espaços. */
export function escapeData(text) {
  return flatten(String(text)).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function flatten(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

export function truncate(text, max) {
  const t = String(text);
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

export function wordCount(text) {
  return String(text).split(/\s+/).filter(Boolean).length;
}

const SECRET_PATTERNS = [
  { kind: 'chave privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  { kind: 'chave do Google', re: /\bAIza[0-9A-Za-z_-]{35,}/g },
  { kind: 'chave de API', re: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/g },
  { kind: 'token do GitHub', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/g },
  { kind: 'token do Slack', re: /\bxox[abposr]-[A-Za-z0-9-]{10,}/g },
  { kind: 'chave da AWS', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { kind: 'chave do Stripe', re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
  { kind: 'JWT', re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g },
];

const BEARER_RE = /\b(Bearer\s+)([A-Za-z0-9._~+/-]{20,}=*)/g;
const URL_PASSWORD_RE = /(\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:)([^\s@/]+)(@)/gi;
const ASSIGNMENT_RE = /\b(password|passwd|pwd|senha|secret|segredo|token|api[_-]?key|apikey|access[_-]?key|client[_-]?secret|private[_-]?key)(["']?\s*[:=]\s*)(["']?)([^\s"'`,;]{8,})/gi;

/**
 * Troca segredos aparentes por marcadores `[segredo-N]` antes de qualquer envio ao Vertex.
 * Devolve o texto redigido e a lista para restaurar o valor original no prompt final, que fica na máquina.
 */
export function redactSecrets(text) {
  const secrets = [];
  const mark = (value, kind) => {
    const existing = secrets.find((s) => s.value === value);
    if (existing) return existing.placeholder;
    const placeholder = `[segredo-${secrets.length + 1}]`;
    secrets.push({ placeholder, value, kind });
    return placeholder;
  };

  let out = String(text);
  for (const { kind, re } of SECRET_PATTERNS) {
    out = out.replace(re, (m) => mark(m, kind));
  }
  out = out.replace(BEARER_RE, (_, prefix, token) => `${prefix}${mark(token, 'token Bearer')}`);
  out = out.replace(URL_PASSWORD_RE, (_, head, password, at) => `${head}${mark(password, 'senha em URL')}${at}`);
  out = out.replace(ASSIGNMENT_RE, (whole, key, sep, quote, value) => {
    if (value.startsWith('[segredo-')) return whole;
    // Exige cara de segredo: dígito ou símbolo, ou valor longo. Evita trocar "token: expirado".
    const looksSecret = /\d|[^A-Za-zÀ-ÿ]/.test(value) || value.length >= 16;
    return looksSecret ? `${key}${sep}${quote}${mark(value, `valor de ${key.toLowerCase()}`)}` : whole;
  });
  return { text: out, secrets };
}

export function restoreSecrets(text, secrets) {
  let out = String(text);
  for (const { placeholder, value } of secrets) {
    out = out.split(placeholder).join(value);
  }
  return out;
}
