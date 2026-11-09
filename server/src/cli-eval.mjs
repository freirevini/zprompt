// Executor dos casos de regressão do aprimorador: agent/examples/casos.json.
// Uso: npm run eval            todos os casos
//      npm run eval -- <id>    só os casos cujo id contém o texto
// Casos resolvidos sem modelo (triagem) rodam sempre; os demais exigem o Vertex configurado.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT, loadEnv } from './env.mjs';

loadEnv();
process.env.ZPROMPT_QUIET = '1';

const { enhance, enhancerConfig, triage } = await import('./enhancer.mjs');
const { validateEnhanceRequest } = await import('./request.mjs');
const { vertexStatus } = await import('./vertex.mjs');

const { cases } = JSON.parse(readFileSync(path.join(REPO_ROOT, enhancerConfig.files.regressionCases), 'utf8'));
const filter = process.argv[2] ?? '';
const selected = cases.filter((c) => c.id.includes(filter));
const vertex = await vertexStatus();
const project = { dir: REPO_ROOT, source: 'avaliação' };

const CHECKS = {
  status: (r, v) => r.status === v || `status ${r.status}, esperado ${v}`,
  detectedFunction: (r, v) => r.detectedFunction === v || `função ${r.detectedFunction}, esperada ${v}`,
  recommendedMode: (r, v) => r.recommendedMode === v || `modo ${r.recommendedMode}, esperado ${v}`,
  routedToPlanning: (r, v) => r.routedToPlanning === v || `rota ${r.routedToPlanning}, esperada ${v}`,
  promptEqualsDraft: (r, v, c) => (r.prompt === c.request.draft) === v || 'prompt diferente do rascunho',
  promptStartsWith: (r, v) => r.prompt.startsWith(v) || `prompt não começa com "${v}"`,
  promptStartsWithNot: (r, v) => !r.prompt.startsWith(v) || `prompt começa com "${v}"`,
  promptMustContain: (r, v) => missing(r.prompt, v, true),
  promptMustContainAny: (r, v) => v.some((s) => r.prompt.includes(s)) || `prompt sem nenhum de: ${v.join(' | ')}`,
  promptMustNotContain: (r, v) => missing(r.prompt, v, false),
  promptMustNotContainRegex: (r, v) => {
    const hits = v.filter((re) => new RegExp(re).test(r.prompt));
    return !hits.length || `prompt casa com ${hits.join(', ')}`;
  },
  agentMustDetermineNotEmpty: (r, v) => (r.agentMustDetermine.length > 0) === v || 'agentMustDetermine vazio',
  promptEndsWithQuestionOrInstruction: (r, v) => /[?.!:]\s*$/.test(r.prompt) === v || 'prompt termina sem pontuação de pergunta ou instrução',
};

function missing(prompt, items, mustHave) {
  const lower = prompt.toLowerCase();
  const bad = items.filter((s) => lower.includes(s.toLowerCase()) !== mustHave);
  return !bad.length || `${mustHave ? 'faltam' : 'sobram'}: ${bad.join(', ')}`;
}

let passed = 0;
let failed = 0;
let skipped = 0;

console.log(`Aprimorador ${enhancerConfig.promptVersion}, schema ${enhancerConfig.schemaVersion}. Vertex: ${vertex.configured ? 'configurado' : `indisponível (${vertex.reason})`}\n`);

for (const c of selected) {
  const { value, problem } = validateEnhanceRequest(c.request);
  if (problem) {
    failed++;
    console.log(`FALHOU  ${c.id}: pedido inválido, ${problem}`);
    continue;
  }
  if (!vertex.configured && !triage(value.draft)) {
    skipped++;
    console.log(`PULADO  ${c.id}: precisa do Vertex`);
    continue;
  }
  try {
    const started = Date.now();
    const result = await enhance(value, { project });
    const problems = Object.entries(c.expect).map(([key, expected]) => {
      const check = CHECKS[key];
      return check ? check(result.enhancement, expected, c) : `verificação desconhecida: ${key}`;
    }).filter((x) => x !== true);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    if (problems.length) {
      failed++;
      console.log(`FALHOU  ${c.id} (${seconds} s): ${problems.join('; ')}`);
    } else {
      passed++;
      console.log(`OK      ${c.id} (${seconds} s)${result.warnings.length ? `, avisos: ${result.warnings.join(' ')}` : ''}`);
    }
  } catch (err) {
    failed++;
    console.log(`FALHOU  ${c.id}: ${err.code ?? 'ERRO'} ${err.message}${err.issues?.length ? ` | ${err.issues.join(' | ')}` : ''}`);
  }
}

console.log(`\n${passed} ok, ${failed} com falha, ${skipped} pulados.`);
process.exit(failed ? 1 : skipped && !passed ? 2 : 0);
