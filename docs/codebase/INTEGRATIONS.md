# Integrações

## 1) Inventário

| Sistema | Tipo | Para quê | Autenticação | Criticidade | Evidência |
|---------|------|----------|--------------|-------------|-----------|
| Vertex AI `generateContent` (modelo de `GEMINI_MODEL`, padrão `gemini-3.8-flash`) | API HTTPS | Aprimorador e seletor de skills | OAuth via `google-auth-library` (ADC ou `GOOGLE_APPLICATION_CREDENTIALS`), escopo `cloud-platform` | Alta: sem ela só há demonstração | `server/src/vertex.mjs:65,93`, `agent/config/agent.json` |
| Sistema de arquivos local (`~/.cursor`, `~/.gemini`, pastas do projeto, `ZPROMPT_SKILL_ROOTS`) | Leitura de disco | Catálogo de `SKILL.md` | Permissões do usuário; caminhos restritos à home, ao projeto ou às raízes extras | Média: falha vira aviso | `server/src/locate.mjs`, `scan.mjs` |
| Servidor local `127.0.0.1:4300` | HTTP interno | Tela chama pelo proxy do `ng serve` (Vite; responde 500 quando o servidor está desligado, e a tela mostra "servidor local não respondeu") | Guarda de Host/Origin e cabeçalho `x-zprompt` | Alta para a tela | `frontend/proxy.conf.js`, `server/src/http.mjs` |

Host do Vertex: `aiplatform.googleapis.com` em `global`; `aiplatform.{us,eu}.rep.googleapis.com` em `us` e `eu`; `VERTEX_API_HOST` sobrescreve (`vertexHost`, `vertex.mjs:22`).

## 2) Armazenamento de dados

| Armazenamento | Papel | Acesso | Risco | Evidência |
|---------------|-------|--------|-------|-----------|
| Nenhum banco | Sem persistência de interações, por decisão | — | — | `agent/config/agent.json` (`storeInteractions: false`), `.rules/decisoes.md` |
| Memória do processo | Cache do status do Vertex | `vertexStatus` | Status fica velho até 10 min; `?refresh` força nova checagem | `server/src/vertex.mjs:6-7` |

## 3) Segredos e credenciais

- Fontes: `.env` na raiz (no `.gitignore`), ADC do gcloud, ou arquivo de conta de serviço (`*.key.json` e `service-account*.json` no `.gitignore`).
- Busca por valores fixos no código: nenhuma credencial encontrada; o único endereço fixo é o escopo OAuth público.
- Segredos digitados no rascunho são trocados por `[segredo-N]` antes de ir ao Vertex (`server/src/text.mjs`).
- Rotação: [TODO] fica a cargo do gcloud ou da conta de serviço; nada no projeto.

## 4) Confiabilidade

- Novas tentativas de rede: até `networkRetries: 2` para 429, 5xx, rede, timeout, resposta vazia ou JSON inválido. Espera `min(8000, 800·2^n)` ms mais variação aleatória, respeitando o prazo total (`vertex.mjs`).
- Timeout: 30 s por chamada do aprimorador, 60 s do seletor, prazo total de 150 s por pedido (`agent.json` de cada agente).
- Bloqueio de segurança (`SAFETY` e afins) falha na hora; `MAX_TOKENS` dobra `maxOutputTokens` até 65536.
- Plano B: sem Vertex, a seleção de skills é heurística e o prompt é a demonstração da tela. Não há circuit breaker.

## 5) Observabilidade

- Log: linha JSON por pedido com status, fonte, modelo, tentativas, latência, tokens, quantidade de skills e códigos de aviso (`enhancer.mjs` `logLine`). Erros inesperados vão para `console.error` (`index.mjs`).
- Métricas e tracing: nenhum.
- Lacunas: chamadas do seletor não geram log próprio; não há registro do motivo de cada nova tentativa de rede.

## 6) Evidência

- `server/src/vertex.mjs`, `server/src/selector.mjs`, `server/src/enhancer.mjs`
- `.env.example`, `.gitignore`, `agent/config/agent.json`, `agent/skills-selector/agent.json`
- `frontend/proxy.conf.js`, `server/src/http.mjs`
