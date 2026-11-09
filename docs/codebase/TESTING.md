# Testes

## 1) Ferramentas e comandos

- Servidor: `node:test`, nativo do Node (sem versão própria).
- Tela: Vitest 3.2.7 com jsdom pelo builder `@angular/build:unit-test` (experimental no Angular 20), `TestBed` e `HttpTestingController`.
- Asserções e dublês: `node:assert/strict`; dublês escritos à mão e passados por `deps`.
- Comandos:

```bash
cd server && npm test        # 42 testes; passaram 42/42 em 2026-11-09
cd server && npm run eval    # 14 casos de agent/examples/casos.json contra o Vertex
cd frontend && npm test             # 33 testes em 4 arquivos; passaram 33/33 em 2026-11-09
# regenerar o golden, só com mudança intencional na simulação: npx vitest run tools/gen-golden.spec.ts
# atenção: `npx vitest run` sem caminho também roda o gerador e reescreve o golden
# e2e da tela: [TODO] não existe
# cobertura: [TODO] não existe (node --test aceita --experimental-test-coverage, não configurado)
```

## 2) Organização

- Servidor: pasta separada `server/test/`, um arquivo por módulo ou grupo pequeno.
- Tela: `*.spec.ts` ao lado do código; casos da simulação em `core/testing/mock-cases.ts` e saída esperada gerada em `core/testing/mock-golden.ts`.
- Specs não devem importar valores de `core/options.ts` fora de `app.component.spec.ts`: o builder experimental compartilha o chunk entre arquivos e `FUNCTION_LABEL` chega indefinido (ver `docs/06-plano-migracao-angular-20.md`, Tarefa 4.4).
- Nome: `<módulo>.test.mjs`. `text-http-request.test.mjs` agrupa `text.mjs`, `http.mjs` e `request.mjs`.
- Sem arquivo de setup global; cada arquivo cria e apaga as próprias pastas temporárias com `before`/`after`.

| Arquivo | Testes |
|---------|--------|
| `lint.test.mjs` | 16 |
| `enhancer.test.mjs` | 10 |
| `scan.test.mjs` | 5 |
| `selector.test.mjs` | 5 |
| `text-http-request.test.mjs` | 6 |

## 3) Escopo

| Escopo | Coberto? | Alvo | Observação |
|--------|----------|------|------------|
| Unidade | Sim | lint, segredos, guarda HTTP, validação, frontmatter, limitador | Sem rede |
| Integração do pipeline | Sim, com dublês | `enhance()` com `generate` e `status` falsos, pastas temporárias reais | Não chama o Vertex |
| Regressão do modelo | Existe, nunca rodou com o modelo | `npm run eval` | Sem `.env`, os 13 casos que precisam do Vertex são pulados (saída de 2026-11-09: 1 ok, 13 pulados) |
| Tela: simulação local | Sim, 10 | `mock-enhancer.spec.ts`: `buildMockResponse` contra golden de 48 casos | Trava o comportamento atual da demonstração; não compara com a instrução do aprimorador |
| Tela: contrato HTTP | Sim, 6 | `enhance-api.spec.ts` | Cabeçalhos, demonstração sem Vertex, servidor desligado, `LINT_FAILED`, `health` |
| Tela: componentes | Sim, 17 | `segmented.component.spec.ts` (4), `app.component.spec.ts` (13) | Estado, limites, erros, skills, cópia; sem layout nem CSS |
| Ponta a ponta | Não | — | Conferência manual no navegador |

## 4) Dublês e isolamento

- Abordagem: injeção por parâmetro, sem biblioteca de mock. `scripted(...)` em `enhancer.test.mjs` devolve respostas prontas do modelo e registra as chamadas.
- Isolamento: pastas temporárias por arquivo (`mkdtemp`), apagadas em `after`; `resetVertexStatusCache` existe para limpar o cache do status.
- `enhancer.test.mjs` define `ZPROMPT_QUIET=1` no topo para o log do pipeline não poluir a saída. Teste novo que chame `enhance()` em outro arquivo precisa fazer o mesmo.

## 5) Qualidade

- Ferramenta e meta de cobertura: [TODO] nenhuma.
- Cobertura atual: [TODO] não medida.
- Lacunas conhecidas: layout e CSS da tela só no navegador; `vertex.mjs` não tem teste da chamada HTTP nem do backoff; os casos de regressão nunca rodaram contra o modelo.

## 6) Evidência

- `server/package.json` (`"test": "node --test"`, `"eval"`)
- `server/test/enhancer.test.mjs`, `server/test/lint.test.mjs`
- `frontend/angular.json` (alvo `test` com `@angular/build:unit-test`), `agent/examples/casos.json`
- `frontend/src/app/**/*.spec.ts`, `frontend/tools/gen-golden.spec.ts`
- Terminal: `npm test` em `frontend/` em 2026-11-09, 33 passaram
- Terminal: `npm test` em 2026-11-09, 42 passaram e 0 falharam
