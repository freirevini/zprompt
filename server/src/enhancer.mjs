// Pipeline único do aprimoramento: o navegador envia rascunho e configuração; o servidor faz o resto.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './env.mjs';
import { extractLiterals, lint, normalize, shapeProblems } from './lint.mjs';
import { skillsStep } from './skills.mjs';
import { escapeData, neutralizeTags, redactSecrets, restoreSecrets, truncate } from './text.mjs';
import { VertexError, generateJson, resetVertexStatusCache, vertexStatus } from './vertex.mjs';

export const enhancerConfig = JSON.parse(readFileSync(path.join(REPO_ROOT, 'agent', 'config', 'agent.json'), 'utf8'));
const systemInstruction = readFileSync(path.join(REPO_ROOT, enhancerConfig.files.systemInstruction), 'utf8');
const userTemplate = readFileSync(path.join(REPO_ROOT, enhancerConfig.files.userTemplate), 'utf8');
const responseSchema = JSON.parse(readFileSync(path.join(REPO_ROOT, enhancerConfig.files.responseSchema), 'utf8'));

const GREETING = /^(oi+|ol[aá]|e a[ií]|bom dia|boa tarde|boa noite|teste|testando|hello|hi|hey|ok|obrigad[oa]|valeu)[\s!.?]*$/i;
const MAX_OUTPUT_TOKENS = 65536;

export class EnhanceError extends Error {
  constructor(code, status, message, extra = {}) {
    super(message);
    this.code = code;
    this.status = status;
    Object.assign(this, extra);
  }
}

export function enhancerModelId() {
  return process.env.GEMINI_MODEL || enhancerConfig.model.default;
}

/**
 * Executa o pipeline: redige segredos uma vez, faz a triagem, escolhe skills sem derrubar o pedido,
 * chama o aprimorador, normaliza, valida e tenta de novo uma vez com as falhas apontadas.
 * `deps` existe para testes: { generate, status, skills }.
 */
export async function enhance(request, { project, deps = {} }) {
  const started = Date.now();
  const deadline = started + enhancerConfig.runtime.deadlineSeconds * 1000;
  const { text: draft, secrets } = redactSecrets(request.draft);
  const notices = [];
  if (secrets.length) {
    const kinds = [...new Set(secrets.map((s) => s.kind))].join(', ');
    notices.push(
      `${secrets.length === 1 ? 'Um segredo aparente' : `${secrets.length} segredos aparentes`} (${kinds}) não saiu da sua máquina: o Vertex recebeu um marcador, e o prompt devolve o valor original no mesmo lugar.`,
    );
  }

  const meta = (source, extra = {}) => ({
    source,
    model: source === 'vertex' ? enhancerModelId() : '',
    promptVersion: enhancerConfig.promptVersion,
    schemaVersion: enhancerConfig.schemaVersion,
    latencyMs: Date.now() - started,
    ...extra,
  });

  const insufficient = triage(draft);
  if (insufficient) {
    const result = { enhancement: insufficientResult(request, insufficient), skills: null, warnings: [], notices, meta: meta('triage', { attempts: 0 }) };
    logLine(result);
    return result;
  }

  const skills = request.useSkills
    ? await skillsStep({ request, draft, project }, { ...deps.skills, selector: { ...deps.skills?.selector, deadline } })
    : null;
  if (skills?.error) notices.push(`${skills.error} O prompt foi aprimorado sem skills.`);

  const status = deps.status ?? (await vertexStatus());
  if (!status.configured) {
    throw new EnhanceError('VERTEX_NOT_CONFIGURED', 503, status.reason, { skills, notices });
  }

  const selected = skills?.selected ?? [];
  const ctx = {
    request,
    draft,
    skills: selected.map((s) => s.name),
    limits: enhancerConfig.postProcessing,
    prefix: enhancerConfig.postProcessing.antigravityRoutePrefix,
    allowPaths: [],
  };
  const baseMessage = buildUserMessage(request, draft, selected);
  const generate = deps.generate ?? generateJson;
  const maxAttempts = 1 + enhancerConfig.runtime.retries;

  let maxOutputTokens = enhancerConfig.generationConfig.maxOutputTokens;
  let feedback = null;
  let best = null;
  let lastIssues = [];
  let attempts = 0;
  let usage = null;

  while (attempts < maxAttempts) {
    attempts++;
    let response;
    try {
      response = await generate({
        model: enhancerModelId(),
        systemInstruction,
        userText: feedback ? withFeedback(baseMessage, feedback) : baseMessage,
        generationConfig: { ...enhancerConfig.generationConfig, maxOutputTokens },
        responseSchema,
        timeoutMs: enhancerConfig.runtime.timeoutSeconds * 1000,
        retries: enhancerConfig.runtime.networkRetries,
        deadline,
      });
    } catch (err) {
      if (err instanceof VertexError && err.code === 'NOT_CONFIGURED') {
        resetVertexStatusCache();
        throw new EnhanceError('VERTEX_NOT_CONFIGURED', 503, err.message, { skills, notices });
      }
      throw err;
    }
    usage = addUsage(usage, response.usage);

    if (!response.data) {
      // Thinking mais resposta passaram de maxOutputTokens: mesma mensagem, orçamento maior.
      maxOutputTokens = Math.min(maxOutputTokens * 2, MAX_OUTPUT_TOKENS);
      lastIssues = [{ code: 'max_tokens', severity: 'hard', message: 'A resposta passou do limite de saída.', user: 'A resposta do modelo passou do limite de saída.' }];
      continue;
    }

    const problems = shapeProblems(response.data);
    if (problems.length) {
      lastIssues = [{ code: 'schema', severity: 'hard', message: `Resposta fora do schema: ${problems.join('; ')}.`, user: 'A resposta do modelo veio fora do formato combinado.' }];
      feedback = { prompt: String(response.data?.prompt ?? ''), issues: lastIssues };
      continue;
    }

    const enhancement = normalize(response.data, ctx);
    const issues = lint(enhancement, ctx);
    lastIssues = issues;
    if (!issues.some((i) => i.severity === 'hard') && (!best || issues.length < best.issues.length)) {
      best = { enhancement, issues };
    }
    if (!issues.length) break;
    feedback = { prompt: enhancement.prompt, issues };
  }

  if (!best) {
    const error = new EnhanceError('LINT_FAILED', 502, `O prompt gerado não passou na validação depois de ${attempts} tentativas.`, {
      skills,
      notices,
      issues: lastIssues.map((i) => i.user),
    });
    logLine({ enhancement: { status: 'ERROR' }, skills, meta: meta('vertex', { attempts, usage }) }, lastIssues.map((i) => i.code));
    throw error;
  }

  const enhancement = finalize(best.enhancement, request, draft, secrets);
  const result = {
    enhancement,
    skills,
    warnings: best.issues.map((i) => i.user),
    notices,
    meta: meta('vertex', { attempts, usage: usage ?? undefined }),
  };
  logLine(result, best.issues.map((i) => i.code));
  return result;
}

/** Rascunho sem pedido: resposta determinística, sem chamar o modelo. */
export function triage(draft) {
  const t = draft.trim();
  if (GREETING.test(t) || !/[\p{L}\p{N}]{2,}/u.test(t)) {
    return 'O rascunho não descreve uma tarefa para o agente. Diga o que precisa ser feito e onde.';
  }
  return '';
}

function insufficientResult(request, reason) {
  const selected = request.function !== 'auto';
  return {
    status: 'INSUFFICIENT',
    reason,
    detectedFunction: selected ? request.function : 'implement',
    functionSource: selected ? 'selected' : 'detected',
    intentQuote: '',
    preservedLiterals: [],
    recommendedMode: 'agent',
    routedToPlanning: false,
    modeInstruction: '',
    changes: [],
    agentMustDetermine: [],
    prompt: request.draft,
  };
}

/** Preenche agent/prompts/user-template.md. Substituição por função: `$&` no rascunho não vira padrão. */
export function buildUserMessage(request, draft, skills) {
  const values = {
    ide: request.ide,
    funcao: request.function,
    escopo: request.scope,
    autonomia: request.autonomy,
    preservar_comportamento: request.preserveBehavior ? 'sim' : 'nao',
    skills: skills.map(skillLine).join('\n'),
    rascunho: neutralizeTags(draft),
  };
  return userTemplate.replace(/\{\{(\w+)\}\}/g, (whole, key) => (key in values ? values[key] : whole));
}

function skillLine(skill) {
  const field = (text, max) => escapeData(truncate(String(text ?? ''), max)).replace(/\|/g, '/');
  return `- nome: ${field(skill.name, 120)} | motivo: ${field(skill.reason, 300)} | descrição: ${field(skill.description, 240)}`;
}

function withFeedback(baseMessage, feedback) {
  return [
    baseMessage,
    '',
    '<falhas_da_tentativa_anterior>',
    ...feedback.issues.map((i) => `- ${i.message}`),
    '</falhas_da_tentativa_anterior>',
    '',
    '<prompt_anterior>',
    neutralizeTags(feedback.prompt),
    '</prompt_anterior>',
    '',
    'Sua resposta anterior falhou nas verificações acima. Corrija só o que falhou, mantenha o resto e devolva o JSON completo.',
  ].join('\n');
}

/** Devolve os segredos ao prompt e troca a lista de literais pela extraída do rascunho. */
function finalize(enhancement, request, draft, secrets) {
  const unchanged = enhancement.status !== 'ENHANCED';
  const prompt = unchanged ? request.draft : restoreSecrets(enhancement.prompt, secrets);
  const fromDraft = extractLiterals(draft);
  const fromModel = enhancement.preservedLiterals.filter((l) => draft.includes(l) && enhancement.prompt.includes(l));
  const literals = [...new Set([...fromDraft, ...fromModel])].filter((l) => !/\[segredo-\d+\]/.test(l)).slice(0, 30);
  return { ...enhancement, prompt, preservedLiterals: unchanged ? [] : literals };
}

function addUsage(total, usage) {
  if (!usage) return total;
  const sum = { ...(total ?? {}) };
  for (const key of ['promptTokenCount', 'candidatesTokenCount', 'thoughtsTokenCount', 'totalTokenCount']) {
    if (typeof usage[key] === 'number') sum[key] = (sum[key] ?? 0) + usage[key];
  }
  return sum;
}

/** Log técnico, uma linha por pedido, sem rascunho, prompt nem nomes de skills. */
function logLine(result, issueCodes = []) {
  if (process.env.ZPROMPT_QUIET === '1') return;
  const m = result.meta ?? {};
  console.log(
    JSON.stringify({
      evento: 'enhance',
      quando: new Date().toISOString(),
      status: result.enhancement?.status,
      fonte: m.source,
      modelo: m.model,
      promptVersion: m.promptVersion,
      tentativas: m.attempts,
      latenciaMs: m.latencyMs,
      tokens: m.usage?.totalTokenCount,
      skills: result.skills ? result.skills.selected.length : null,
      seletor: result.skills?.selector ?? null,
      avisos: issueCodes,
    }),
  );
}
