# Agente aprimorador — contrato de execução

Dois agentes em sequência quando a opção de skills está ligada: o seletor em `skills-selector/` escolhe as skills instaladas pertinentes, e este aprimorador as incorpora no prompt. Com a opção desligada, só este agente roda. Quem orquestra é `server/src/enhancer.mjs`, na rota `POST /api/enhance`; o navegador só envia rascunho e configuração.

Este agente recebe rascunho e configuração e devolve JSON com o prompt reescrito para Cursor ou Antigravity. Não gera código, não responde ao pedido, não guarda interações.

## Arquivos

| Arquivo | Papel |
|---|---|
| `config/agent.json` | Model id, região, `generationConfig`, prazos, limites de pós-processamento, versões |
| `prompts/system-instruction.md` | System instruction completa, estável entre chamadas |
| `prompts/user-template.md` | Mensagem do usuário montada por chamada |
| `config/request-schema.json` | Contrato frontend → `POST /api/enhance` |
| `config/response-schema.json` | `responseSchema` enviado ao Vertex |
| `examples/casos.json` | Casos de regressão; executor em `npm run eval`, na pasta `server` |

## Funções

`auto`, `understand`, `start`, `implement`, `fix`, `review`, `test` e `keep-codebase-knowledge`. Esqueleto e modo de cada uma em `prompts/system-instruction.md`. `keep-codebase-knowledge` executa a tarefa do rascunho depois de ler `docs/codebase/`, os documentos da skill `acquire-codebase-knowledge`; a natureza da tarefa define esqueleto e modo. As descrições mostradas na tela ficam em `frontend/src/app/core/options.ts` e acompanham a instrução.

## Chamada ao Vertex

- Modelo: `GEMINI_MODEL`, padrão `gemini-3.8-flash`, GA. Região: `VERTEX_LOCATION`, padrão `global`. Em `us` e `eu`, o host é `aiplatform.us.rep.googleapis.com` ou `aiplatform.eu.rep.googleapis.com`; `VERTEX_API_HOST` sobrescreve.
- `systemInstruction`: conteúdo de `system-instruction.md`, sem alteração por chamada.
- `contents`: um único turno `user` com `user-template.md` preenchido. A nova tentativa também é um turno único, com as falhas e o prompt anterior anexados; não depende de assinaturas de pensamento.
- `generationConfig`: o de `agent.json`, mais `responseSchema` = conteúdo de `response-schema.json`.
- **Não enviar** `temperature`, `topP`, `topK`, `seed`, `candidateCount`, penalties nem `thinkingBudget`. O 3.8 Flash ignora amostragem; `thinkingBudget` junto de `thinkingLevel` dá erro; `MINIMAL` dá erro neste modelo.
- `thinkingLevel: MEDIUM` é o default do modelo, escrito por clareza.
- Repetição de rede: até `runtime.networkRetries` vezes em 429, 5xx, falha de rede e tempo esgotado, com espera crescente, dentro de `runtime.deadlineSeconds` para o pedido inteiro.
- Credencial só no backend. Navegador nunca fala direto com o Vertex.

## Montagem da mensagem

1. Validar o pedido contra `request-schema.json`; campos desconhecidos são recusados.
2. Trocar segredos aparentes por `[segredo-N]`, uma vez, para os dois agentes. O valor original volta ao prompt final, que fica na máquina.
3. Mapear: `ide` → `{{ide}}`; `function` → `{{funcao}}`; `scope` → `{{escopo}}`; `autonomy` → `{{autonomia}}`; `preserveBehavior` → `sim` ou `nao`.
4. `{{skills}}`: uma linha por skill, `- nome: ... | motivo: ... | descrição: ...`, sem cortar a lista. Texto vindo do disco tem `<` e `>` escapados, espaços achatados e `|` trocado por `/`.
5. `{{rascunho}}`: tags dos blocos da mensagem, como `</rascunho>`, viram `<\/rascunho>`. Outros `<` e `>` ficam intactos, porque são literais.
6. Substituição por função: `$&` e afins no rascunho não viram padrão.

## Pós-processamento

Em `server/src/lint.mjs`. Primeiro a normalização, que não depende de julgamento:

- `function` diferente de `auto`: `detectedFunction` é a escolhida e `functionSource = selected`.
- `UNCHANGED` ou `INSUFFICIENT`: `prompt` = rascunho original.
- Rota: `routedToPlanning` vale quando o modelo marca rota, recomenda `plan` ou a função é `start`. Com rota: modo `plan`; no Cursor, `modeInstruction` "Ative o Plan Mode com Shift+Tab antes de enviar."; no Antigravity, prefixo `antigravityRoutePrefix` garantido e `modeInstruction` vazio. Sem rota: prefixo removido; Antigravity não usa `ask`; Cursor `ask` recebe "Envie no modo Ask.".
- `autonomy = diagnosticar`: sem rota e sem prefixo; Cursor `ask` com "Envie no modo Ask, que não edita arquivos."; Antigravity `agent`.
- Cercas de código e aspas em volta do prompt inteiro são removidas.

Depois as verificações. **Graves** impedem a entrega; **leves** viram aviso na tela se persistirem:

| Verificação | Tipo |
|---|---|
| Resposta fora do schema ou `MAX_TOKENS` | grave |
| `UNCHANGED` com `diagnosticar`, com a função `keep-codebase-knowledge` ou com skills selecionadas | grave |
| Função `keep-codebase-knowledge` sem citar `docs/codebase/` no prompt | grave |
| Prompt vazio | grave |
| Bloco de código que não estava no rascunho | grave |
| Literal do rascunho ausente: caminhos, erros, identificadores, versões, URLs, trechos entre crases e marcadores `[segredo-N]`, extraídos do rascunho e não da lista do modelo | grave |
| Caminho, arquivo ou URL fora do rascunho; aceitos os arquivos de convenção `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md` as pastas `.cursor/rules`, `.agents/rules` e afins, e `docs/codebase/` com seus sete documentos | grave |
| Tamanho acima do limite | leve |
| Frase de `forbiddenPhrases` | leve |
| Skill selecionada que não aparece no prompt | leve |
| Diagnóstico sem a seção "Prompt de implementação" | leve |

Limite de palavras, sem o prefixo: `diagnosticar` → `maxWordsDiagnosis`; função `start` → `maxWordsStart`; demais → `min(maxWordsDefault, max(minWordsCeiling, lengthMultiplier × palavras do rascunho))`. Nunca menos que as palavras do rascunho mais `minWordsCeiling`. Cada skill soma `wordsPerSkill`.

Qualquer falha: uma nova tentativa (`runtime.retries`) com as falhas listadas e o prompt anterior. Entrega a melhor tentativa sem falha grave; se nenhuma, `LINT_FAILED` com as falhas em linguagem de tela.

## Resposta ao frontend

`{ enhancement, skills, warnings, notices, meta }`. `enhancement` é o JSON normalizado, com o prompt já com os segredos devolvidos e `preservedLiterals` extraídos do rascunho. `changes`, `intentQuote` e `agentMustDetermine` não aparecem na tela; ficam como evidência para auditoria e para os casos de regressão. `meta` traz fonte, modelo, versões, tentativas e latência.

## Sem armazenamento

Não persistir rascunho, prompt nem resposta. Log técnico só com: model id, `promptVersion`, status, latência, tokens, tentativas, quantidade de skills e códigos de aviso.

## Cache

System instruction é o prefixo estável; rascunho vem por último. O tamanho atual provavelmente fica abaixo do mínimo de cache implícito do 3.8 Flash, 6.144 tokens. Medir com `usageMetadata` antes de investir em cache explícito.

## Ao mudar algo

- Prompt ou schema: subir `promptVersion` ou `schemaVersion` e rodar `npm run eval` na pasta `server`.
- Lint ou normalização: rodar `npm test` na pasta `server`.
- Model id: conferir estágio e região na página do modelo, rodar os casos e registrar em `.rules/decisoes.md`.
