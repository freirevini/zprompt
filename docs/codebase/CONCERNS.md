# Pontos de atenção

Não há histórico git, então não existe sinal de churn. O código de produção não tem nenhum `TODO`, `FIXME` ou `HACK` (busca em `server/src`, `frontend/src` e `agent`). Os itens abaixo vêm da leitura do código e do terminal.

## 1) Riscos principais

| Severidade | Ponto | Evidência | Impacto | Ação sugerida |
|------------|-------|-----------|---------|---------------|
| Alta | Prompt e lint nunca foram validados contra o modelo real | `agent/examples/casos.json`; saída do `npm run eval` em 2026-11-06: 1 ok, 12 pulados; sem `.env` | Instrução, schema e lint podem rejeitar respostas boas (`LINT_FAILED`) ou aceitar ruins | Criar `.env`, rodar `npm run eval`, ajustar |
| Média | Sem controle de versão | scan: "No commits found" | Nenhum histórico para desfazer mudanças; a cópia anterior é temporária | `git init` local; [ASK USER] |
| Média | Seleção heurística aceita palavras comuns | `server/src/selector.mjs`, lista `STOP`; teste na tela em 2026-11-09 escolheu `security-gemini-prompt` por "antes, cada" | Skills irrelevantes entram no prompt quando o Vertex está desligado | Ampliar a lista de palavras ignoradas em português |
| Média | Sem marcador, o projeto vira a pasta de execução | `server/src/locate.mjs:6,33`; `/api/health` devolve `.../Zprompt/server` | Skills do projeto são procuradas em `server/.cursor` | Definir `ZPROMPT_PROJECT_DIR` quando houver projeto; [ASK USER] sobre o comportamento sem marcador |
| Baixa | Angular 15 em Node 26 | `frontend/package.json`, `node -v` | Fora de suporte; atualização do Node pode quebrar o build | `.nvmrc` com Node 18 ou migrar o Angular; [ASK USER] |

## 2) Dívida técnica

| Item | Por que existe | Onde | Risco | Correção sugerida |
|------|----------------|------|-------|-------------------|
| Demonstração duplica regras do aprimorador | Tela precisava funcionar sem Vertex | `frontend/src/app/core/mock-enhancer.ts` (433 linhas) | Diverge da instrução real em silêncio | Manter rotulada; testar ou reduzir |
| Descrições das opções resumem a instrução | Explicar cada seleção na tela | `frontend/src/app/core/options.ts` (`FUNCTION_HINT` e afins) | Tela promete um comportamento que o prompt não tem | Revisar junto com cada mudança de `system-instruction.md` |
| Componente único com todo o estado | Tela de uma página | `frontend/src/app/app.component.ts` (358), `.scss` (805) | Mudanças concentradas num arquivo | Extrair blocos (skills, resultado) quando crescer |
| Sem linter nem formatador | Não configurado | raiz, `server/`, `frontend/` | Estilo depende de disciplina | ESLint e Prettier, se o dono quiser |
| Tela sem testes | Sem alvo `test` | `frontend/angular.json` | Regressão visual e de fluxo só aparece no navegador | [ASK USER] |

## 3) Segurança

| Risco | OWASP | Evidência | Mitigação atual | Lacuna |
|-------|-------|-----------|-----------------|--------|
| Outra página em localhost chama a API | A01 | `server/src/http.mjs`, `LOCAL_ORIGIN` aceita qualquer porta de localhost | Host restrito (contra DNS rebinding), `x-zprompt` obrigatório, só `127.0.0.1` | Qualquer app local, como os dev servers nas portas 4200, 8080 e 8081, pode gastar a cota do Vertex e ler a lista de skills |
| Mensagem de erro interna devolvida ao cliente | A05 | `server/src/index.mjs:86` (`err.message` no 500) | Servidor só local | Pode expor caminho ou detalhe interno |
| Leitura de pastas informadas pelo usuário | A01 | `server/src/locate.mjs` `manualRoots` | Só home (não a home inteira), projeto ou `ZPROMPT_SKILL_ROOTS`; links simbólicos só para dentro; limites de varredura | — |
| Segredos no rascunho | A02 | `server/src/text.mjs` | Trocados por `[segredo-N]` antes do Vertex | Padrões cobrem formatos conhecidos; segredo fora do padrão segue |
| Injeção de prompt pelo rascunho ou pelo `SKILL.md` | N/A (LLM01) | `text.mjs` `neutralizeTags`, `escapeData` | Tags neutralizadas, catálogo escapado, lint barra código novo e referências inventadas | Validação contra o modelo pendente (item 1) |

## 4) Desempenho

| Ponto | Evidência | Sintoma | Risco | Melhoria |
|-------|-----------|---------|-------|----------|
| Varredura de skills a cada pedido | `skills.mjs` chama `scanSkills` sempre | Até 5 s por pedido no pior caso | Pastas grandes deixam o pedido lento | Cache curto por pasta |
| Pedido com Vertex é sequencial: seletor e depois aprimorador | `enhancer.mjs` | Latência soma as duas chamadas e as novas tentativas, até 150 s | Normal: o aprimorador depende das skills | Medir com `npm run eval` antes de mexer |

## 5) Áreas frágeis

| Área | Por que é frágil | Sinal | Como mexer |
|------|------------------|-------|------------|
| `server/src/lint.mjs` | Expressões regulares que decidem se o prompt é entregue; `ERROR_RE` já foi reescrita por falso positivo | Histórico em `docs/05-revisao-arquitetura.md` 5.12 (sem git) | Teste de regressão em `lint.test.mjs` antes de cada mudança |
| `agent/prompts/system-instruction.md` com `lint.mjs` | Limites de palavras e regras duplicadas entre o texto do prompt e o código | `agent/config/agent.json` `postProcessing` | Mudar os dois juntos, subir `promptVersion`, rodar `npm run eval` |
| `mock-enhancer.ts` e `options.ts` | Cópia das regras para a demonstração e resumo delas nas descrições | Item 2 | Conferir na tela depois de mudar a instrução |

## 6) Perguntas para o dono [ASK USER]

1. [ASK USER] Inicializar git local agora? O repositório no GitHub segue como decisão sua.
2. [ASK USER] Sem marcador de projeto, o servidor deve usar a pasta de execução, como hoje, ou não ler skills de projeto?
3. [ASK USER] Fixar Node 18 com `.nvmrc` para o Angular 15, ou aceitar Node 26?
4. [ASK USER] Restringir a origem aceita à porta do `ng serve`, para que outros apps locais não chamem a API?
5. [ASK USER] A tela deve ganhar testes automatizados?
6. [ASK USER] Decisões pendentes da revisão: D1 (sonda do projeto), D3 (modelo que vai executar), D4 ("Executar relatório aprovado"), D6 (chips de skills).

## 7) Evidência

- Scan: seções TODO, git e lint (o arquivo do scan foi descartado: 10 MB, quase todo cache do `.angular`)
- `server/src/http.mjs`, `server/src/index.mjs:86`, `server/src/locate.mjs`, `server/src/selector.mjs`, `server/src/lint.mjs`
- `frontend/src/app/core/mock-enhancer.ts`, `frontend/angular.json`, `agent/examples/casos.json`
- Terminal: `npm test` e `/api/health` em 2026-11-09
