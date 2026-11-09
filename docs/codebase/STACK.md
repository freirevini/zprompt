# Stack

Levantado em 2026-11-09 a partir dos manifestos e do terminal. Não há manifesto na raiz: são dois pacotes independentes, `server/` e `frontend/`, mais a configuração do agente em `agent/`.

## 1) Resumo do runtime

| Área | Valor | Evidência |
|------|-------|-----------|
| Linguagem do servidor | JavaScript ESM (`.mjs`), sem TypeScript | `server/src/*.mjs` |
| Linguagem da tela | TypeScript 4.9.5 (`~4.9.4` no manifesto) | `frontend/package.json`, `frontend/node_modules/typescript` |
| Runtime | Node, `engines.node >=18.10` no servidor; nenhum `engines` na tela; máquina atual com Node v26.3.0 | `server/package.json`, `node -v` |
| Gerenciador de pacotes | npm, com `package-lock.json` nos dois pacotes | `server/package-lock.json`, `frontend/package-lock.json` |
| Build | Servidor sem build (Node executa `src/index.mjs`); tela com Angular CLI 15.2.11 (`@angular-devkit/build-angular`, webpack) | `server/package.json`, `frontend/angular.json` |

## 2) Dependências de produção

| Dependência | Versão | Papel | Evidência |
|-------------|--------|-------|-----------|
| `google-auth-library` | `^9.15.0` (instalada 9.15.1) | Token do Vertex AI via Application Default Credentials; importada sob demanda | `server/package.json`, `server/src/vertex.mjs:65` |
| `@angular/*` | `^15.2.10` (core instalado 15.2.10) | Tela standalone, `HttpClient`, formulários | `frontend/package.json` |
| `rxjs` | `~7.8.0` (7.8.2) | Fluxo das chamadas HTTP | `frontend/src/app/core/enhance-api.ts` |
| `zone.js` | `~0.12.0` | Detecção de mudanças do Angular | `frontend/package.json` |

O servidor usa só módulos nativos além disso: `node:http`, `fetch` global, `node:fs`, `node:test`.

## 3) Ferramentas de desenvolvimento

| Ferramenta | Uso | Evidência |
|------------|-----|-----------|
| `node --test` + `node:assert/strict` | Testes do servidor | `server/package.json`, `server/test/*.test.mjs` |
| `@angular/cli`, `@angular/compiler-cli` | Build e `ng serve` com `strictTemplates` | `frontend/package.json`, `frontend/tsconfig.json` |
| `cli-eval.mjs` | Casos de regressão contra o Vertex | `server/src/cli-eval.mjs`, `agent/examples/casos.json` |
| `cli-skills.mjs` | Lista as skills encontradas | `server/src/cli-skills.mjs` |
| Linter / formatador | Nenhum configurado | ausência de `.eslintrc`, `.prettierrc` (scan) |

## 4) Comandos

```bash
cd server && npm install && npm start          # servidor em 127.0.0.1:4300
cd frontend && npm install && npx ng serve --port 56036
cd frontend && npx ng build                    # build de produção com checagem estrita
cd server && npm test                          # 42 testes, sem Vertex
cd server && npm run eval                      # casos de regressão; precisa do Vertex
cd server && npm run skills                    # skills encontradas
# lint: [TODO] não existe comando de lint
```

## 5) Ambiente e configuração

- Fontes: `.env` na raiz, lido por `server/src/env.mjs`; modelo de variáveis em `.env.example`. Configuração do agente em `agent/config/agent.json` e `agent/skills-selector/agent.json`.
- Variáveis lidas pelo código: `GOOGLE_CLOUD_PROJECT` (obrigatória para o Vertex), `VERTEX_LOCATION`, `VERTEX_API_HOST`, `GEMINI_MODEL`, `GEMINI_SKILLS_MODEL`, `GOOGLE_APPLICATION_CREDENTIALS` (lida pela biblioteca de auth), `ZPROMPT_API_PORT`, `ZPROMPT_PROJECT_DIR`, `ZPROMPT_SKILL_ROOTS`, `ZPROMPT_QUIET`, `INIT_CWD` (definida pelo npm).
- Restrições: servidor só em `127.0.0.1`; sem `.env`, o Vertex fica desligado e a tela usa demonstração. Angular 15 está fora de suporte e foi feito para Node 14/16/18; roda hoje em Node 26 (risco aceito em `.rules/decisoes.md`).

## 6) Evidência

- `server/package.json`, `frontend/package.json`, `frontend/angular.json`, `frontend/tsconfig.json`
- `.env.example`, `server/src/env.mjs`
- Terminal: `node -v` = v26.3.0; versões instaladas lidas de `node_modules/*/package.json`
