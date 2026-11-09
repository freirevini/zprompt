# Servidor local

Executa o pipeline inteiro do aprimoramento: valida o pedido, retira segredos, faz a triagem, escolhe skills instaladas, chama o aprimorador no Vertex AI, valida a resposta e tenta de novo uma vez. Escuta só em `127.0.0.1`, porque lê pastas locais e gasta cota do Vertex.

## Rodar

```bash
cd server
npm install
npm start
```

Porta padrão `4300`, alterável com `ZPROMPT_API_PORT` no `.env` da raiz. O frontend chega nele pelo proxy `/api` do `ng serve`.

Sem `GOOGLE_CLOUD_PROJECT` ou sem credencial do Google, o servidor sobe mesmo assim: `POST /api/enhance` responde `503 VERTEX_NOT_CONFIGURED` com as skills já avaliadas, e a tela mostra um resultado de demonstração rotulado. Para usar o Gemini:

```bash
cp .env.example .env          # na raiz; preencha GOOGLE_CLOUD_PROJECT
gcloud auth application-default login
```

## Comandos

| Comando | Uso |
|---|---|
| `npm start` | Sobe o servidor |
| `npm test` | Testes automatizados; não precisam de Vertex nem de pasta de skills |
| `npm run eval` | Casos de regressão de `agent/examples/casos.json` contra o Vertex; sem Vertex, roda só os resolvidos pela triagem |
| `npm run eval -- diagnostico` | Só os casos cujo id contém o texto |
| `npm run skills -- cursor` | Lista a pasta de projeto detectada e as skills encontradas; também `antigravity` |

## Rotas

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/health` | Projeto detectado, estado do Vertex (projeto, credencial, região, modelo) e versões do agente. `?refresh` refaz a checagem |
| GET | `/api/skills?ide=cursor` | Todas as skills encontradas, com avisos de leitura |
| POST | `/api/enhance` | Pedido de `agent/config/request-schema.json`. Devolve `{ enhancement, skills, warnings, notices, meta }` |

Erros têm sempre `{ error, code }`. Códigos: `INVALID_REQUEST` 400 ou 413, `FORBIDDEN` 403 ou 415, `VERTEX_NOT_CONFIGURED` 503, `VERTEX_AUTH` 503, `VERTEX_BLOCKED` 422, `VERTEX_RATE_LIMIT` 429, `VERTEX_TIMEOUT` 504, `LINT_FAILED` 502 com `issues`.

## Pipeline de `/api/enhance`

1. Valida o pedido; campos desconhecidos são recusados.
2. Troca segredos aparentes por `[segredo-N]`. O Vertex nunca recebe o valor; o prompt final volta com o original.
3. Triagem sem modelo: saudação ou texto sem palavra vira `INSUFFICIENT`.
4. Skills, se ligadas. Falha ou pasta não encontrada não derruba o pedido: o aprimoramento segue sem skills e a resposta traz o motivo.
5. Aprimorador no Vertex, com `responseSchema`. Repete com espera crescente em 429, 5xx, rede e tempo esgotado, dentro de um prazo total de 150 s. `MAX_TOKENS` repete com o dobro do orçamento de saída.
6. Normalização determinística: função escolhida na tela, modo, instrução de modo, prefixo `/plan /grill-me ` do Antigravity, cercas em volta do prompt.
7. Lint: literais extraídos do rascunho, referências inventadas, bloco de código novo, tamanho, frases proibidas, skills citadas, seção de repasse no diagnóstico. Falha grave ou leve: uma nova tentativa com as falhas apontadas. Falha grave persistente: `LINT_FAILED`. Leve persistente: prompt entregue com `warnings`.
8. Uma linha de log por pedido, só com metadados: status, modelo, versão, tentativas, latência, tokens, quantidade de skills e códigos de aviso. Nada de rascunho, prompt ou nome de skill. `ZPROMPT_QUIET=1` desliga.

## Segurança

- Host diferente de `127.0.0.1`, `localhost` ou `[::1]` na porta do servidor: 403. Barra redirecionamento de DNS.
- `Origin` de fora de localhost: 403.
- POST exige `Content-Type: application/json` e o cabeçalho `x-zprompt: 1`; o navegador então pede permissão antes, e o CORS só libera localhost.
- Corpo acima de 1 MB: 413. JSON malformado: 400.

## Qual pasta ele lê

**Projeto.** Detectado a partir de onde o servidor é executado:
1. `ZPROMPT_PROJECT_DIR`, se definido.
2. Senão, a pasta onde você chamou o `npm`. Funciona também de fora: `npm --prefix /caminho/do/zprompt/server start` executado dentro do seu projeto lê aquele projeto.
3. A partir dela, sobe a árvore até achar `.cursor`, `.gemini`, `.agents`, `.agent` ou `.git`. A home do usuário nunca é tratada como projeto.

**Por IDE.**

| IDE | Projeto | Usuário |
|---|---|---|
| Cursor | `.cursor` | `~/.cursor` |
| Antigravity | `.gemini`, `.agents` e o legado `.agent` | `~/.gemini` |

**Pasta informada na tela.** Até 5 caminhos em `skillPaths`; aceita `~` e o próprio `SKILL.md`. Só pastas dentro da home, sem ser a home inteira, do projeto ou de `ZPROMPT_SKILL_ROOTS`. Pasta recusada ou inexistente volta com `needsPath: true` e o motivo em `problem`.

`ZPROMPT_SKILL_ROOTS` acrescenta outras pastas, separadas por `:` no macOS e Linux ou `;` no Windows.

## Como encontra skills

Qualquer `SKILL.md` até 10 níveis abaixo das pastas acima. Sem limite de quantidade de skills pertinentes, mas com teto de varredura: 20 mil pastas, 5 mil `SKILL.md`, 64 KB lidos por arquivo e 5 s. O corte vira aviso.

- Ignorados em qualquer profundidade: `node_modules`, `.git`, `__pycache__`, `.venv`, `venv`.
- Ignorados só logo abaixo da raiz: `extensions`, `CachedData` e `logs` em `.cursor`; `tmp`, `history` e histórico do Antigravity em `.gemini`.
- Link simbólico só é seguido para dentro da home ou da própria raiz.
- Mesmo nome em escopos diferentes: vale pasta informada, depois projeto, usuário e extra. Mesmo nome no mesmo escopo: vale o primeiro em ordem alfabética de caminho, com aviso.

## Agente seletor

Configuração em `agent/skills-selector/`. Recebe o catálogo inteiro, a função e a autonomia, e devolve todas as skills pertinentes, com evidência do rascunho e da descrição de cada uma.

- Catálogo grande é dividido em lotes avaliados por completo e unidos. Só `MAX_TOKENS` divide o lote ao meio; bloqueio do Vertex falha na hora. Todas as chamadas passam pelo mesmo limite de 4 em paralelo.
- Ids devolvidos pelo modelo são conferidos contra o catálogo; id inventado é descartado.
- Todo texto vindo do disco é escapado antes de entrar na mensagem.
- Sem Vertex, seleção por termos em comum, sem modelo, com `selector: "heuristic"`.
