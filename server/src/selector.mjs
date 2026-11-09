import { readFileSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './env.mjs';
import { escapeData, neutralizeTags } from './text.mjs';
import { generateJson, vertexStatus } from './vertex.mjs';

const AGENT_DIR = path.join(REPO_ROOT, 'agent', 'skills-selector');
export const selectorConfig = JSON.parse(readFileSync(path.join(AGENT_DIR, 'agent.json'), 'utf8'));
const systemInstruction = readFileSync(path.join(AGENT_DIR, 'system-instruction.md'), 'utf8');
const responseSchema = JSON.parse(readFileSync(path.join(AGENT_DIR, 'response-schema.json'), 'utf8'));

/**
 * Seleciona as skills pertinentes ao rascunho, sem limite de quantidade.
 * Catálogo maior que o orçamento de uma chamada é dividido em lotes; cada lote é avaliado
 * por inteiro e os resultados são unidos. Só o estouro de saída (MAX_TOKENS) divide o lote ao meio;
 * bloqueio do Vertex falha na hora, porque a causa é o rascunho, não o tamanho do lote.
 * Todas as chamadas, inclusive as das divisões, passam pelo mesmo limite de paralelismo.
 *
 * `draft` já chega redigido. `deps` existe para testes: { generate, status, deadline }.
 */
export async function selectSkills({ draft, ide, fn, autonomy, skills }, deps = {}) {
  if (skills.length === 0) {
    return { selector: 'none', selected: [], noneReason: 'Nenhuma skill encontrada nas pastas lidas.' };
  }
  const status = deps.status ?? (await vertexStatus());
  if (!status.configured) {
    return { selector: 'heuristic', heuristicReason: status.reason, ...heuristicSelect(draft, skills) };
  }

  const generate = deps.generate ?? generateJson;
  const limit = createLimiter(selectorConfig.catalog.maxParallelCalls);
  const catalog = skills.map((skill, index) => ({ ...skill, id: `s${index + 1}` }));
  const batches = splitByBudget(catalog, selectorConfig.catalog.charBudgetPerCall);

  async function selectBatch(batch) {
    const response = await limit(() =>
      generate({
        model: modelId(),
        systemInstruction,
        userText: buildUserText({ draft, ide, fn, autonomy, batch }),
        generationConfig: selectorConfig.generationConfig,
        responseSchema,
        timeoutMs: selectorConfig.runtime.timeoutSeconds * 1000,
        retries: selectorConfig.runtime.networkRetries,
        deadline: deps.deadline,
      }),
    );
    if (response.data) {
      const ids = new Set(batch.map((s) => s.id));
      const selected = Array.isArray(response.data.selected) ? response.data.selected : [];
      return {
        selected: selected.filter((item) => item && ids.has(item.id)),
        noneReason: typeof response.data.noneReason === 'string' ? response.data.noneReason : '',
      };
    }
    // Só MAX_TOKENS chega aqui: a saída não coube; o lote menor cabe.
    if (batch.length > 1) {
      const middle = Math.ceil(batch.length / 2);
      const [left, right] = await Promise.all([selectBatch(batch.slice(0, middle)), selectBatch(batch.slice(middle))]);
      return { selected: [...left.selected, ...right.selected], noneReason: left.noneReason || right.noneReason };
    }
    throw new Error(`O agente seletor não concluiu a skill ${batch[0].name}: a resposta passou do limite de saída.`);
  }

  const results = await Promise.all(batches.map((batch) => selectBatch(batch)));

  const byId = new Map(catalog.map((s) => [s.id, s]));
  const chosen = new Map();
  const noneReasons = [];
  for (const result of results) {
    if (result.noneReason) noneReasons.push(result.noneReason);
    for (const item of result.selected) {
      const skill = byId.get(item.id);
      if (!skill || chosen.has(item.id)) continue; // id inventado ou repetido: descarta
      chosen.set(item.id, {
        ...publicSkill(skill),
        relevance: item.relevance === 'HIGH' ? 'HIGH' : 'MEDIUM',
        reason: String(item.reason ?? ''),
        draftEvidence: String(item.draftEvidence ?? ''),
        skillEvidence: String(item.skillEvidence ?? ''),
      });
    }
  }

  const selected = [...chosen.values()].sort((a, b) => rank(a.relevance) - rank(b.relevance) || a.name.localeCompare(b.name));
  return {
    selector: 'vertex',
    model: modelId(),
    selected,
    noneReason: selected.length ? '' : (noneReasons[0] ?? 'Nenhuma skill se aplica a este pedido.'),
  };
}

// Catálogo (estável) antes do pedido (variável): favorece o cache implícito do modelo.
// Todo texto do disco é escapado: uma descrição não consegue abrir nem fechar blocos.
export function buildUserText({ draft, ide, fn, autonomy, batch }) {
  const entries = batch.map((s) =>
    [
      `<skill id="${s.id}" escopo="${s.scope}">`,
      `nome: ${escapeData(s.name)}`,
      `descricao: ${escapeData(s.description) || '(vazia)'}`,
      s.whenToUse ? `quando_usar: ${escapeData(s.whenToUse)}` : null,
      '</skill>',
    ]
      .filter(Boolean)
      .join('\n'),
  );

  return [
    '<catalogo>',
    ...entries,
    '</catalogo>',
    '',
    '<pedido>',
    `ide: ${ide}`,
    `funcao: ${fn}`,
    `autonomia: ${autonomy}`,
    '<rascunho>',
    neutralizeTags(draft),
    '</rascunho>',
    '</pedido>',
    '',
    'Avalie cada skill do catálogo para este pedido e devolva todas as pertinentes, sem limite de quantidade.',
  ].join('\n');
}

function splitByBudget(catalog, budget) {
  const batches = [];
  let current = [];
  let size = 0;
  for (const skill of catalog) {
    const cost = skill.name.length + skill.description.length + skill.whenToUse.length + 80;
    if (current.length && size + cost > budget) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(skill);
    size += cost;
  }
  if (current.length) batches.push(current);
  return batches;
}

/** Semáforo simples: no máximo `max` tarefas ao mesmo tempo. */
export function createLimiter(max) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= max || queue.length === 0) return;
    active++;
    const { task, resolve, reject } = queue.shift();
    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        active--;
        next();
      });
  };
  return (task) =>
    new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      next();
    });
}

// Sem credenciais do Vertex: seleção por termos em comum, rotulada como tal na resposta.
const STOP = new Set(
  'para com sem uma umas uns que por como mais quando onde este esta isso esse essa from with this that your the and for when use using skill skills code codigo arquivo arquivos fazer faca'.split(' '),
);

function heuristicSelect(draft, skills) {
  const draftTerms = terms(draft);
  const selected = [];
  for (const skill of skills) {
    const skillTerms = terms(`${skill.name.replace(/[-_:]/g, ' ')} ${skill.description} ${skill.whenToUse}`);
    const common = [...draftTerms].filter((t) => skillTerms.has(t));
    const nameHit = terms(skill.name.replace(/[-_:]/g, ' '));
    const nameMatch = [...nameHit].some((t) => draftTerms.has(t));
    if (common.length >= 2 || nameMatch) {
      selected.push({
        ...publicSkill(skill),
        relevance: nameMatch && common.length >= 2 ? 'HIGH' : 'MEDIUM',
        reason: `Termos em comum com o rascunho: ${common.slice(0, 5).join(', ')}.`,
        draftEvidence: '',
        skillEvidence: '',
      });
    }
  }
  selected.sort((a, b) => rank(a.relevance) - rank(b.relevance) || a.name.localeCompare(b.name));
  return { selected, noneReason: selected.length ? '' : 'Nenhuma skill tem termos em comum com o rascunho.' };
}

function terms(text) {
  return new Set(
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4 && !STOP.has(t)),
  );
}

function publicSkill(skill) {
  return { name: skill.name, description: skill.description, path: skill.path, scope: skill.scope };
}

function rank(relevance) {
  return relevance === 'HIGH' ? 0 : 1;
}

export function modelId() {
  return process.env.GEMINI_SKILLS_MODEL || process.env.GEMINI_MODEL || selectorConfig.model.default;
}
