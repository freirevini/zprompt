// Validação determinística da resposta do aprimorador. Não confia no próprio modelo:
// os literais a preservar e os caminhos permitidos saem do rascunho, não da lista devolvida.
import { wordCount } from './text.mjs';

export const STATUSES = ['ENHANCED', 'UNCHANGED', 'INSUFFICIENT'];
export const TASK_FUNCTIONS = ['understand', 'start', 'implement', 'fix', 'review', 'test', 'keep-codebase-knowledge'];
// Função que manda consultar os documentos gerados pela skill acquire-codebase-knowledge.
export const CODEBASE_DOCS_FUNCTION = 'keep-codebase-knowledge';
export const CODEBASE_DOCS_DIR = 'docs/codebase';
export const MODES = ['agent', 'plan', 'ask'];

export const MODE_TEXT = {
  plan: 'Ative o Plan Mode com Shift+Tab antes de enviar.',
  ask: 'Envie no modo Ask.',
  askDiagnosis: 'Envie no modo Ask, que não edita arquivos.',
};

const EXT =
  'tsx?|jsx?|mjs|cjs|py|ipynb|java|kts?|cs|go|rb|php|json|jsonc|mdx?|mdc|html?|s?css|sass|less|sql|ya?ml|toml|xml|sh|bash|zsh|ps1|vue|svelte|swift|dart|rs|c|cc|cpp|h|hpp|ini|env|lock|txt|gradle|properties|proto|graphql|gql|tf';
const FILE_RE = new RegExp(`(?<![\\w.@/-])(?:[\\w.@-]+\\/)*[\\w.@-]*[\\w-]\\.(?:${EXT})\\b`, 'gi');
const LEAD_PATH_RE = /(?<![\w.@/:-])(?:~|\.{1,2})?\/[\w.@-]+(?:\/[\w.@-]+)*\/?/g;
const MULTI_SEGMENT_RE = /(?<![\w.@/-])[\w.@-]+(?:\/[\w.@-]+){2,}\/?/g;
const URL_RE = /\bhttps?:\/\/[^\s<>"'`)\]]+/gi;
// Mensagem de erro: corta cedo, em vírgula, ponto final ou conectivo. Literal mais curto é mais seguro:
// a verificação é por trecho contido, e a narrativa em volta do erro pode ser reescrita.
const ERROR_RE = /\b[A-Z][A-Za-z0-9]*(?:Error|Exception)\b(?::[^\n,;]*?)?(?=[,;]|\.(?:\s|$)|\s+(?:no|na|nos|nas|em|e|mas|que|se|quando|depois|ao|porque|in|at|on|from|when|and|but|while|after|then)\s|\n|$)/g;
const VERSION_RE = /\bv?\d+\.\d+\.\d+(?:[-+][\w.]+)?\b/g;
const IDENTIFIER_RES = [
  /\b[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)+\b/g, // camelCase
  /\b[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+\b/g, // PascalCase com duas ou mais partes
  /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g, // snake_case
  /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g, // CONSTANTE_EM_CAIXA_ALTA
];
const SECRET_MARK_RE = /\[segredo-\d+\]/g;
const MAX_LITERALS = 60;

// Arquivos e pastas de convenção que o prompt pode citar como lugar a consultar, mesmo fora do rascunho.
const CONVENTION_FILES = new Set([
  'agents.md', 'claude.md', 'gemini.md', 'readme.md', 'contributing.md', '.cursorrules',
  // Documentos de docs/codebase/, da skill acquire-codebase-knowledge.
  'stack.md', 'structure.md', 'architecture.md', 'conventions.md', 'integrations.md', 'testing.md', 'concerns.md',
]);
const CONVENTION_DIRS = ['docs/codebase', '.cursor/rules', '.cursor/skills', '.agents/rules', '.agents/skills', '.agents/workflows', '.agent/rules', '.agent/skills', '.agent/workflows'];

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const count = (s, ch) => s.split(ch).length - 1;
const cleanToken = (s) => s.replace(/^@/, '').replace(/[.,;:!?]+$/, '');

/** Literais do rascunho que o prompt precisa carregar verbatim. */
export function extractLiterals(draft) {
  const found = new Set();
  const add = (value) => {
    let t = norm(value).replace(/[.,;:!?]+$/, '');
    // Parêntese que fecha a frase, e não o literal, fica de fora.
    while (t.endsWith(')') && count(t, ')') > count(t, '(')) t = t.slice(0, -1).replace(/[.,;:!?]+$/, '');
    if (t.length >= 2) found.add(t);
  };
  for (const m of draft.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) add(m[1]);
  const withoutFences = draft.replace(/```[\s\S]*?```/g, ' ');
  for (const m of withoutFences.matchAll(/`([^`\n]+)`/g)) add(m[1]);
  for (const m of withoutFences.matchAll(URL_RE)) add(m[0]);
  const withoutUrls = withoutFences.replace(URL_RE, ' ');
  for (const re of [FILE_RE, LEAD_PATH_RE, MULTI_SEGMENT_RE, ERROR_RE, VERSION_RE, SECRET_MARK_RE, ...IDENTIFIER_RES]) {
    for (const m of withoutUrls.matchAll(re)) add(cleanToken(m[0]));
  }
  // Barra solta ou comando de uma letra não é literal útil.
  return [...found].filter((t) => t !== '/' && !/^\/\w$/.test(t)).slice(0, MAX_LITERALS);
}

/** Caminhos e URLs do prompt que não vêm do rascunho, das convenções nem da lista permitida. */
export function findInventedReferences(prompt, draft, allowPaths = []) {
  const invented = new Set();
  for (const m of prompt.matchAll(URL_RE)) {
    const url = m[0].replace(/[.,;:!?]+$/, '');
    if (!draft.includes(url)) invented.add(url);
  }
  const text = prompt.replace(URL_RE, ' ');
  const tokens = [
    ...[...text.matchAll(FILE_RE)].map((m) => m[0]),
    ...[...text.matchAll(MULTI_SEGMENT_RE)].map((m) => m[0]),
    // Com barra inicial e um só trecho é comando (/plan) ou rota citada; só vale com dois ou mais.
    ...[...text.matchAll(LEAD_PATH_RE)].map((m) => m[0]).filter((t) => t.replace(/^[~.]*\//, '').includes('/')),
  ];
  for (const raw of tokens) {
    const token = cleanToken(raw);
    if (!token || draft.includes(token) || isConvention(token)) continue;
    if (allowPaths.some((p) => token === p || token.startsWith(`${p}/`))) continue;
    invented.add(token);
  }
  return [...invented];
}

function isConvention(token) {
  const t = token.toLowerCase().replace(/^\.\//, '');
  return CONVENTION_FILES.has(t) || CONVENTION_DIRS.some((dir) => t === dir || t.startsWith(`${dir}/`));
}

/** Confere tipos e enums da resposta do modelo. Devolve a lista de problemas. */
export function shapeProblems(raw) {
  if (!raw || typeof raw !== 'object') return ['resposta não é um objeto JSON'];
  const problems = [];
  const str = (k) => typeof raw[k] === 'string' || problems.push(`${k} ausente ou não é texto`);
  const arr = (k) => (Array.isArray(raw[k]) && raw[k].every((x) => typeof x === 'string')) || problems.push(`${k} não é lista de textos`);
  if (!STATUSES.includes(raw.status)) problems.push('status inválido');
  if (!TASK_FUNCTIONS.includes(raw.detectedFunction)) problems.push('detectedFunction inválida');
  if (!MODES.includes(raw.recommendedMode)) problems.push('recommendedMode inválido');
  if (typeof raw.routedToPlanning !== 'boolean') problems.push('routedToPlanning não é booleano');
  ['reason', 'intentQuote', 'modeInstruction', 'prompt'].forEach(str);
  ['preservedLiterals', 'agentMustDetermine'].forEach(arr);
  if (!Array.isArray(raw.changes) || !raw.changes.every((c) => c && typeof c.change === 'string' && typeof c.basis === 'string')) {
    problems.push('changes inválido');
  }
  return problems;
}

/**
 * Corrige deterministicamente o que não depende de julgamento: fonte da função, status sem mudança,
 * modo, instrução de modo, prefixo do Antigravity e cercas em volta do prompt.
 * `ctx`: { request, draft (o texto que o modelo recebeu), prefix }.
 */
export function normalize(raw, ctx) {
  const { request, draft, prefix } = ctx;
  const e = {
    status: raw.status,
    reason: raw.reason ?? '',
    detectedFunction: raw.detectedFunction,
    functionSource: 'detected',
    intentQuote: raw.intentQuote ?? '',
    preservedLiterals: raw.preservedLiterals ?? [],
    recommendedMode: raw.recommendedMode,
    routedToPlanning: raw.routedToPlanning === true,
    modeInstruction: '',
    changes: raw.changes ?? [],
    agentMustDetermine: raw.agentMustDetermine ?? [],
    prompt: unwrap(String(raw.prompt ?? '')),
  };

  if (request.function !== 'auto') {
    e.detectedFunction = request.function;
    e.functionSource = 'selected';
  }
  if (e.status !== 'ENHANCED') {
    e.prompt = draft;
    e.routedToPlanning = false;
  }
  const cursor = request.ide === 'cursor';
  const stripped = stripPrefix(e.prompt);

  if (request.autonomy === 'diagnosticar') {
    e.routedToPlanning = false;
    e.recommendedMode = cursor ? 'ask' : 'agent';
    e.modeInstruction = cursor ? MODE_TEXT.askDiagnosis : '';
    if (e.status === 'ENHANCED') e.prompt = stripped;
    return e;
  }

  if (e.status === 'ENHANCED') {
    e.routedToPlanning = e.routedToPlanning || e.recommendedMode === 'plan' || e.detectedFunction === 'start';
  }
  if (e.routedToPlanning) {
    e.recommendedMode = 'plan';
    e.modeInstruction = cursor ? MODE_TEXT.plan : '';
    if (!cursor) e.prompt = prefix + stripped;
  } else {
    if (e.recommendedMode === 'plan') e.recommendedMode = 'agent';
    if (!cursor && e.recommendedMode === 'ask') e.recommendedMode = 'agent';
    e.modeInstruction = cursor && e.recommendedMode === 'ask' && e.status !== 'INSUFFICIENT' ? MODE_TEXT.ask : '';
    if (!cursor && e.status === 'ENHANCED') e.prompt = stripped;
  }
  return e;
}

function unwrap(prompt) {
  let p = prompt.trim();
  const fence = p.match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
  if (fence) p = fence[1].trim();
  const quotes = [['"', '"'], ['“', '”'], ["'", "'"]];
  for (const [open, close] of quotes) {
    if (p.length > 2 && p.startsWith(open) && p.endsWith(close) && !p.slice(1, -1).includes(close)) {
      p = p.slice(1, -1).trim();
    }
  }
  return p;
}

function stripPrefix(prompt) {
  return prompt.replace(/^\s*\/plan\s+(?:\/grill-me\s+)?/, '').trimStart();
}

/**
 * Verificações sobre a resposta já normalizada.
 * `hard`: o prompt não pode ser entregue assim. `soft`: entregue com aviso se persistir após a nova tentativa.
 * `ctx`: { request, draft, skills (nomes), limits, allowPaths }.
 */
export function lint(e, ctx) {
  const { request, draft, skills = [], limits, allowPaths = [] } = ctx;
  const issues = [];
  // `message` vai ao modelo na nova tentativa; `user` aparece na tela quando o aviso persiste.
  const hard = (code, message, user = message) => issues.push({ code, severity: 'hard', message, user });
  const soft = (code, message, user = message) => issues.push({ code, severity: 'soft', message, user });
  const diagnosing = request.autonomy === 'diagnosticar';

  if (e.status === 'UNCHANGED' && diagnosing) {
    hard('diagnose_unchanged', 'Com Só diagnosticar o status nunca é UNCHANGED: reescreva o rascunho como prompt de investigação.');
  }
  const codebaseDocs = request.function === CODEBASE_DOCS_FUNCTION;
  if (e.status === 'UNCHANGED' && codebaseDocs) {
    hard('codebase_docs_unchanged', 'A função keep-codebase-knowledge exige ENHANCED: acrescente a consulta aos documentos de docs/codebase/.');
  }
  if (e.status === 'UNCHANGED' && skills.length) {
    hard('skills_unchanged', 'Há skills selecionadas, então o status não pode ser UNCHANGED: incorpore as skills.');
  }
  if (e.status !== 'ENHANCED') return issues;

  const prompt = e.prompt;
  if (!prompt.trim()) {
    hard('empty_prompt', 'O campo prompt veio vazio.');
    return issues;
  }
  if (prompt.includes('```') && !draft.includes('```')) {
    hard('new_code_block', 'O prompt tem bloco de código que não estava no rascunho. O aprimorador não escreve código: remova o bloco.');
  }

  const haystack = norm(prompt);
  const missing = extractLiterals(draft).filter((lit) => !haystack.includes(lit));
  if (missing.length) {
    hard('missing_literals', `Literais do rascunho ausentes no prompt: ${missing.map((m) => `"${m}"`).join(', ')}. Copie cada um exatamente.`);
  }

  const invented = findInventedReferences(prompt, draft, allowPaths);
  if (invented.length) {
    hard(
      'invented_reference',
      `Caminhos, arquivos ou URLs que não estão no rascunho: ${invented.map((m) => `"${m}"`).join(', ')}. Remova ou troque por instrução para o agente localizar no codebase.`,
    );
  }

  const words = wordCount(stripPrefix(prompt));
  const limit = wordLimit(ctx);
  if (words > limit) {
    soft(
      'too_long',
      `O prompt tem ${words} palavras e o limite é ${limit}. Corte repetições e o que o agente descobre sozinho, sem tirar literais nem skills.`,
      `O prompt ficou com ${words} palavras, acima do limite de ${limit} para este rascunho. Revise antes de enviar.`,
    );
  }

  const lower = prompt.toLowerCase();
  const phrases = limits.forbiddenPhrases.filter((p) => lower.includes(p.toLowerCase()));
  if (phrases.length) {
    soft(
      'forbidden_phrase',
      `Frases proibidas no prompt: ${phrases.map((p) => `"${p}"`).join(', ')}. Remova-as.`,
      `O prompt contém fórmulas que não ajudam o agente: ${phrases.map((p) => `"${p}"`).join(', ')}. Apague antes de enviar.`,
    );
  }

  const absentSkills = skills.filter((name) => !prompt.includes(name));
  if (absentSkills.length) {
    soft(
      'skills_missing',
      `Skills selecionadas que não aparecem no prompt: ${absentSkills.map((s) => `"${s}"`).join(', ')}. Incorpore todas, com o nome exato.`,
      `Skills escolhidas que não entraram no prompt: ${absentSkills.join(', ')}.`,
    );
  }

  if (codebaseDocs && !prompt.includes(`${CODEBASE_DOCS_DIR}/`)) {
    hard(
      'codebase_docs_missing',
      'A função keep-codebase-knowledge exige que o prompt mande ler os documentos de docs/codebase/, citados pelo caminho, como docs/codebase/CONVENTIONS.md.',
      'O prompt não manda consultar os documentos de docs/codebase/.',
    );
  }

  if (diagnosing && !/prompt de implementa|implementation prompt/i.test(prompt)) {
    soft(
      'diagnosis_handoff',
      'O prompt de diagnóstico precisa pedir a seção final "Prompt de implementação" no relatório.',
      'O prompt não pede a seção "Prompt de implementação" no relatório; o repasse ao modelo mais barato fica sem o prompt pronto.',
    );
  }
  return issues;
}

export function wordLimit({ request, draft, skills = [], limits }) {
  const draftWords = wordCount(draft);
  let limit;
  if (request.autonomy === 'diagnosticar') {
    limit = limits.maxWordsDiagnosis;
  } else if (request.function === 'start') {
    limit = limits.maxWordsStart;
  } else {
    limit = Math.min(limits.maxWordsDefault, Math.max(limits.minWordsCeiling, limits.lengthMultiplier * draftWords));
  }
  // Rascunho longo, como um stack trace, pode voltar inteiro com o contorno da tarefa.
  limit = Math.max(limit, draftWords + limits.minWordsCeiling);
  // O bloco de consulta a docs/codebase/ ganha espaço próprio.
  if (request.function === CODEBASE_DOCS_FUNCTION) limit += limits.wordsCodebaseDocs ?? 0;
  // Skills não contam no limite: cada uma ganha uma linha.
  return limit + skills.length * limits.wordsPerSkill;
}
