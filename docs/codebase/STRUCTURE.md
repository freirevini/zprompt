# Estrutura

## 1) Mapa do topo

| Caminho | Papel | Evidência |
|---------|-------|-----------|
| `agent/` | Configuração dos dois agentes do Vertex: system instructions, schemas, `generationConfig`, casos de regressão | `agent/README.md`, `agent/config/agent.json` |
| `agent/skills-selector/` | Agente que escolhe skills instaladas | `agent/skills-selector/agent.json` |
| `server/` | Servidor HTTP local com o pipeline inteiro | `server/README.md`, `server/src/index.mjs` |
| `frontend/` | Tela Angular 15 | `frontend/README.md`, `frontend/angular.json` |
| `docs/` | Pesquisa da Task 1 (`01`–`04`, `pesquisa/`), revisão `05` e este mapa (`codebase/`) | `docs/README.md` |
| `.rules/decisoes.md` | Decisões datadas; prevalecem sobre `docs/` | `AGENTS.md` |
| `AGENTS.md` | Contrato para agentes de código | arquivo |
| `.env.example` | Modelo das variáveis | arquivo |

Não há `.github/`, `.vscode/`, Docker nem CI. A pasta não é repositório git (scan: "No commits found").

## 2) Pontos de entrada

- Servidor: `server/src/index.mjs`, via `npm start`.
- Tela: `frontend/src/main.ts` (`bootstrapApplication(AppComponent)`), via `ng serve` ou `ng build`.
- Secundários: `server/src/cli-eval.mjs` (`npm run eval`) e `server/src/cli-skills.mjs` (`npm run skills`).

## 3) Fronteiras entre módulos

| Fronteira | O que pertence | O que não pertence |
|-----------|----------------|--------------------|
| `agent/` | Texto dos prompts, schemas, parâmetros do modelo | Código executável |
| `server/src/http.mjs`, `request.mjs` | Guarda de Host/Origin/cabeçalhos, leitura e validação do corpo | Regra de negócio |
| `server/src/enhancer.mjs` | Orquestração do pipeline | Chamada HTTP crua ao Vertex (fica em `vertex.mjs`) |
| `server/src/locate.mjs`, `scan.mjs`, `selector.mjs`, `skills.mjs` | Descoberta, leitura e escolha de skills | Reescrita do prompt |
| `server/src/lint.mjs`, `text.mjs` | Normalização, validação determinística, segredos e utilidades de texto | Chamadas de rede |
| `frontend/src/app/core/` | Contrato HTTP (`enhance-api.ts`), tipos, opções e suas descrições, simulação local | Componentes visuais |
| `frontend/src/app/ui/` | Componente visual reutilizável (`zp-segmented`) | Estado da aplicação |
| Tela em geral | Envia rascunho e configuração | Credenciais ou chamada direta ao Vertex (`AGENTS.md`) |

## 4) Nomes e organização

- Arquivos do servidor: substantivo curto em minúsculas, `.mjs` (`vertex.mjs`, `lint.mjs`); CLIs com prefixo `cli-`. Testes em `server/test/<módulo>.test.mjs`.
- Tela: convenção Angular, `app.component.{ts,html,scss}`, `segmented.component.ts`; `core/` em minúsculas sem sufixo (`models.ts`, `options.ts`).
- Organização: servidor plano por responsabilidade; tela em `core/` (dados) e `ui/` (visual).
- Imports: só relativos; `tsconfig.json` tem `baseUrl` mas não tem `paths`.

## 5) Evidência

- Árvore do scan em `.codebase-scan.txt` (gerado e descartado; ver `CONCERNS.md`)
- `server/package.json`, `frontend/angular.json`, `frontend/src/main.ts`
- `server/src/index.mjs`, `frontend/src/app/core/enhance-api.ts`
