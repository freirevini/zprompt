import { access, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

// Pastas que marcam a raiz de um projeto de código.
const PROJECT_MARKERS = ['.cursor', '.gemini', '.agents', '.agent', '.git'];

// Pastas lidas por IDE. Cursor: .cursor. Antigravity: .gemini, .agents e o legado .agent.
const DIRS_BY_IDE = {
  cursor: ['.cursor'],
  antigravity: ['.gemini', '.agents', '.agent'],
};

// Pastas que só existem no nível do projeto.
const PROJECT_ONLY = new Set(['.agents', '.agent']);

export const MAX_MANUAL_PATHS = 5;

/**
 * Descobre a pasta do projeto a partir de onde o servidor foi executado.
 * Ordem: ZPROMPT_PROJECT_DIR; INIT_CWD (pasta onde o `npm` foi chamado); cwd do processo.
 * Sobe a árvore até achar um marcador de projeto, sem confundir a home do usuário com projeto.
 */
export async function resolveProjectDir() {
  if (process.env.ZPROMPT_PROJECT_DIR) {
    return { dir: path.resolve(expandHome(process.env.ZPROMPT_PROJECT_DIR)), source: 'ZPROMPT_PROJECT_DIR' };
  }
  const start = path.resolve(process.env.INIT_CWD || process.cwd());
  const home = path.resolve(homedir());
  let dir = start;
  for (;;) {
    if (dir !== home) {
      for (const marker of PROJECT_MARKERS) {
        if (await exists(path.join(dir, marker))) {
          return { dir, source: dir === start ? 'pasta de execução' : `subiu até ${marker}` };
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return { dir: start, source: 'pasta de execução, sem marcador de projeto' };
    }
    dir = parent;
  }
}

/** Raízes extras configuradas em ZPROMPT_SKILL_ROOTS, separadas pelo delimitador do sistema. */
export function extraRoots() {
  return (process.env.ZPROMPT_SKILL_ROOTS || '')
    .split(path.delimiter)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => path.resolve(expandHome(p)));
}

/** Lista as raízes a varrer para o IDE informado, no projeto e na home do usuário. */
export async function skillRoots(projectDir, ide) {
  const home = path.resolve(homedir());
  const names = DIRS_BY_IDE[ide] ?? [...DIRS_BY_IDE.cursor, ...DIRS_BY_IDE.antigravity];
  const roots = [];

  for (const name of names) {
    roots.push({ scope: 'project', path: path.join(projectDir, name) });
    if (!PROJECT_ONLY.has(name)) {
      roots.push({ scope: 'user', path: path.join(home, name) });
    }
  }
  for (const extra of extraRoots()) {
    roots.push({ scope: 'extra', path: extra });
  }

  // Projeto na própria home: a mesma pasta aparece duas vezes; mantém a de escopo de projeto.
  const unique = [];
  const seen = new Set();
  for (const root of roots) {
    if (seen.has(root.path)) continue;
    seen.add(root.path);
    unique.push({ ...root, exists: await isDirectory(root.path) });
  }
  return unique;
}

/**
 * Pastas informadas pelo usuário na tela, quando a detecção falha.
 * Aceita `~`, caminho de pasta ou o próprio arquivo SKILL.md.
 * Só aceita pastas dentro da home (sem ser a própria home), do projeto ou de ZPROMPT_SKILL_ROOTS:
 * o servidor não varre o disco inteiro.
 */
export async function manualRoots(paths, projectDir) {
  const home = path.resolve(homedir());
  const bases = [projectDir, ...extraRoots()].filter(Boolean).map((p) => path.resolve(p));
  const roots = [];
  const seen = new Set();

  for (const raw of paths.slice(0, MAX_MANUAL_PATHS)) {
    let p = raw.trim().replace(/^["']|["']$/g, '');
    if (!p) continue;
    p = path.resolve(expandHome(p));
    let isDir = false;
    try {
      const s = await stat(p);
      if (s.isFile() && path.basename(p).toLowerCase() === 'skill.md') {
        p = path.dirname(p);
        isDir = true;
      } else {
        isDir = s.isDirectory();
      }
    } catch {
      isDir = false;
    }
    if (seen.has(p)) continue;
    seen.add(p);

    const allowed = isInside(p, home) || bases.some((base) => p === base || isInside(p, base));
    if (!allowed) {
      roots.push({
        scope: 'manual',
        path: p,
        exists: false,
        problem:
          p === home
            ? 'A home inteira é ampla demais. Informe a pasta das skills, como ~/.cursor/skills.'
            : 'Fora da sua home e do projeto. Para usar essa pasta, inclua-a em ZPROMPT_SKILL_ROOTS no .env.',
      });
      continue;
    }
    roots.push({ scope: 'manual', path: p, exists: isDir });
  }
  return roots;
}

/** Verdadeiro quando `child` fica estritamente dentro de `parent`. */
export function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function expandHome(p) {
  if (p === '~' || p.startsWith('~/') || p.startsWith('~\\')) {
    return path.join(homedir(), p.slice(1));
  }
  return p;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(p) {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}
