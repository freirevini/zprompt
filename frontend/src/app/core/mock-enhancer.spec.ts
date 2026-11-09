import { describe, expect, it } from 'vitest';

import { buildMockResponse } from './mock-enhancer';
import { EnhanceResponse } from './models';
import { MOCK_CASES } from './testing/mock-cases';
import { MOCK_GOLDEN } from './testing/mock-golden';

function run(name: string): EnhanceResponse {
  const found = MOCK_CASES.find((c) => c.name === name);
  if (!found) throw new Error(`Caso inexistente: ${name}`);
  return buildMockResponse(found.input);
}

describe('buildMockResponse', () => {
  it('golden cobre todos os casos', () => {
    expect(Object.keys(MOCK_GOLDEN).sort()).toEqual(MOCK_CASES.map((c) => c.name).sort());
  });

  it('cada caso reproduz o golden', () => {
    for (const c of MOCK_CASES) {
      expect(buildMockResponse(c.input), c.name).toEqual(MOCK_GOLDEN[c.name]);
    }
  });

  it('saudação vira INSUFFICIENT', () => {
    expect(run('Sem tarefa|cursor|perguntar').status).toBe('INSUFFICIENT');
  });

  it('rascunho completo com arquivo e teste fica UNCHANGED', () => {
    expect(run('Já específico|cursor|perguntar').status).toBe('UNCHANGED');
  });

  it('projeto novo no Antigravity abre planejamento com /plan /grill-me', () => {
    const r = run('Projeto novo|antigravity|perguntar');
    expect(r.prompt.startsWith('/plan /grill-me ')).toBe(true);
    expect(r.recommendedMode).toBe('plan');
    expect(r.routedToPlanning).toBe(true);
  });

  it('erro com mensagem preserva literais e detecta fix', () => {
    const r = run('Erro com mensagem|cursor|perguntar');
    expect(r.preservedLiterals).toContain("TypeError: Cannot read properties of undefined (reading 'map')");
    expect(r.preservedLiterals).toContain('OrdersTable.tsx');
    expect(r.detectedFunction).toBe('fix');
  });

  it('pergunta no Cursor vai no modo Ask', () => {
    const r = run('Pergunta|cursor|perguntar');
    expect(r.recommendedMode).toBe('ask');
    expect(r.modeInstruction).toBe('Envie no modo Ask.');
  });

  it('revisão em Só diagnosticar mira o diff e pede o prompt de implementação', () => {
    const r = run('Revisão|cursor|diagnosticar');
    expect(r.prompt).toContain('Alvo da revisão: @Branch (Diff with Main).');
    expect(r.prompt).toContain('11. Prompt de implementação');
  });

  it('keep-codebase-knowledge cita STACK.md e TESTING.md quando o rascunho fala de build', () => {
    const r = run('keep-docs|cursor');
    expect(r.prompt).toContain('`docs/codebase/STACK.md`');
    expect(r.prompt).toContain('`docs/codebase/TESTING.md`');
  });

  it('skills entram no prompt pelo nome', () => {
    expect(run('skills|cursor').prompt).toContain('Use as skills `security-review` e `tdd-workflow` nesta tarefa.');
  });
});
