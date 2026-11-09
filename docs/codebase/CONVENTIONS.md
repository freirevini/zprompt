# Convenções

Na tela, o ESLint (`frontend/eslint.config.js`) impõe parte das convenções; no servidor, nenhuma ferramenta impõe. Não há formatador nem hook. O resto é o padrão observado nos arquivos.

## 1) Nomes

| Item | Regra | Exemplo | Evidência |
|------|-------|---------|-----------|
| Arquivos do servidor | minúsculas, `.mjs`, um assunto por arquivo; CLIs com `cli-` | `vertex.mjs`, `cli-eval.mjs` | `server/src/` |
| Arquivos da tela | convenção Angular `nome.component.ts`; `core/` sem sufixo | `segmented.component.ts`, `models.ts` | `frontend/src/app/` |
| Funções e variáveis | camelCase, verbo no início | `validateEnhanceRequest`, `redactSecrets` | `server/src/request.mjs`, `text.mjs` |
| Classes e tipos | PascalCase | `VertexError`, `EnhanceRequest`, `SkillsReport` | `server/src/vertex.mjs`, `frontend/src/app/core/models.ts` |
| Constantes de módulo | UPPER_SNAKE_CASE | `RETRYABLE_STATUS`, `MAX_BODY_BYTES`, `CLIENT_HEADER` | `server/src/vertex.mjs`, `http.mjs` |
| Variáveis de ambiente | UPPER_SNAKE, prefixo `ZPROMPT_` para o app | `ZPROMPT_API_PORT` | `.env.example` |
| Códigos de erro | UPPER_SNAKE estável, consumido pela tela | `VERTEX_NOT_CONFIGURED`, `LINT_FAILED` | `server/src/index.mjs` |
| Seletor de componente | prefixo `zp-` | `zp-root`, `zp-segmented` | `frontend/src/app/ui/segmented.component.ts` |

Idioma: comentários, mensagens de erro, textos da tela e chaves do log em português (`evento`, `quando`, `tentativas`); identificadores em inglês.

## 2) Formatação e lint

- Formatador: nenhum configurado. Estilo observado: 2 espaços, aspas simples, ponto e vírgula, vírgula final em listas multilinha.
- Linter: ESLint 9 só na tela, com as regras recomendadas de `@eslint/js`, `typescript-eslint` (`recommended` e `stylistic`) e `angular-eslint` (TypeScript, template e acessibilidade), seletores com prefixo `zp`. Nenhuma regra desligada. O compilador também checa: `strict`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `strictTemplates` e `typeCheckHostBindings` (`frontend/tsconfig.json`).
- Templates: blocos `@if`/`@for` (sem `*ngIf`/`*ngFor`); `@for` sempre com `track` por chave estável (`option.value`, `skill.path`) ou `$index` em listas de texto. Texto dentro de bloco inline fica colado nas chaves (`@if (x) {texto}`) para não mudar os espaços na tela.
- Injeção de dependência com `inject()`, nunca pelo construtor.
- Comandos: `cd frontend && npm run lint && npx ng build`; `cd server && npm test`.

## 3) Imports e módulos

- Ordem: módulos nativos (`node:`) ou pacotes primeiro, uma linha em branco, depois relativos (`server/src/index.mjs`, `frontend/src/main.ts`).
- Só imports relativos; sem aliases (`tsconfig.json` sem `paths`).
- Sem barrel files; cada módulo exporta funções nomeadas.
- `index.mjs` importa os módulos com `await import()` depois de `loadEnv()`, para que leiam o `.env` já carregado.

## 4) Erros e log

- Servidor: módulos lançam erro tipado (`HttpError`, `VertexError`, `EnhanceError`) com `code`; `index.mjs` traduz para status HTTP e `{ error, code }`. Erro inesperado vira 500 `INTERNAL` com `err.message`.
- Skills nunca lançam para fora: `skillsStep` devolve `error` e `warnings`.
- Tela: `EnhanceFailure(message, code, issues)`; 503 `VERTEX_NOT_CONFIGURED` vira resultado de demonstração, e não erro.
- Log: uma linha JSON por pedido em `logLine` (`enhancer.mjs`), sem rascunho, prompt nem nomes de skills. `ZPROMPT_QUIET=1` desliga.
- Segredos: `redactSecrets` troca chaves, tokens e senhas por `[segredo-N]` antes de qualquer envio; `restoreSecrets` devolve os valores no prompt final (`server/src/text.mjs`).

## 5) Testes

- Local e nome: `server/test/<módulo>.test.mjs`, `node:test` com `assert/strict`.
- Isolamento: dependências injetadas por `deps`; pastas temporárias com `mkdtemp`.
- Cobertura: [TODO] sem ferramenta nem meta.
- Regra do projeto: mudou `server/src/`, rodar `npm test`; mudou prompt ou schema, subir a versão em `agent/config/agent.json` e rodar `npm run eval` (`AGENTS.md`).

## 6) Evidência

- Lint: `frontend/eslint.config.js`; formatador ausente.
- `frontend/tsconfig.json`
- `server/src/index.mjs`, `server/src/enhancer.mjs`, `server/src/text.mjs`, `frontend/src/app/core/enhance-api.ts`
