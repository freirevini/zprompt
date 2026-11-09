import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

import { manualRoots } from '../src/locate.mjs';
import { SCAN_LIMITS, parseFrontmatter, scanSkills } from '../src/scan.mjs';

let base;
const skill = async (rel, frontmatter) => {
  const file = path.join(base, rel, 'SKILL.md');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, frontmatter);
};

before(async () => {
  base = await mkdtemp(path.join(tmpdir(), 'zprompt-scan-'));
  await skill('.cursor/skills/logs', '---\nname: leitor-de-logs\ndescription: Lê logs.\n---\n');
  await skill('.cursor/extensions/ext', '---\nname: extensao\ndescription: Não é skill.\n---\n');
  await skill('.cursor/skills/vazia', '---\n---\nPrimeiro parágrafo vira descrição.\n');
  await skill('.cursor/skills/a/dup', '---\nname: dup\ndescription: primeira\n---\n');
  await skill('.cursor/skills/b/dup', '---\nname: dup\ndescription: segunda\n---\n');
  await skill('.cursor/skills/node_modules/pkg', '---\nname: dependencia\n---\n');
  await mkdir(path.join(base, 'fora'), { recursive: true });
  await symlink(path.join(base, '.cursor', 'skills'), path.join(base, '.cursor', 'atalho'));
});

after(async () => {
  await rm(base, { recursive: true, force: true });
});

test('lista de pastas ignoradas do .cursor vale só logo abaixo da raiz', async () => {
  const { skills } = await scanSkills([{ scope: 'project', path: path.join(base, '.cursor'), exists: true }]);
  const names = skills.map((s) => s.name);
  assert.ok(names.includes('leitor-de-logs'), 'skill em skills/logs deve aparecer');
  assert.ok(!names.includes('extensao'), '.cursor/extensions é ignorada');
  assert.ok(!names.includes('dependencia'), 'node_modules é ignorada em qualquer profundidade');
});

test('frontmatter vazio não engole o corpo e nome repetido gera aviso determinístico', async () => {
  const { skills, warnings } = await scanSkills([{ scope: 'project', path: path.join(base, '.cursor'), exists: true }]);
  const vazia = skills.find((s) => s.name === 'vazia');
  assert.equal(vazia.description, 'Primeiro parágrafo vira descrição.');
  assert.equal(skills.find((s) => s.name === 'dup').description, 'primeira');
  assert.ok(warnings.some((w) => w.includes('"dup" duplicada')));
  assert.deepEqual(parseFrontmatter('---\n---\nname: x\n---\n').data, {});
});

test('link simbólico para dentro da raiz não duplica skills', async () => {
  const { skills } = await scanSkills([{ scope: 'project', path: path.join(base, '.cursor'), exists: true }]);
  assert.equal(skills.filter((s) => s.name === 'leitor-de-logs').length, 1);
});

test('limite de pastas interrompe a varredura com aviso', async () => {
  const result = await scanSkills([{ scope: 'project', path: path.join(base, '.cursor'), exists: true }], { ...SCAN_LIMITS, maxDirs: 2 });
  assert.equal(result.truncated, true);
  assert.ok(result.warnings.some((w) => w.startsWith('Varredura interrompida')));
});

test('pasta manual: aceita dentro do projeto, recusa a home inteira e fora da home', async () => {
  const [inside] = await manualRoots([path.join(base, '.cursor', 'skills')], base);
  assert.equal(inside.exists, true);
  const [home] = await manualRoots(['~'], base);
  assert.equal(home.exists, false);
  assert.match(home.problem, /home inteira/);
  const outsidePath = path.parse(homedir()).root === '/' ? '/usr' : 'C:\\Windows';
  const [outside] = await manualRoots([outsidePath], base);
  assert.equal(outside.exists, false);
  assert.match(outside.problem, /ZPROMPT_SKILL_ROOTS/);
});
