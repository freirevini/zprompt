# Testes

## 1) Ferramentas e comandos

- Framework: `node:test`, nativo do Node (sem versão própria; roda no Node instalado, hoje v26.3.0).
- Asserções e dublês: `node:assert/strict`; dublês escritos à mão e passados por `deps`.
- Comandos:

```bash
cd server && npm test        # 42 testes; passaram 42/42 em 2026-11-09
cd server && npm run eval    # 14 casos de agent/examples/casos.json contra o Vertex
# integração ou e2e da tela: [TODO] não existe
# cobertura: [TODO] não existe (node --test aceita --experimental-test-coverage, não configurado)
```

## 2) Organização

- Pasta separada: `server/test/`, um arquivo por módulo ou grupo pequeno.
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
| Tela | Não | — | `angular.json` não tem alvo `test`; nenhum `*.spec.ts` |
| Ponta a ponta | Não | — | Conferência manual no navegador |

## 4) Dublês e isolamento

- Abordagem: injeção por parâmetro, sem biblioteca de mock. `scripted(...)` em `enhancer.test.mjs` devolve respostas prontas do modelo e registra as chamadas.
- Isolamento: pastas temporárias por arquivo (`mkdtemp`), apagadas em `after`; `resetVertexStatusCache` existe para limpar o cache do status.
- `enhancer.test.mjs` define `ZPROMPT_QUIET=1` no topo para o log do pipeline não poluir a saída. Teste novo que chame `enhance()` em outro arquivo precisa fazer o mesmo.

## 5) Qualidade

- Ferramenta e meta de cobertura: [TODO] nenhuma.
- Cobertura atual: [TODO] não medida.
- Lacunas conhecidas: a tela não tem testes, inclusive `mock-enhancer.ts`; `vertex.mjs` não tem teste da chamada HTTP nem do backoff; os casos de regressão nunca rodaram contra o modelo.

## 6) Evidência

- `server/package.json` (`"test": "node --test"`, `"eval"`)
- `server/test/enhancer.test.mjs`, `server/test/lint.test.mjs`
- `frontend/angular.json` (alvos só `build` e `serve`), `agent/examples/casos.json`
- Terminal: `npm test` em 2026-11-09, 42 passaram e 0 falharam
