// Gera src/app/core/testing/mock-golden.ts a partir do comportamento atual de buildMockResponse.
// Rodar só quando a mudança na simulação for intencional: npx vitest run tools/gen-golden.spec.ts
import { writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';

import { buildMockResponse } from '../src/app/core/mock-enhancer';
import { MOCK_CASES } from '../src/app/core/testing/mock-cases';

it('gera o golden da simulação local', () => {
  const golden = Object.fromEntries(MOCK_CASES.map((c) => [c.name, buildMockResponse(c.input)]));
  const body = [
    '// Gerado por: npx vitest run tools/gen-golden.spec.ts — não editar à mão.',
    "import { EnhanceResponse } from '../models';",
    '',
    `export const MOCK_GOLDEN: Record<string, EnhanceResponse> = ${JSON.stringify(golden, null, 2)};`,
    '',
  ].join('\n');
  writeFileSync(new URL('../src/app/core/testing/mock-golden.ts', import.meta.url), body);
  expect(Object.keys(golden)).toHaveLength(MOCK_CASES.length);
});
