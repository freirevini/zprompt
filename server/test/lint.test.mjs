import assert from 'node:assert/strict';
import { test } from 'node:test';

import { extractLiterals, findInventedReferences, lint, normalize, wordLimit } from '../src/lint.mjs';

const limits = {
  maxWordsDefault: 250,
  maxWordsStart: 350,
  maxWordsDiagnosis: 450,
  minWordsCeiling: 120,
  lengthMultiplier: 3,
  wordsPerSkill: 30,
  wordsCodebaseDocs: 60,
  forbiddenPhrases: ['pense passo a passo', 'você é um especialista'],
};
const PREFIX = '/plan /grill-me ';
const request = (over = {}) => ({ draft: '', ide: 'cursor', function: 'auto', scope: 'minimo', autonomy: 'perguntar', preserveBehavior: true, ...over });
const raw = (over = {}) => ({
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
  prompt: '',
  ...over,
});

test('extrai erro completo, arquivo e identificadores do rascunho', () => {
  const lits = extractLiterals("corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx");
  assert.ok(lits.includes("TypeError: Cannot read properties of undefined (reading 'map')"));
  assert.ok(lits.includes('OrdersTable.tsx'));
});

test('mensagem de erro no meio da frase não carrega a narrativa junto', () => {
  const lits = extractLiterals("o app mostra TypeError: Cannot read properties of undefined (reading 'x') e trava, depois ReferenceError: process is not defined.");
  assert.ok(lits.includes("TypeError: Cannot read properties of undefined (reading 'x')"));
  assert.ok(lits.includes('ReferenceError: process is not defined'));
  assert.ok(!lits.some((l) => l.includes('trava')));
});

test('não trata "e/ou" nem palavras comuns como literal', () => {
  assert.deepEqual(extractLiterals('o login quebra depois de um tempo, arruma e/ou ajusta'), []);
});

test('extrai caminhos, rota, identificadores e trechos entre crases', () => {
  const lits = extractLiterals('Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401. Rode `npm test -- refresh`.');
  for (const expected of ['src/auth/refresh.ts', 'refreshToken', 'SessionExpiredError', '/token', 'npm test -- refresh']) {
    assert.ok(lits.includes(expected), expected);
  }
});

test('referência inventada: aceita rascunho e convenções, recusa caminho e URL novos', () => {
  const draft = 'corrige o erro no OrdersTable.tsx';
  const prompt = '/plan /grill-me Leia @OrdersTable.tsx, AGENTS.md e .cursor/rules/estilo.mdc. Veja src/utils/date.ts e https://exemplo.com/guia.';
  assert.deepEqual(findInventedReferences(prompt, draft).sort(), ['https://exemplo.com/guia', 'src/utils/date.ts']);
});

test('Antigravity com rota recebe o prefixo e modo plan', () => {
  const e = normalize(raw({ prompt: 'Planeje o app.', routedToPlanning: true, detectedFunction: 'start' }), {
    request: request({ ide: 'antigravity' }),
    draft: 'quero um app',
    prefix: PREFIX,
  });
  assert.equal(e.prompt, '/plan /grill-me Planeje o app.');
  assert.equal(e.recommendedMode, 'plan');
  assert.equal(e.modeInstruction, '');
});

test('função start sempre vai para planejamento; no Cursor, instrução do Plan Mode', () => {
  const e = normalize(raw({ prompt: 'Planeje.', detectedFunction: 'start' }), { request: request(), draft: 'novo app', prefix: PREFIX });
  assert.equal(e.routedToPlanning, true);
  assert.equal(e.modeInstruction, 'Ative o Plan Mode com Shift+Tab antes de enviar.');
});

test('Só diagnosticar: sem rota, sem prefixo, Ask no Cursor', () => {
  const e = normalize(raw({ prompt: '/plan /grill-me Investigue.', routedToPlanning: true, recommendedMode: 'plan' }), {
    request: request({ autonomy: 'diagnosticar' }),
    draft: 'o login quebra',
    prefix: PREFIX,
  });
  assert.equal(e.routedToPlanning, false);
  assert.equal(e.recommendedMode, 'ask');
  assert.equal(e.prompt, 'Investigue.');
  assert.equal(e.modeInstruction, 'Envie no modo Ask, que não edita arquivos.');
});

test('função escolhida na tela prevalece sobre a detectada', () => {
  const e = normalize(raw({ prompt: 'x', detectedFunction: 'implement' }), { request: request({ function: 'test' }), draft: 'x', prefix: PREFIX });
  assert.equal(e.detectedFunction, 'test');
  assert.equal(e.functionSource, 'selected');
});

test('UNCHANGED devolve o rascunho exato e tira cercas de código em volta do prompt', () => {
  const unchanged = normalize(raw({ status: 'UNCHANGED', prompt: 'outra coisa' }), { request: request(), draft: 'rascunho original', prefix: PREFIX });
  assert.equal(unchanged.prompt, 'rascunho original');
  const fenced = normalize(raw({ prompt: '```\nCorrija o login.\n```' }), { request: request(), draft: 'x', prefix: PREFIX });
  assert.equal(fenced.prompt, 'Corrija o login.');
});

test('lint: literal ausente e bloco de código novo são falhas graves', () => {
  const draft = "corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx";
  const e = normalize(raw({ prompt: 'Corrija o erro na tabela.\n```js\nfoo()\n```' }), { request: request(), draft, prefix: PREFIX });
  const codes = lint(e, { request: request(), draft, limits }).map((i) => `${i.severity}:${i.code}`);
  assert.ok(codes.includes('hard:missing_literals'));
  assert.ok(codes.includes('hard:new_code_block'));
});

test('lint: tamanho é aviso leve e skills ganham folga no limite', () => {
  const draft = 'o login quebra depois de um tempo, arruma';
  const long = Array.from({ length: 150 }, () => 'palavra').join(' ');
  const e = normalize(raw({ prompt: long }), { request: request(), draft, prefix: PREFIX });
  assert.deepEqual(lint(e, { request: request(), draft, limits }).map((i) => `${i.severity}:${i.code}`), ['soft:too_long']);
  assert.equal(wordLimit({ request: request(), draft, limits }), 128); // 8 palavras + 120 de contorno
  assert.equal(wordLimit({ request: request(), draft, limits, skills: ['a', 'b'] }), 188);
});

test('lint: UNCHANGED é proibido no diagnóstico e com skills', () => {
  const ctxDiag = { request: request({ autonomy: 'diagnosticar' }), draft: 'x y', limits };
  const diag = normalize(raw({ status: 'UNCHANGED' }), { ...ctxDiag, prefix: PREFIX });
  assert.equal(lint(diag, ctxDiag)[0].code, 'diagnose_unchanged');
  const ctxSkills = { request: request(), draft: 'x y', limits, skills: ['frontend-design'] };
  const withSkills = normalize(raw({ status: 'UNCHANGED' }), { ...ctxSkills, prefix: PREFIX });
  assert.equal(lint(withSkills, ctxSkills)[0].code, 'skills_unchanged');
});

test('lint: skill selecionada ausente e frase proibida viram avisos leves', () => {
  const draft = 'melhore a tela de login';
  const e = normalize(raw({ prompt: 'Pense passo a passo e melhore a tela de login.' }), { request: request(), draft, prefix: PREFIX });
  const codes = lint(e, { request: request(), draft, limits, skills: ['frontend-design'] }).map((i) => `${i.severity}:${i.code}`);
  assert.deepEqual(codes.sort(), ['soft:forbidden_phrase', 'soft:skills_missing']);
});

test('keep-codebase-knowledge: exige docs/codebase/, aceita os documentos como referência e proíbe UNCHANGED', () => {
  const draft = 'adiciona filtro por data na listagem de pedidos';
  const req = request({ draft, function: 'keep-codebase-knowledge' });
  const ctx = { request: req, draft, limits, prefix: PREFIX };

  const semDocs = normalize(raw({ detectedFunction: 'implement', prompt: 'Adicione filtro por data na listagem de pedidos. Rode os testes.' }), ctx);
  assert.equal(semDocs.detectedFunction, 'keep-codebase-knowledge');
  assert.ok(lint(semDocs, ctx).some((i) => i.code === 'codebase_docs_missing' && i.severity === 'hard'));

  const comDocs = normalize(
    raw({
      prompt:
        'Adicione filtro por data na listagem de pedidos. Antes, leia `docs/codebase/STRUCTURE.md`, `docs/codebase/CONVENTIONS.md` e CONCERNS.md. Ao terminar, atualize o documento afetado.',
    }),
    ctx,
  );
  assert.deepEqual(lint(comDocs, ctx).map((i) => i.code), []);

  const inalterado = normalize(raw({ status: 'UNCHANGED' }), ctx);
  assert.ok(lint(inalterado, ctx).some((i) => i.code === 'codebase_docs_unchanged'));
});

test('keep-codebase-knowledge ganha folga no limite de palavras; outras funções não', () => {
  const draft = 'adiciona filtro por data';
  const base = wordLimit({ request: request({ draft, function: 'implement' }), draft, limits });
  assert.equal(wordLimit({ request: request({ draft, function: 'keep-codebase-knowledge' }), draft, limits }), base + 60);
});
