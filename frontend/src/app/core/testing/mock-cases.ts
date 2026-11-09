// Casos da simulação local usados pelo golden (mock-golden.ts) e por mock-enhancer.spec.ts.
// Mudou um caso: regenere com `npx vitest run tools/gen-golden.spec.ts`.
import { Autonomy, Ide, MockRequest } from '../models';

export interface MockCase {
  name: string;
  input: MockRequest;
}

// Os sete rascunhos que a tela oferecia em "Testar com" (removida em 2026-11-09); seguem em agent/examples/casos.json.
const DRAFTS: readonly { label: string; draft: string }[] = [
  { label: 'Erro vago', draft: 'o login quebra depois de um tempo, arruma' },
  { label: 'Erro com mensagem', draft: "corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx" },
  { label: 'Projeto novo', draft: 'quero criar um app pra controlar despesas da república' },
  { label: 'Revisão', draft: 'revisa minhas mudanças antes de eu abrir o PR' },
  { label: 'Pergunta', draft: 'por que o useEffect roda duas vezes no meu componente?' },
  {
    label: 'Já específico',
    draft:
      'Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura. Adicione teste em src/auth/refresh.test.ts que falha antes e passa depois. Rode npm test -- refresh.',
  },
  { label: 'Sem tarefa', draft: 'oi' },
];

const IDES: Ide[] = ['cursor', 'antigravity'];
const AUTONOMIES: Autonomy[] = ['perguntar', 'decidir', 'diagnosticar'];

function draftOf(label: string): string {
  const found = DRAFTS.find((d) => d.label === label);
  if (!found) throw new Error(`Rascunho inexistente: ${label}`);
  return found.draft;
}

function base(draft: string, ide: Ide, autonomy: Autonomy): MockRequest {
  return { draft, ide, function: 'auto', scope: 'minimo', autonomy, preserveBehavior: true, skills: [] };
}

const KEEP_DOCS_DRAFT = 'atualiza a dependência do build e roda os testes';

export const MOCK_CASES: readonly MockCase[] = [
  ...DRAFTS.flatMap(({ label, draft }) =>
    IDES.flatMap((ide) => AUTONOMIES.map((autonomy) => ({ name: `${label}|${ide}|${autonomy}`, input: base(draft, ide, autonomy) }))),
  ),
  {
    name: 'skills|cursor',
    input: {
      ...base(draftOf('Erro vago'), 'cursor', 'perguntar'),
      skills: [
        { name: 'security-review', description: 'Revisão de segurança', reason: 'o rascunho fala de login' },
        { name: 'tdd-workflow', description: 'TDD', reason: 'pede correção' },
      ],
    },
  },
  { name: 'ambicioso|antigravity', input: { ...base(draftOf('Projeto novo'), 'antigravity', 'perguntar'), scope: 'ambicioso' } },
  { name: 'sem-preservar|cursor', input: { ...base(draftOf('Erro com mensagem'), 'cursor', 'decidir'), preserveBehavior: false } },
  { name: 'keep-docs|cursor', input: { ...base(KEEP_DOCS_DRAFT, 'cursor', 'perguntar'), function: 'keep-codebase-knowledge' } },
  {
    name: 'keep-docs-diagnostico|antigravity',
    input: { ...base(KEEP_DOCS_DRAFT, 'antigravity', 'diagnosticar'), function: 'keep-codebase-knowledge' },
  },
  { name: 'test-forcado|cursor', input: { ...base(draftOf('Já específico'), 'cursor', 'perguntar'), function: 'test' } },
];
