import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

process.env.ZPROMPT_QUIET = '1';
const { buildUserMessage, enhance } = await import('../src/enhancer.mjs');

const configured = { configured: true, reason: '' };
let projectDir;
let project;

before(async () => {
  projectDir = await mkdtemp(path.join(tmpdir(), 'zprompt-enh-'));
  project = { dir: projectDir, source: 'teste' };
  const file = path.join(projectDir, '.cursor', 'skills', 'depurar', 'SKILL.md');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, '---\nname: depurar-erros\ndescription: Depuração sistemática de erros.\n---\n');
});

after(async () => {
  await rm(projectDir, { recursive: true, force: true });
});

const request = (draft, over = {}) => ({
  draft,
  ide: 'cursor',
  function: 'auto',
  scope: 'minimo',
  autonomy: 'perguntar',
  preserveBehavior: true,
  useSkills: false,
  skillPaths: [],
  ...over,
});
const answer = (prompt, over = {}) => ({
  finishReason: 'STOP',
  data: {
    status: 'ENHANCED',
    reason: '',
    detectedFunction: 'fix',
    functionSource: 'detected',
    intentQuote: '',
    preservedLiterals: [],
    recommendedMode: 'agent',
    routedToPlanning: false,
    modeInstruction: '',
    changes: [],
    agentMustDetermine: [],
    prompt,
    ...over,
  },
  usage: { totalTokenCount: 100 },
});
const scripted = (...responses) => {
  const calls = [];
  const generate = async (args) => {
    calls.push(args);
    const next = responses[Math.min(calls.length - 1, responses.length - 1)];
    return typeof next === 'function' ? next(args) : next;
  };
  return { generate, calls };
};

const ERROR_DRAFT = "corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx";
const GOOD_FIX = "Corrija o TypeError: Cannot read properties of undefined (reading 'map') em @OrdersTable.tsx. Reproduza antes de corrigir, ache a causa e rode os testes do projeto.";

test('rascunho sem tarefa não chama o modelo', async () => {
  const { generate, calls } = scripted();
  const result = await enhance(request('oi'), { project, deps: { generate, status: configured } });
  assert.equal(result.enhancement.status, 'INSUFFICIENT');
  assert.equal(result.enhancement.prompt, 'oi');
  assert.equal(result.meta.source, 'triage');
  assert.equal(calls.length, 0);
});

test('sem Vertex: erro próprio para a tela cair no modo de demonstração', async () => {
  await assert.rejects(
    enhance(request(ERROR_DRAFT), { project, deps: { status: { configured: false, reason: 'GOOGLE_CLOUD_PROJECT não está definido.' } } }),
    (err) => err.code === 'VERTEX_NOT_CONFIGURED' && err.status === 503,
  );
});

test('falha grave na primeira resposta: nova tentativa com as falhas apontadas', async () => {
  const { generate, calls } = scripted(answer('Corrija o erro da tabela.'), answer(GOOD_FIX));
  const result = await enhance(request(ERROR_DRAFT), { project, deps: { generate, status: configured } });
  assert.equal(result.meta.attempts, 2);
  assert.deepEqual(result.warnings, []);
  assert.ok(calls[1].userText.includes('<falhas_da_tentativa_anterior>'));
  assert.ok(result.enhancement.preservedLiterals.includes('OrdersTable.tsx'));
});

test('falha grave nas duas tentativas: erro de validação, sem entregar prompt', async () => {
  const bad = answer(`${GOOD_FIX}\n\`\`\`js\nitems?.map(fn)\n\`\`\``);
  const { generate } = scripted(bad, bad);
  await assert.rejects(enhance(request(ERROR_DRAFT), { project, deps: { generate, status: configured } }), (err) => err.code === 'LINT_FAILED' && err.issues.length > 0);
});

test('aviso leve persistente: entrega o prompt com aviso', async () => {
  const long = `${GOOD_FIX} ${'detalhe '.repeat(200)}`;
  const { generate } = scripted(answer(long), answer(long));
  const result = await enhance(request(ERROR_DRAFT), { project, deps: { generate, status: configured } });
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /palavras/);
});

test('segredo não vai ao Vertex e volta ao prompt final', async () => {
  const secret = 'sk-abcdefghijklmnopqrstuvwxyz123456';
  const draft = `configure o client da OpenAI com a chave ${secret} e corrige o erro de autenticação`;
  const { generate, calls } = scripted((args) => {
    const mark = args.userText.match(/\[segredo-\d+\]/)[0];
    return answer(`Configure o client da OpenAI com a chave ${mark} e corrija o erro de autenticação. Rode os testes.`);
  });
  const result = await enhance(request(draft), { project, deps: { generate, status: configured } });
  assert.ok(!calls[0].userText.includes(secret));
  assert.ok(result.enhancement.prompt.includes(secret));
  assert.equal(result.notices.length, 1);
});

test('estouro de saída repete com orçamento maior', async () => {
  const { generate, calls } = scripted({ finishReason: 'MAX_TOKENS', data: null }, answer(GOOD_FIX));
  const result = await enhance(request(ERROR_DRAFT), { project, deps: { generate, status: configured } });
  assert.equal(result.enhancement.status, 'ENHANCED');
  assert.equal(calls[1].generationConfig.maxOutputTokens, calls[0].generationConfig.maxOutputTokens * 2);
});

test('skills escolhidas entram na mensagem e no relatório', async () => {
  const selector = scripted({ finishReason: 'STOP', data: { selected: [{ id: 's1', relevance: 'HIGH', reason: 'Depurar o erro.', draftEvidence: 'corrige', skillEvidence: 'Depuração' }], noneReason: '' } });
  const { generate, calls } = scripted(answer(`${GOOD_FIX} Use a skill \`depurar-erros\` para conduzir a depuração.`));
  const result = await enhance(request(ERROR_DRAFT, { useSkills: true, skillPaths: [path.join(projectDir, '.cursor', 'skills')] }), {
    project,
    deps: { generate, status: configured, skills: { selector: { generate: selector.generate, status: configured } } },
  });
  assert.equal(result.skills.selected[0].name, 'depurar-erros');
  assert.ok(calls[0].userText.includes('- nome: depurar-erros | motivo: Depurar o erro.'));
  assert.deepEqual(result.warnings, []);
});

test('pasta de skills ausente não impede o aprimoramento', async () => {
  const { generate } = scripted(answer(GOOD_FIX));
  const result = await enhance(request(ERROR_DRAFT, { useSkills: true, skillPaths: [path.join(projectDir, 'nao-existe')] }), {
    project,
    deps: { generate, status: configured },
  });
  assert.equal(result.enhancement.status, 'ENHANCED');
  assert.equal(result.skills.needsPath, true);
  assert.match(result.skills.problem, /não encontrada/);
});

test('mensagem do usuário não interpreta $& do rascunho como padrão de substituição', () => {
  const text = buildUserMessage(request('troque $& e $1 por x'), 'troque $& e $1 por x', []);
  assert.ok(text.includes('troque $& e $1 por x'));
  assert.ok(text.includes('preservar_comportamento: sim'));
});
