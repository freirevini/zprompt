# Stack

Levantado em 2026-11-09 a partir dos manifestos e do terminal. Não há manifesto na raiz: são dois pacotes independentes, `server/` e `frontend/`, mais a configuração do agente em `agent/`.

## 1) Resumo do runtime

| Área | Valor | Evidência |
|------|-------|-----------|
| Linguagem do servidor | JavaScript ESM (`.mjs`), sem TypeScript | `server/src/*.mjs` |
| Linguagem da tela | TypeScript 5.9.3 (fixo no manifesto) | `frontend/package.json`, `frontend/node_modules/typescript` |
| Runtime | Node 22.12.0 fixado em `.nvmrc`; `engines.node` `>=18.10` no servidor e `^22.12.0` na tela; o Node padrão da máquina é v26.3.0, então rode `nvm use` antes dos comandos | `.nvmrc`, `server/package.json`, `frontend/package.json`, `node -v` |
| Gerenciador de pacotes | npm, com `package-lock.json` nos dois pacotes | `server/package-lock.json`, `frontend/package-lock.json` |
| Build | Servidor sem build (Node executa `src/index.mjs`); tela com Angular CLI 20.3.17 (`@angular/build:application`, esbuild; dev-server Vite) | `server/package.json`, `frontend/angular.json` |

## 2) Dependências de produção

| Dependência | Versão | Papel | Evidência |
|-------------|--------|-------|-----------|
| `google-auth-library` | `^9.15.0` (instalada 9.15.1) | Token do Vertex AI via Application Default Credentials; importada sob demanda | `server/package.json`, `server/src/vertex.mjs:65` |
| `@angular/*` | `20.3.17` fixo (`common`, `compiler`, `core`, `forms`, `platform-browser`) | Tela standalone, `HttpClient`, formulários | `frontend/package.json` |
| `rxjs` | `7.8.2` fixo | Fluxo das chamadas HTTP | `frontend/src/app/core/enhance-api.ts` |
| `zone.js` | `~0.15.0` (0.15.1) | Detecção de mudanças do Angular | `frontend/package.json` |

O servidor usa só módulos nativos além disso: `node:http`, `fetch` global, `node:fs`, `node:test`.

## 3) Ferramentas de desenvolvimento

| Ferramenta | Uso | Evidência |
|------------|-----|-----------|
| `node --test` + `node:assert/strict` | Testes do servidor | `server/package.json`, `server/test/*.test.mjs` |
| `@angular/cli`, `@angular/build`, `@angular/compiler-cli` | Build, `ng serve` e `ng test` com `strictTemplates` | `frontend/package.json`, `frontend/angular.json`, `frontend/tsconfig.json` |
| `cli-eval.mjs` | Casos de regressão contra o Vertex | `server/src/cli-eval.mjs`, `agent/examples/casos.json` |
| `cli-skills.mjs` | Lista as skills encontradas | `server/src/cli-skills.mjs` |
| `vitest` 3.2.7 + `jsdom` 26.1.0 | Testes da tela pelo builder `@angular/build:unit-test` (experimental no Angular 20) | `frontend/package.json`, `frontend/angular.json` |
| ESLint 9.33.0 + angular-eslint 20.7.0 + typescript-eslint 8.72.1 | Lint da tela (`ng lint`); servidor sem linter; sem formatador | `frontend/eslint.config.js` |

## 4) Comandos

```bash
cd server && npm install && npm start          # servidor em 127.0.0.1:4300
nvm use                                        # Node 22.12.0 do .nvmrc
cd frontend && npm install && npx ng serve --port 56036
cd frontend && npx ng build                    # build de produção com checagem estrita
cd server && npm test                          # 42 testes, sem Vertex
cd frontend && npm test                        # 33 testes da tela (ng test, Vitest)
cd frontend && npm run lint                    # ESLint da tela
cd server && npm run eval                      # casos de regressão; precisa do Vertex
cd server && npm run skills                    # skills encontradas
# lint do servidor: [TODO] não existe
```

## 5) Ambiente e configuração

- Fontes: `.env` na raiz, lido por `server/src/env.mjs`; modelo de variáveis em `.env.example`. Configuração do agente em `agent/config/agent.json` e `agent/skills-selector/agent.json`.
- Variáveis lidas pelo código: `GOOGLE_CLOUD_PROJECT` (obrigatória para o Vertex), `VERTEX_LOCATION`, `VERTEX_API_HOST`, `GEMINI_MODEL`, `GEMINI_SKILLS_MODEL`, `GOOGLE_APPLICATION_CREDENTIALS` (lida pela biblioteca de auth), `ZPROMPT_API_PORT`, `ZPROMPT_PROJECT_DIR`, `ZPROMPT_SKILL_ROOTS`, `ZPROMPT_QUIET`, `INIT_CWD` (definida pelo npm).
- Restrições: servidor só em `127.0.0.1`; sem `.env`, o Vertex fica desligado e a tela usa demonstração. Angular 20 com Node 22.12.0 do `.nvmrc`; migração do Angular 15 registrada em `docs/06-plano-migracao-angular-20.md` e `.rules/decisoes.md`. A linha 20 do Angular sai do suporte LTS em novembro de 2026.

## 6) Evidência

- `server/package.json`, `frontend/package.json`, `frontend/angular.json`, `frontend/tsconfig.json`, `frontend/eslint.config.js`
- `.env.example`, `server/src/env.mjs`, `.nvmrc`
- Terminal: `node -v` = v26.3.0 sem `nvm use`; versões instaladas lidas de `frontend/node_modules/*/package.json` em 2026-11-09
