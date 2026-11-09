// Validação do pedido do frontend contra agent/config/request-schema.json, com os valores padrão.
import { MAX_MANUAL_PATHS } from './locate.mjs';

export const MAX_DRAFT_CHARS = 8000;
const IDES = ['cursor', 'antigravity'];
const FUNCTIONS = ['auto', 'understand', 'start', 'implement', 'fix', 'review', 'test', 'keep-codebase-knowledge'];
const SCOPES = ['minimo', 'ambicioso'];
const AUTONOMIES = ['perguntar', 'decidir', 'diagnosticar'];
const KEYS = new Set(['draft', 'ide', 'function', 'scope', 'autonomy', 'preserveBehavior', 'useSkills', 'skillPaths']);

/** Devolve { value } com padrões aplicados, ou { problem } com a primeira falha em português. */
export function validateEnhanceRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { problem: 'Corpo JSON ausente.' };
  const unknown = Object.keys(body).filter((k) => !KEYS.has(k));
  if (unknown.length) return { problem: `Campos não reconhecidos: ${unknown.join(', ')}.` };
  if (typeof body.draft !== 'string' || !body.draft.trim()) return { problem: 'Escreva o rascunho antes de aprimorar.' };
  if (body.draft.length > MAX_DRAFT_CHARS) return { problem: `O rascunho passa de ${MAX_DRAFT_CHARS} caracteres.` };
  if (!IDES.includes(body.ide)) return { problem: 'ide deve ser cursor ou antigravity.' };

  const value = {
    draft: body.draft,
    ide: body.ide,
    function: body.function ?? 'auto',
    scope: body.scope ?? 'minimo',
    autonomy: body.autonomy ?? 'perguntar',
    preserveBehavior: body.preserveBehavior ?? true,
    useSkills: body.useSkills ?? false,
    skillPaths: body.skillPaths ?? [],
  };
  if (!FUNCTIONS.includes(value.function)) return { problem: 'function inválida.' };
  if (!SCOPES.includes(value.scope)) return { problem: 'scope deve ser minimo ou ambicioso.' };
  if (!AUTONOMIES.includes(value.autonomy)) return { problem: 'autonomy deve ser perguntar, decidir ou diagnosticar.' };
  if (typeof value.preserveBehavior !== 'boolean') return { problem: 'preserveBehavior deve ser booleano.' };
  if (typeof value.useSkills !== 'boolean') return { problem: 'useSkills deve ser booleano.' };
  if (
    !Array.isArray(value.skillPaths) ||
    value.skillPaths.length > MAX_MANUAL_PATHS ||
    value.skillPaths.some((p) => typeof p !== 'string' || !p.trim() || p.length > 1024)
  ) {
    return { problem: `skillPaths deve ser uma lista de até ${MAX_MANUAL_PATHS} caminhos.` };
  }
  return { value };
}
