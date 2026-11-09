# AGENTS.md

Zprompt reescreve prompts de desenvolvedores para os agentes do Cursor e do Antigravity. O aprimorador nunca gera código nem responde ao pedido; devolve só o prompt melhorado.

## Estrutura

- `agent/` — configuração do agente no Vertex AI: system instruction, schemas, `generationConfig`, casos de regressão. Contrato de execução em `agent/README.md`.
- `agent/skills-selector/` — agente que escolhe skills instaladas pertinentes ao rascunho.
- `server/` — servidor local Node, só em `127.0.0.1`: rota única `POST /api/enhance` com o pipeline inteiro (segredos, triagem, skills, aprimorador, lint). Detalhes em `server/README.md`.
- `frontend/` — Angular 15. Envia rascunho e configuração ao servidor pelo proxy `/api`; sem Vertex, mostra demonstração rotulada.
- `docs/` — pesquisa da Task 1 e revisões. Decisões posteriores em `.rules/decisoes.md` têm precedência sobre `docs/`.

## Comandos

- `cd server && npm test` — testes do servidor, sem Vertex e sem pasta de skills.
- `cd server && npm run eval` — casos de `agent/examples/casos.json` contra o Vertex.
- `cd frontend && npx ng build` — compila a tela com checagem estrita de templates.

## Regras

- Model id só via `GEMINI_MODEL`. Nunca literal no código.
- Não enviar `temperature`, `topP`, `topK`, `seed` nem `thinkingBudget` ao Vertex.
- Credenciais só no backend; nunca no Angular.
- Não persistir rascunhos, prompts nem respostas.
- Mudou `agent/prompts/` ou `agent/config/response-schema.json`: subir a versão em `agent/config/agent.json` e rodar `npm run eval`.
- Mudou `server/src/`: rodar `npm test`.
- Decisão nova de produto ou modelo: registrar em `.rules/decisoes.md` com data.
