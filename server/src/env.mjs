import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Raiz do repositório zprompt, independente de onde o processo foi iniciado. */
export const REPO_ROOT = path.resolve(here, '..', '..');

/** Carrega REPO_ROOT/.env sem sobrescrever variáveis já definidas no ambiente. */
export function loadEnv(file = path.join(REPO_ROOT, '.env')) {
  if (!existsSync(file)) {
    return;
  }
  for (const [key, value] of parseEnv(readFileSync(file, 'utf8'))) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/** Formato `CHAVE=valor`, com `export ` opcional, aspas opcionais e comentários com `#`. */
export function parseEnv(text) {
  const entries = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^export\s+/, '');
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    entries.push([key, value]);
  }
  return entries;
}
