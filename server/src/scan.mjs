import { open, readdir, realpath, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import { isInside } from './locate.mjs';

// Pastas que nunca contêm skills e podem ser enormes, em qualquer profundidade.
const SKIP_ALWAYS = new Set(['node_modules', '.git', '__pycache__', '.venv', 'venv']);

// Pastas ignoradas só no caminho exato abaixo da raiz, pelo nome da raiz.
// ~/.cursor/extensions guarda extensões do editor; ~/.gemini guarda histórico e conversas do Antigravity.
const SKIP_BELOW_ROOT = {
  '.cursor': ['extensions', 'CachedData', 'logs'],
  '.gemini': ['tmp', 'history', 'antigravity/brain', 'antigravity/conversations', 'antigravity/browser_recordings', 'antigravity/code_tracker'],
};

export const SCAN_LIMITS = {
  maxDepth: 10,
  maxDirs: 20000,
  maxSkillFiles: 5000,
  maxReadBytes: 64 * 1024,
  maxDescriptionChars: 1500,
  timeBudgetMs: 5000,
  maxWarnings: 50,
};

const SCOPE_RANK = { manual: 0, project: 1, user: 2, extra: 3 };

/**
 * Varre as raízes e devolve todas as skills encontradas, sem limite de quantidade de skills pertinentes.
 * Skill = qualquer arquivo SKILL.md, em qualquer profundidade até `maxDepth`.
 * Mesmo nome em escopos diferentes: vale manual, depois projeto, usuário e extra.
 * Limites de pastas, arquivos, bytes e tempo impedem varrer o disco inteiro; o corte vira aviso.
 */
export async function scanSkills(roots, limits = SCAN_LIMITS) {
  const byName = new Map();
  const visitedFiles = new Set();
  const warnings = [];
  const warn = (message) => {
    if (warnings.length < limits.maxWarnings) warnings.push(message);
    else if (warnings.length === limits.maxWarnings) warnings.push('Mais avisos omitidos.');
  };
  const budget = { dirs: 0, files: 0, deadline: Date.now() + limits.timeBudgetMs, stopped: '' };
  const home = path.resolve(homedir());

  for (const root of roots) {
    if (!root.exists) continue;
    let rootReal;
    try {
      rootReal = await realpath(root.path);
    } catch {
      continue;
    }
    const skipBelow = new Set(SKIP_BELOW_ROOT[path.basename(root.path)] ?? []);
    const files = await findSkillFiles({ root: root.path, rootReal, home, skipBelow, limits, budget, warn });

    for (const file of files) {
      let real;
      try {
        real = await realpath(file);
      } catch {
        continue;
      }
      if (visitedFiles.has(real)) continue;
      visitedFiles.add(real);

      try {
        const skill = await parseSkill(file, root, limits);
        const key = skill.name.toLowerCase();
        const current = byName.get(key);
        if (!current) {
          byName.set(key, skill);
        } else if (SCOPE_RANK[skill.scope] < SCOPE_RANK[current.scope]) {
          byName.set(key, skill);
        } else if (skill.scope === current.scope) {
          warn(`Skill "${skill.name}" duplicada: mantida ${current.path}; ignorada ${skill.path}.`);
        }
      } catch (err) {
        warn(`${file}: ${err.message}`);
      }
    }
    if (budget.stopped) break;
  }

  if (budget.stopped) warn(`Varredura interrompida: ${budget.stopped}. Informe uma pasta mais específica.`);

  // Ordem determinística: mesma entrada gera mesmo catálogo, o que ajuda o cache do modelo.
  const skills = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path));
  return { skills, warnings, truncated: Boolean(budget.stopped) };
}

async function findSkillFiles({ root, rootReal, home, skipBelow, limits, budget, warn }) {
  const found = [];
  const seenDirs = new Set();

  async function visit(dir, depth) {
    if (budget.stopped) return;
    if (Date.now() > budget.deadline) {
      budget.stopped = `passou de ${limits.timeBudgetMs / 1000} s`;
      return;
    }
    if (++budget.dirs > limits.maxDirs) {
      budget.stopped = `passou de ${limits.maxDirs} pastas`;
      return;
    }
    let real;
    try {
      real = await realpath(dir);
    } catch {
      return;
    }
    if (seenDirs.has(real)) return; // proteção contra symlink circular
    seenDirs.add(real);

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (err) {
      if (err.code !== 'EACCES' && err.code !== 'EPERM') warn(`${dir}: ${err.message}`);
      return;
    }
    // Ordem alfabética: o primeiro achado de um nome repetido não depende do sistema de arquivos.
    entries.sort((a, b) => a.name.localeCompare(b.name));

    // Sequencial de propósito: evita estourar o limite de arquivos abertos em árvores grandes.
    for (const entry of entries) {
      if (budget.stopped) return;
      const full = path.join(dir, entry.name);
      let isDir = entry.isDirectory();
      let isFile = entry.isFile();
      if (entry.isSymbolicLink()) {
        try {
          const target = await realpath(full);
          // Link só é seguido se apontar para dentro da home ou da própria raiz.
          if (!isInside(target, home) && target !== rootReal && !isInside(target, rootReal)) continue;
          const s = await stat(target);
          isDir = s.isDirectory();
          isFile = s.isFile();
        } catch {
          continue;
        }
      }
      if (isDir) {
        const rel = path.relative(root, full).split(path.sep).join('/');
        if (SKIP_ALWAYS.has(entry.name) || skipBelow.has(rel) || depth >= limits.maxDepth) continue;
        await visit(full, depth + 1);
      } else if (isFile && entry.name.toLowerCase() === 'skill.md') {
        if (++budget.files > limits.maxSkillFiles) {
          budget.stopped = `passou de ${limits.maxSkillFiles} arquivos SKILL.md`;
          return;
        }
        found.push(full);
      }
    }
  }

  await visit(root, 0);
  return found;
}

async function parseSkill(file, root, limits) {
  const text = await readHead(file, limits.maxReadBytes);
  const { data, body } = parseFrontmatter(text);
  const folder = path.basename(path.dirname(file));
  const name = String(data.name || folder).trim();
  const description = String(data.description || firstParagraph(body)).trim().slice(0, limits.maxDescriptionChars);
  return {
    name,
    description,
    whenToUse: String(data.when_to_use || '').trim().slice(0, limits.maxDescriptionChars),
    path: file,
    scope: root.scope,
    root: root.path,
  };
}

/** Lê só o começo do arquivo: nome e descrição ficam no topo. */
async function readHead(file, maxBytes) {
  const handle = await open(file, 'r');
  try {
    const buffer = Buffer.alloc(maxBytes);
    const { bytesRead } = await handle.read(buffer, 0, maxBytes, 0);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally {
    await handle.close();
  }
}

/** YAML mínimo: chaves de primeiro nível, aspas, blocos `|` e `>` e continuação indentada. */
export function parseFrontmatter(text) {
  const match = text.match(/^\uFEFF?---\r?\n(?:([\s\S]*?)\r?\n)??---[ \t]*(?:\r?\n|$)/);
  if (!match) {
    return { data: {}, body: text };
  }
  const lines = (match[1] ?? '').split(/\r?\n/);
  const data = {};

  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z_][\w-]*):[ \t]*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim();

    if (/^[>|][+-]?$/.test(value)) {
      const folded = value.startsWith('>');
      const block = [];
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1].trim() === '')) {
        block.push(lines[++i].trim());
      }
      value = folded ? block.join(' ').replace(/\s+/g, ' ').trim() : block.join('\n').trim();
    } else {
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1]) && !/^\s+[\w-]+:\s/.test(lines[i + 1])) {
        value += ' ' + lines[++i].trim();
      }
      value = unquote(value);
    }
    data[key] = value;
  }
  return { data, body: text.slice(match[0].length) };
}

function unquote(value) {
  if (value.length >= 2) {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1).replace(/''/g, "'");
    }
  }
  return value;
}

function firstParagraph(body) {
  const paragraph = [];
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) {
      if (paragraph.length) break;
      continue;
    }
    if (t.startsWith('#') || t.startsWith('```')) {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(t);
  }
  return paragraph.join(' ');
}
