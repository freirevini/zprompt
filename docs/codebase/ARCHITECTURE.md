# Arquitetura

## 1) Estilo

- Estilo: aplicação local em duas peças. Uma tela SPA fala com um servidor HTTP local de rota única; o servidor é um pipeline sequencial em módulos por responsabilidade.
- Por quê: `frontend/proxy.conf.js` encaminha `/api` para `127.0.0.1:4300`; `server/src/index.mjs` expõe três rotas e delega `POST /api/enhance` a `enhance()` em `server/src/enhancer.mjs`, que chama os demais módulos em ordem.
- Restrições que moldam o desenho:
  - O aprimorador só reescreve o prompt e nada é persistido (`AGENTS.md`, `agent/config/agent.json` `storeInteractions: false`).
  - Credenciais ficam só no servidor; a tela nunca chama o Vertex (`AGENTS.md`).
  - O servidor lê pastas do computador, então só atende a própria máquina (`server/src/http.mjs`).

## 2) Fluxo do sistema

```text
tela (app.component) -> HttpEnhanceApi POST /api/enhance -> guarda + validação -> enhance():
  segredos -> triagem -> skills -> status do Vertex -> Vertex + normalização + lint (até 2 tentativas) -> segredos restaurados -> JSON
```

1. A tela monta `EnhanceRequest` e envia com o cabeçalho `x-zprompt: 1` (`frontend/src/app/core/enhance-api.ts`).
2. `checkRequest` recusa Host, Origin ou cabeçalhos fora do esperado; `readJson` limita o corpo a 1 MB; `validateEnhanceRequest` aplica padrões e recusa campos desconhecidos (`server/src/http.mjs`, `request.mjs`).
3. `enhance()` troca segredos por `[segredo-N]` e responde sem modelo quando o rascunho não tem pedido (`triage`) (`server/src/enhancer.mjs`, `text.mjs`).
4. Com `useSkills`, `skillsStep` localiza as pastas, varre `SKILL.md` e escolhe skills pelo agente seletor, ou por termos em comum sem Vertex. Falhas viram aviso e nunca derrubam o pedido (`skills.mjs`, `locate.mjs`, `scan.mjs`, `selector.mjs`).
5. Sem Vertex configurado, lança `VERTEX_NOT_CONFIGURED` (503) já com as skills; a tela completa com a simulação local rotulada (`enhance-api.ts` `demoResult`, `core/mock-enhancer.ts`).
6. Com Vertex, `generateJson` chama `generateContent` com `responseSchema`; o resultado passa por `normalize` e `lint`. Problema grave gera nova tentativa com as falhas anexadas (`runtime.retries: 1`). A melhor tentativa sem problema grave vence; sem nenhuma, `LINT_FAILED` (502). Os segredos voltam ao prompt e uma linha de log sem conteúdo é impressa (`enhancer.mjs`, `lint.mjs`, `vertex.mjs`).

## 3) Responsabilidades

| Módulo | É dono de | Não é dono de | Evidência |
|--------|-----------|---------------|-----------|
| `index.mjs` | Rotas, mapa de erro para status HTTP, inicialização | Regras do pipeline | `server/src/index.mjs` |
| `enhancer.mjs` | Orquestração, triagem, nova tentativa, log | HTTP do Vertex | `server/src/enhancer.mjs` |
| `vertex.mjs` | Status das credenciais, host por região, chamada com timeout e backoff, tradução de `finishReason` | Conteúdo do prompt | `server/src/vertex.mjs` |
| `lint.mjs` | Normalização por IDE/função, literais do rascunho, problemas graves e leves | Rede | `server/src/lint.mjs` |
| `selector.mjs` | Lotes, limite de 4 chamadas simultâneas, seleção heurística | Varredura do disco | `server/src/selector.mjs` |
| `scan.mjs` / `locate.mjs` | Pastas permitidas, limites de varredura, frontmatter | Escolha | `server/src/scan.mjs`, `locate.mjs` |
| `app.component.ts` | Todo o estado da tela, cópia do prompt e das skills | Montar prompt (exceto demonstração) | `frontend/src/app/app.component.ts` |
| `core/options.ts` | Opções, rótulos e descrições de cada seleção | Regras do pipeline | `frontend/src/app/core/options.ts` |
| `agent/` | Instruções e schemas lidos em tempo de execução | Código | `enhancer.mjs:11`, `selector.mjs:9` |

## 4) Padrões recorrentes

| Padrão | Onde | Por quê |
|--------|------|---------|
| Injeção de dependências por parâmetro `deps` | `enhance(request, { deps })`, `selectSkills(..., deps)`, `skillsStep(..., deps)` | Testar sem Vertex e sem disco real |
| Erros tipados com código estável | `VertexError`, `EnhanceError`, `HttpError`, `EnhanceFailure` (tela) | A tela escolhe mensagem e ação pelo código |
| Porta abstrata + implementação | `EnhanceApi` / `HttpEnhanceApi` em `enhance-api.ts`, ligada em `main.ts` | Trocar a origem do resultado sem mexer na tela |
| Configuração fora do código | `agent/config/agent.json`, `.env` | Model id e limites mudam sem editar código (`AGENTS.md`) |
| Cache com validade | `vertexStatus` (10 min se configurado, 30 s se não) | Evitar checar credencial a cada pedido |
| Import sob demanda | `google-auth-library` em `vertex.mjs`; módulos após `loadEnv()` em `index.mjs` | Servidor sobe sem a dependência; `.env` carregado antes de ler variáveis |

## 5) Riscos de arquitetura

- `app.component.ts` (358 linhas) concentra todo o estado e o `.scss` do componente tem 805 linhas: toda mudança de tela passa pelo mesmo arquivo.
- A demonstração reimplementa regras do aprimorador em `mock-enhancer.ts` (433 linhas), e as descrições das opções em `options.ts` resumem a mesma instrução. As duas podem divergir de `agent/prompts/system-instruction.md` sem que nenhum teste perceba.
- Sem marcador de projeto (`.cursor`, `.gemini`, `.agents`, `.agent`, `.git`), o projeto vira a pasta de execução. Hoje o `/api/health` informa `.../Zprompt/server`.

## 6) Evidência

- `server/src/index.mjs`, `server/src/enhancer.mjs`, `server/src/vertex.mjs`, `server/src/lint.mjs`
- `server/src/locate.mjs:6` (marcadores), `server/src/selector.mjs:32`
- `frontend/src/main.ts`, `frontend/src/app/core/enhance-api.ts`, `frontend/proxy.conf.js`
- Terminal: `GET /api/health` em 2026-11-09 com `projectSource: "pasta de execução, sem marcador de projeto"`
