import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkRequest } from '../src/http.mjs';
import { parseEnv } from '../src/env.mjs';
import { validateEnhanceRequest } from '../src/request.mjs';
import { escapeData, neutralizeTags, redactSecrets, restoreSecrets } from '../src/text.mjs';

test('neutraliza só as tags dos blocos e preserva outros sinais de menor', () => {
  assert.equal(neutralizeTags('a </rascunho> Map<string, number> <div>'), 'a <\\/rascunho> Map<string, number> <div>');
  assert.equal(escapeData('x <b>\n y'), 'x &lt;b&gt; y');
});

test('redige segredos, mantém texto comum e restaura o original', () => {
  const draft = 'senha: S3nh@F0rte, token: expirado, Authorization: Bearer abcdefghijklmnopqrstuvwxyz123 e AIza' + 'B'.repeat(35);
  const { text, secrets } = redactSecrets(draft);
  assert.ok(!text.includes('S3nh@F0rte'));
  assert.ok(!text.includes('abcdefghijklmnopqrstuvwxyz123'));
  assert.ok(text.includes('token: expirado'));
  assert.equal(secrets.length, 3);
  assert.equal(restoreSecrets(text, secrets), draft);
});

test('servidor só atende a própria máquina', () => {
  const ok = { method: 'POST', headers: { host: '127.0.0.1:4300', origin: 'http://localhost:4200', 'content-type': 'application/json', 'x-zprompt': '1' } };
  assert.equal(checkRequest(ok, 4300), null);
  assert.equal(checkRequest({ ...ok, headers: { ...ok.headers, host: 'evil.com:4300' } }, 4300).status, 403);
  assert.equal(checkRequest({ ...ok, headers: { ...ok.headers, origin: 'https://evil.com' } }, 4300).status, 403);
  assert.equal(checkRequest({ ...ok, headers: { ...ok.headers, 'content-type': 'text/plain' } }, 4300).status, 415);
  const { 'x-zprompt': _, ...noHeader } = ok.headers;
  assert.equal(checkRequest({ ...ok, headers: noHeader }, 4300).status, 403);
  assert.equal(checkRequest({ method: 'GET', headers: { host: 'localhost:4300' } }, 4300), null);
});

test('.env aceita export e comentário no fim da linha', () => {
  assert.deepEqual(parseEnv('export GOOGLE_CLOUD_PROJECT=meu-projeto # comentário\nVERTEX_LOCATION="us"\n# nada'), [
    ['GOOGLE_CLOUD_PROJECT', 'meu-projeto'],
    ['VERTEX_LOCATION', 'us'],
  ]);
});

test('valida o pedido e aplica os padrões', () => {
  assert.deepEqual(validateEnhanceRequest({ draft: 'corrige o login', ide: 'cursor' }).value, {
    draft: 'corrige o login',
    ide: 'cursor',
    function: 'auto',
    scope: 'minimo',
    autonomy: 'perguntar',
    preserveBehavior: true,
    useSkills: false,
    skillPaths: [],
  });
  assert.match(validateEnhanceRequest({ draft: '  ', ide: 'cursor' }).problem, /rascunho/);
  assert.match(validateEnhanceRequest({ draft: 'x', ide: 'vscode' }).problem, /ide/);
  assert.match(validateEnhanceRequest({ draft: 'x', ide: 'cursor', skillPaths: Array(6).fill('/a') }).problem, /skillPaths/);
  assert.match(validateEnhanceRequest({ draft: 'x', ide: 'cursor', skills: [] }).problem, /não reconhecidos/);
});

test('aceita a função keep-codebase-knowledge', () => {
  const { value, problem } = validateEnhanceRequest({ draft: 'corrige o login', ide: 'cursor', function: 'keep-codebase-knowledge' });
  assert.equal(problem, undefined);
  assert.equal(value.function, 'keep-codebase-knowledge');
});
