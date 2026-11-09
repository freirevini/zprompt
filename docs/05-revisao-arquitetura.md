# 5. Revisão de arquitetura e lógica

**Projeto:** Zprompt · 2026-11-06 · Revisão estática: nada foi executado nesta sessão, porque terminal e navegador estão bloqueados. Bugs de código encontrados por um revisor independente estão na seção 5.8.

Prioridade: **P0** bloqueia a efetividade do aprimoramento; **P1** reduz a qualidade do prompt gerado; **P2** refino, manutenção ou risco futuro. Esforço: **P** pequeno, **M** médio, **G** grande.

---

## 5.1 Veredito

O desenho do método está certo: contorno da tarefa, rota para planejamento nativo, modo de diagnóstico para repasse a um modelo mais barato e incorporação de skills. As instruções dos agentes são detalhadas e coerentes na maior parte.

O aprimoramento ainda **não pode ser efetivo** por cinco motivos, em ordem de impacto:

1. **O aprimorador real não existe.** A tela usa uma simulação em TypeScript. O agente configurado no Vertex nunca é chamado por nenhum código. Não há como o prompt ser melhor do que regras de texto fixas.
2. **O aprimorador não conhece o projeto.** O servidor já sabe qual é a pasta do projeto, mas só usa isso para skills. Sem fatos do projeto, o prompt fica genérico: "rode os testes do projeto" em vez do comando real, nenhuma convenção do `AGENTS.md`, nenhuma checagem de que um arquivo citado existe. É a fraqueza central do Kilo, que o benchmark apontou.
3. **As regras do aprimorador se contradizem.** Regras "invioláveis" de prioridade alta proíbem o que seções posteriores exigem. O modelo pode seguir a regra errada.
4. **A validação planejada rejeitaria prompts corretos.** Arquivos de convenção citados de propósito e listas longas de skills seriam tratados como erro, devolvendo o rascunho original ao usuário.
5. **Não há medição.** Casos de regressão existem, mas nenhum executor. Sem armazenar interações, a única forma de provar efetividade é avaliação offline, que ainda não existe.

---

## 5.2 Arquitetura atual

```
Navegador (Angular)                                   Servidor local (Node)              Vertex AI
┌──────────────────────────────┐   /api/skills/suggest  ┌─────────────────────────┐
│ formulário                   │ ─────────────────────▶ │ detecta projeto         │
│ orquestra: skills, depois    │                        │ varre SKILL.md          │ ──▶ seletor
│ aprimorador                  │ ◀───────────────────── │ chama seletor           │
│ aprimorador SIMULADO em TS   │                        └─────────────────────────┘
└──────────────────────────────┘
                                         agent/prompts e agent/config: configuração sem código que a use
```

Pontos fracos estruturais:
- Lógica de produto no navegador: ordem das etapas, política de falha e montagem do pedido ficam em `frontend/src/app/app.component.ts:175-217`. Qualquer outro cliente teria de reimplementar.
- Duas fontes de verdade para o comportamento do aprimorador: a instrução do agente e a simulação. Já divergem.
- Contratos mantidos à mão em três lugares: schemas JSON, tipos do frontend e respostas do servidor.

---

## 5.3 Arquitetura alvo

```
Navegador (Angular)              Servidor local, 127.0.0.1                                   Vertex AI
┌──────────────────┐ POST        ┌──────────────────────────────────────────────────────┐
│ formulário       │ /api/enhance│ 1. valida e redige segredos, uma vez, para tudo       │
│ preview e copiar │ ──────────▶ │ 2. triagem determinística: vazio, saudação, bypass    │
│ skills em chips, │             │ 3. classificação da função, uma vez ─────────────────▶│ só se ambíguo
│ removíveis       │             │ 4. sonda do projeto, com cache                         │
│                  │ ◀────────── │ 5. catálogo de skills e regras, com cache ───────────▶│ seletor
└──────────────────┘ resposta    │ 6. montagem modular da instrução do aprimorador        │
                     única       │ 7. aprimorador ──────────────────────────────────────▶│ aprimorador
                                 │ 8. lint determinístico, uma nova tentativa             │
                                 │ 9. log só de metadados                                 │
                                 └──────────────────────────────────────────────────────┘
```

Princípios:
- **Um endpoint, um pipeline.** O navegador só envia configuração e mostra resultado.
- **Fatos antes de texto.** Tudo que o aprimorador pode afirmar sobre o projeto vem da sonda; o resto vira instrução para o agente do IDE descobrir.
- **Uma classificação para todos.** Seletor, aprimorador e tela usam a mesma função detectada.
- **Instrução montada por pedido.** Regras-núcleo sem exceções, mais só os módulos que se aplicam: função, autonomia, skills, contexto do projeto.
- **Validação que não confia no modelo.** O lint extrai do rascunho o que deve ser preservado, em vez de confiar na lista devolvida pelo modelo.

---

## 5.4 Melhorias de arquitetura

### A1 · P0 · M · Implementar o aprimorador real no servidor
- **Problema:** `frontend/src/main.ts:13` injeta `MockEnhanceApi`. `server/src/index.mjs` só tem as rotas de saúde e skills. Nada carrega `agent/prompts/system-instruction.md`.
- **Efeito:** a efetividade depende de regras fixas e expressões regulares, não do modelo.
- **Proposta:** rota `POST /api/enhance` que executa o pipeline da seção 5.3, reaproveitando `vertex.mjs`. Implementação HTTP de `EnhanceApi` no frontend, troca de provider em `main.ts`.

### A2 · P0 · P · Tirar a orquestração do navegador
- **Problema:** a sequência skills e aprimorador, com a política de erro, está no componente da tela.
- **Proposta:** a rota única de A1 devolve aprimoramento, skills usadas e resumo do contexto. O componente perde a cadeia de chamadas.
- **Ganho adicional:** redação de segredos acontece uma vez e vale para os dois agentes. Hoje o rascunho vai ao seletor sem redação, em `server/src/selector.mjs:97`.

### A3 · P0 · M · Sonda do projeto como contexto barato e certo
- **Problema:** o servidor resolve a pasta do projeto em `server/src/locate.mjs:22-43`, mas o aprimorador recebe só rascunho e configuração.
- **Efeito:** prompt sem comando de teste real, sem convenções, sem checagem de existência de arquivos.
- **Proposta:** coleta determinística, até 2 s, com cache:
  - existência e trechos curtos de `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules`, `.agents/rules`;
  - gerenciador de pacotes e scripts de teste, lint e build, de `package.json`, `pyproject.toml`, `Makefile` e equivalentes;
  - framework de teste;
  - branch atual e nomes dos arquivos alterados;
  - pastas de topo.
  Entra como bloco `<projeto>` na mensagem. A instrução passa a permitir citar esses fatos e só eles.
- **Compatível com decisões anteriores:** não é campo de colar erro, é leitura automática do projeto local, como já acontece com as skills. Ver decisão D1.

### A4 · P1 · M · Fonte única das funções
- **Problema:** o comportamento de cada função está escrito em cinco lugares: a instrução do aprimorador, a simulação, os rótulos da tela, o critério do seletor e o catálogo em `docs/03`. Já divergiram: a simulação põe o parágrafo de skills depois da verificação, em `mock-enhancer.ts:80`, e ignora o escopo em Corrigir erro, em `mock-enhancer.ts:181-195`.
- **Proposta:** um arquivo por função em `agent/functions/`, com sinais de classificação, esqueleto de execução, investigação de diagnóstico, seção específica do relatório, modo por IDE e tipo de skill que a função pede. Um script monta a instrução do aprimorador e gera os rótulos da tela. A simulação vira um conjunto de respostas fixas, sem reimplementar regras.

### A5 · P1 · M · Montagem modular da instrução
- **Problema:** uma instrução única com regras "invioláveis" no topo e exceções em seções distantes. É a origem do conflito L1.
- **Proposta:** regras-núcleo curtas e sem exceção; módulos inseridos só quando se aplicam: guia da função detectada, módulo de autonomia, módulo de skills, módulo de contexto do projeto. Instrução menor e sem contradição.
- **Custo:** o prefixo deixa de ser idêntico entre chamadas. Sem perda prática: a instrução atual já fica abaixo do mínimo de cache do modelo, como registra `agent/README.md:61`.

### A6 · P1 · P · Classificação única antes dos agentes
- **Problema:** com "Detectar", o seletor recebe `auto` em `server/src/index.mjs:86`. Seu critério de processo exigido pela função fica sem efeito. A tela mostra a função detectada pelo aprimorador, que pode diferir da que o seletor supôs.
- **Proposta:** etapa 3 da seção 5.3. Sinais determinísticos primeiro; chamada barata ao modelo só quando ambíguo. Perfil "triagem" da skill de configuração Vertex. O resultado alimenta seletor, aprimorador e tela.

### A7 · P1 · P · Contratos tipados e validados
- **Problema:** `frontend/src/app/core/models.ts` espelha os schemas à mão. A resposta de `/api/skills/suggest` não tem schema e traz campos fora dos tipos, como `scanErrors` e `model`.
- **Proposta:** schemas JSON como fonte; tipos TypeScript gerados; validação em tempo de execução das respostas do Vertex e das respostas do servidor; schema para a resposta de skills.

### A8 · P1 · M · Avaliação embutida
- **Problema:** `agent/examples/casos.json` sem executor; chaves de verificação criadas caso a caso.
- **Proposta:** executor em `eval/` contra `/api/enhance`, com verificações determinísticas; obrigatório a cada mudança de versão do prompt ou do schema. Detalhe na seção 5.9.

### A9 · P2 · P · Cache do catálogo de skills
- **Problema:** cada pedido varre de novo as pastas, em `server/src/index.mjs:72`. A pasta do Antigravity na home pode conter histórico grande.
- **Proposta:** cache em memória por pasta, invalidado por data de modificação ou a cada minuto, com botão de recarregar. Catálogo estável também favorece o cache implícito do modelo.

### A10 · P2 · P · Log técnico implementado
- **Problema:** o contrato prevê log só de metadados, em `agent/README.md:57`, mas nada foi implementado.
- **Proposta:** uma linha por pedido com versões, modelo, status, latência e tokens, sem conteúdo. Necessário para medir custo e latência na avaliação.

---

## 5.5 Melhorias de lógica do aprimorador

### L1 · P0 · P · Regras invioláveis em conflito com as exceções
- **Evidência:** `agent/prompts/system-instruction.md:7` diz que a regra de número menor vence. A regra 5, linha 13, manda devolver inalterado; a regra 6, linha 14, limita a 250 palavras. Depois, a linha 141 proíbe inalterado e permite 450 palavras no diagnóstico, e a linha 150 proíbe inalterado quando há skills.
- **Proposta:** escrever as exceções dentro das regras 5 e 6, ou resolver por A5.

### L2 · P0 · P · Validação rejeitaria arquivos de convenção citados de propósito
- **Evidência:** `agent/README.md:44` rejeita caminho que não está no rascunho. O esqueleto de Iniciar projeto, `system-instruction.md:47`, e o diagnóstico, linha 96, citam `AGENTS.md` e regras do IDE. A simulação também, em `mock-enhancer.ts:153` e `:284`.
- **Proposta:** aceitar caminho se estiver no rascunho ou existir no projeto, conforme a sonda de A3, ou se for arquivo de convenção conhecido.

### L3 · P0 · P · Limite de tamanho contra skills sem limite
- **Evidência:** `agent/README.md:45` limita palavras; `system-instruction.md:147` manda incorporar todas as skills.
- **Efeito:** com muitas skills, o lint falha duas vezes e o usuário recebe o rascunho original.
- **Proposta:** excluir o parágrafo de skills da contagem, ou incorporar as skills numa lista compacta com nome e motivo curto.

### L4 · P1 · P · Lint de preservação confia no próprio modelo
- **Evidência:** `agent/README.md:43` confere os itens de `preservedLiterals`, que o próprio modelo escolhe listar. Um literal descartado simplesmente não seria listado.
- **Proposta:** o lint extrai do rascunho caminhos, trechos entre crases, mensagens de erro, URLs e versões, como já faz `extractLiterals` na simulação, e confere todos no prompt.

### L5 · P1 · P · Campos de saída sem uso
- **Evidência:** `changes` e `agentMustDetermine` continuam no schema de resposta, mas saíram da tela, conforme `.rules/decisoes.md:32`, e o lint não os usa. `agent/README.md:53` ainda diz que a tela os mostra.
- **Efeito:** mais tokens de saída, mais latência e atenção do modelo desviada do prompt.
- **Proposta:** remover os dois do schema, ou manter só sob um modo de depuração. Atualizar o contrato.

### L6 · P1 · P · Modelo que vai executar o prompt é desconhecido
- **Problema:** o fluxo pedido é modelo forte para investigar e modelo barato para implementar. Modelos rápidos e agentivos precisam de passos ordenados e restrições explícitas; modelos de raciocínio rendem mais com objetivo e critérios de aceite. A pesquisa B e a skill de prompts para Cursor corporativo registram essa calibração.
- **Proposta:** opção "Modelo que vai executar": forte ou econômico. Ajusta a densidade do esqueleto. No diagnóstico, a seção de prompt de implementação passa a ser escrita explicitamente para o modelo econômico.

### L7 · P1 · M · Fechar o repasse com uma função de execução
- **Problema:** o diagnóstico pede ao modelo forte que escreva o prompt de implementação. Não há função que receba o relatório aprovado e gere o prompt de execução sob as mesmas regras de escopo, comportamento, skills, IDE e verificação.
- **Proposta:** função "Executar relatório aprovado". Entrada: o relatório. Saída: prompt para o modelo econômico seguir os passos aprovados em ordem, verificar cada um, parar em divergência e não fazer nada além do relatório. Exige aumentar o limite de 8.000 caracteres do rascunho, em `agent/config/request-schema.json` e `server/src/index.mjs:113`.

### L8 · P1 · P · Regra 2 ambígua no modo de diagnóstico
- **Evidência:** `system-instruction.md:10` proíbe "diagnóstico" no prompt. O modo de diagnóstico pede diagnóstico ao agente do IDE.
- **Proposta:** especificar que a proibição é ao diagnóstico do próprio aprimorador.

### L9 · P2 · P · Sintaxe de invocação de skills não verificada
- **Evidência:** `system-instruction.md:148` gera "Use a skill `nome`".
- **Risco:** no Cursor, algumas skills só carregam com `/nome`; no Antigravity, por decisão do modelo a partir da descrição. Sem verificar, parte das skills pode não ser carregada.
- **Proposta:** confirmar no spike de integração e emitir a sintaxe nativa por IDE.

### L10 · P2 · M · Regras do projeto como referência
- **Problema:** o método recomenda anexar regras manuais relevantes por menção, `@regra` no Cursor e `@rules:` no Antigravity. Só skills são lidas hoje.
- **Proposta:** estender o catálogo às regras com descrição em `.cursor/rules` e `.agents/rules`. O seletor escolhe; o aprimorador cita por menção, sem copiar conteúdo. Restrições do projeto entram sem inflar o prompt.

### L11 · P2 · P · Diagnóstico no Antigravity e o artefato de plano
- **Observação:** o plano do Antigravity já é um relatório revisável com comentários e aprovação. Usar `/plan` no diagnóstico daria aprovação nativa, mas a execução seguiria no mesmo modelo forte, contra o objetivo de repassar a um modelo barato.
- **Proposta:** manter como está e avaliar no spike. Ver decisão D5.

### L12 · P2 · P · Isolamento dos blocos de dados
- **Problema:** descrições de skills vêm do disco e podem conter `</skills_selecionadas>` ou `</rascunho>`.
- **Proposta:** escapar `<` e `>` em todo texto vindo de skills, regras e rascunho antes de montar a mensagem.

---

## 5.6 Melhorias de lógica do seletor de skills

### S1 · P1 · P · Seletor sem a autonomia
- **Evidência:** `server/src/selector.mjs:93-99` envia só IDE, função e rascunho.
- **Efeito:** com "Só diagnosticar", o seletor não sabe que deve preferir skills de investigação, depuração e revisão às de geração de código.
- **Proposta:** enviar a autonomia e acrescentar o critério à instrução do seletor. Com A6, enviar também a função já detectada.

### S2 · P1 · P · Escape incompleto no catálogo
- **Evidência:** `server/src/selector.mjs:184-186` escapa só a tag de skill.
- **Proposta:** escapar `<` e `>` em nome, descrição e quando usar, ou serializar o catálogo em JSON.

### S3 · P1 · P · Concorrência sem limite e sem nova tentativa
- **Evidência:** a divisão ao meio em `server/src/selector.mjs:69-72` usa chamadas paralelas fora do limitador de `mapLimit`. `server/src/vertex.mjs` não repete em erro 429 ou 5xx.
- **Efeito:** catálogo grande pode disparar chamadas demais, receber limite de taxa e derrubar o pedido inteiro.
- **Proposta:** passar as divisões pelo mesmo limitador; repetir com espera crescente em 429, 500, 503 e tempo esgotado.

### S4 · P2 · P · Pasta manual vale para o IDE errado
- **Evidência:** `frontend/src/app/app.component.ts:180` envia a pasta manual sem considerar o IDE.
- **Proposta:** guardar a pasta por IDE, ou limpá-la ao trocar de IDE.

### S5 · P2 · P · Revisão das skills pelo usuário
- **Problema:** as skills escolhidas entram no prompt sem o usuário poder remover alguma.
- **Proposta:** chips removíveis; remover reaprimora só a última etapa. Ser humano no meio melhora a precisão sem custo de modelo.

### S6 · P2 · P · Seleção sem modelo é ruidosa
- **Evidência:** `server/src/selector.mjs:139-159` aceita duas palavras em comum ou uma palavra do nome.
- **Proposta:** sem credenciais, não incorporar automaticamente: mostrar as candidatas para o usuário marcar.

---

## 5.7 Servidor e frontend

### X1 · P1 · P · Servidor local aceita pedidos de qualquer site
- **Evidência:** `server/src/index.mjs:124-146` aceita qualquer tipo de conteúdo e `:153-160` não confere o cabeçalho Host.
- **Cenário:** uma página maliciosa envia formulário com texto simples para `127.0.0.1:4300`; não há verificação prévia do navegador, então o pedido chega e gasta cota do Vertex. Com redirecionamento de DNS para o próprio computador, consegue também ler caminhos da home e a lista de skills.
- **Proposta:** exigir `Content-Type: application/json` e um cabeçalho próprio, e recusar Host diferente de `127.0.0.1` ou `localhost` na porta do servidor.

### X2 · P1 · P · Falha no seletor derruba o aprimoramento
- **Evidência:** `frontend/src/app/app.component.ts:212-215` encerra com erro se as skills falharem.
- **Proposta:** aprimorar sem skills e avisar; o usuário não perde o resultado principal.

### X3 · P2 · P · Projeto fixo na inicialização
- **Evidência:** `server/src/index.mjs:17` resolve o projeto uma vez.
- **Proposta:** mostrar o projeto detectado na tela e permitir trocar o caminho, como já acontece com a pasta de skills. Com A3, isso passa a importar mais.

### X4 · P2 · P · Bloco de skills aparece em rascunho sem tarefa
- **Problema:** o bloco fica fora dos ramos de status na tela de resultado.
- **Proposta:** mostrar só quando o status é aprimorado ou inalterado.

### X5 · P2 · P · Documentação defasada
- `agent/README.md:53` cita campos que saíram da tela.
- `agent/README.md:46-47` tem dois itens numerados como 7.
- `server/src/vertex.mjs`: endereço do Vertex para as regiões `us` e `eu` não foi verificado.

### X6 · P2 · Risco aceito · Angular 15 fora de suporte
Registrado em `.rules/decisoes.md`. Atualizar antes de qualquer uso fora da máquina local.

---

## 5.8 Bugs de código do revisor independente

Um revisor independente leu só o código, sem conhecer as conclusões acima. Os itens abaixo foram conferidos no código antes de entrar aqui. A leitura estática não encontrou erro de compilação TypeScript nem de template Angular 15; os problemas reais estão no servidor: segurança, custo de chamadas e tempo limite.

| # | Gravidade | Onde | Problema e cenário | Correção |
|---|---|---|---|---|
| B1 | Alta | `server/src/index.mjs:19-24`, `:124-146`, `:153-160` | Detalha X1. Um `fetch` sem CORS, com corpo de texto simples, dispara o seletor sem verificação prévia do navegador. Com redirecionamento de DNS para o próprio computador, um site lê `/api/health` e `/api/skills`, expondo usuário, pasta do projeto e todas as skills. | Recusar Host fora de `127.0.0.1` e `localhost` na porta; exigir `Content-Type: application/json` no POST; recusar Origin fora da lista local. |
| B2 | Média | `server/src/index.mjs:46-47`, `locate.mjs:79-106`, `scan.mjs:56-102` | `skillPaths` sem limite de quantidade nem de local. `/` ou `~` varre o disco inteiro, sem limite de profundidade, arquivos ou tempo. Links simbólicos são seguidos para qualquer destino. Cada `SKILL.md` é lido inteiro, sem limite de tamanho, e nome, descrição e quando usar vão ao Vertex. Com B1, isso é disparável de fora. | Limitar a poucos caminhos; aceitar só pastas dentro da home, do projeto ou das raízes configuradas; limites de pastas, arquivos, bytes e tempo; varredura cancelável. |
| B3 | Média | `server/src/selector.mjs:60-75` com `vertex.mjs:57-59` | Resposta bloqueada ou sem candidato é tratada como estouro de saída: o lote é dividido ao meio até uma skill por chamada. São cerca de duas chamadas pagas por skill, fora do limite de paralelismo, terminando em erro. A causa é o rascunho, não o tamanho do lote. | Dividir só em `MAX_TOKENS`; em bloqueio ou sem candidato, falhar na hora com o motivo devolvido pelo Vertex; divisões pelo mesmo limitador. Complementa S3. |
| B4 | Média | `server/src/scan.mjs:7-9`, `:25` | A lista de pastas ignoradas do `.cursor` vale em qualquer profundidade. Uma skill em `.cursor/skills/logs/SKILL.md`, ou numa pasta chamada `extensions`, some sem aviso. | Aplicar essa lista só no primeiro nível da raiz; manter `node_modules` e `.git` em toda profundidade. |
| B5 | Baixa | `server/src/vertex.mjs:33-49` | O tempo limite é cancelado quando chegam os cabeçalhos, antes de ler o corpo, na linha 49. Um corpo travado prende o pedido para sempre. | Cancelar o temporizador só depois de ler o corpo. |
| B6 | Baixa | `frontend/src/app/app.component.ts:154-157`, `:227-244`; `app.component.html:16` | Com rascunho vazio, "Avaliar esta pasta" e "Continuar sem skills" não fazem nada e não avisam. A pasta manual sobrevive à troca de IDE, como em S4. O campo do rascunho não tem limite: acima de 8.000 caracteres o servidor responde 400 e a tela mostra como falha de skills. | Validar o rascunho com mensagem; limpar a pasta ao trocar de IDE; limite e aviso no campo. |
| B7 | Baixa | `server/src/index.mjs:128-143`; `frontend/proxy.conf.json:3` | JSON malformado vira "Corpo JSON ausente". Corpo acima de 1 MB derruba a conexão em vez de responder 413. O proxy está fixo na porta 4300, mas a porta é configurável: mudar `ZPROMPT_API_PORT` faz a tela dizer que o servidor não respondeu. | Responder 400 "JSON inválido" e 413 antes de fechar; documentar ou gerar o destino do proxy. |
| B8 | Baixa | `server/src/vertex.mjs:5-7`, `:20-22`; `selector.mjs:21` | Com o projeto Google definido e sem credenciais, o servidor se considera configurado. Toda sugestão devolve erro 500 em vez de cair na seleção sem modelo; com X2, o aprimoramento inteiro falha. | Detectar a falta de credencial, cair no modo sem modelo com aviso e informar em `/api/health`. |
| B9 | Baixa | `server/src/scan.mjs:40-44` | Duas skills diferentes com o mesmo nome no mesmo escopo: fica a primeira encontrada, numa ordem de leitura de pastas que não é garantida. O catálogo deixa de ser determinístico e a descartada não é avisada. | Ordenar as entradas antes de percorrer; registrar as duplicadas. |
| B10 | Baixa | `server/src/selector.mjs:79-86`, `:184-186`; `scan.mjs:141` | Descrição com várias linhas ou com `\|` quebra o formato `nome \| descrição \| motivo` que o aprimorador espera receber. Complementa S2 e L12. | Achatar espaços e escapar `<`, `>` e `\|`. |
| B11 | Baixa | `server/src/scan.mjs:122` | Frontmatter vazio faz o leitor tratar o corpo como YAML até a próxima linha `---`. | Aceitar grupo vazio na expressão. |
| B12 | Baixa | vários | `export` no `.env` vira parte do nome da variável, em `env.mjs:19-21`. Porta em uso derruba o servidor com pilha crua, em `index.mjs:104`. "Copiado" aparece mesmo quando a cópia de reserva falha, em `app.component.ts:269-272`. A lista de erros da varredura não tem limite, em `scan.mjs:56`. Falta o estilo da etiqueta "pasta informada" em `app.component.scss`. | Correções pontuais. |

**A verificar:**
- **Pasta de skills do Antigravity no projeto.** A pesquisa C registra `.agents/skills` como atual e `.agent` como legado. O servidor lê só `.agents`; projetos antigos com `.agent` ficariam de fora. Ler as duas.
- **Regiões `us` e `eu` do Vertex.** O endereço montado pode estar errado para essas regiões, como em X5.
- **Navegadores antigos.** A simulação usa expressão com lookbehind, que quebra o Safari anterior à versão 16.4. Some quando a simulação for substituída, conforme A4.

---

## 5.9 Como provar que o aprimoramento é efetivo

Sem armazenar interações, métricas de produto como taxa de aceitação ficam impossíveis. A prova precisa ser offline:

1. **Verificações determinísticas** sobre a saída do aprimorador: os casos de `agent/examples/casos.json` mais lint. Barato; roda a cada mudança.
2. **Conjunto real:** 30 a 50 rascunhos do próprio usuário por função núcleo, anonimizados, com a intenção anotada.
3. **Juiz pareado:** comparar o resultado do agente do IDE com o rascunho original e com o prompt aprimorado, nas duas ordens, por um juiz de família diferente do Gemini. Critérios: corretude contra a intenção, escopo respeitado, verificação feita, nada inventado.
4. **Execução real:** rodar os dois prompts no Cursor CLI e no `agy` do Antigravity em tarefas com teste. Modo sem interface desses CLIs ainda não verificado.
5. **Experimento decisivo da Task 1:** pedido cru, pedido cru em modo plano e pedido com contorno. Se o contorno não vencer o modo plano, o produto se concentra em rota, regras e skills.

Metas iniciais da metodologia continuam valendo: preservação forte de intenção acima de 90%, vitória pareada acima de 60% com derrota abaixo de 10% e zero requisito inventado em amostra de 100.

---

## 5.10 Roteiro priorizado

| Fase | Itens | Resultado |
|---|---|---|
| 1 · Funcionar de verdade | A1, A2, L1, L2, L3, L4, L12, S2, S3, X1, X2, B1, B2, B3, B4, B5, B8, executor de casos de A8 | Aprimorador real no Vertex, sem contradições, validado, seguro e sem chamadas pagas descontroladas |
| 2 · Ancorar no projeto | A3, A6, A5, S1, L5, L8, X3, B6, B7, pasta legada do Antigravity | Prompts citam fatos do projeto; seletor e aprimorador concordam na função |
| 3 · Fluxo forte e econômico | L6, L7, S5, S6 | Diagnóstico com modelo forte e execução com modelo barato sob as mesmas regras |
| 4 · Escala e manutenção | A4, A7, A9, A10, L9, L10, L11, B9, B10, B11, B12, avaliação real de 5.9 | Uma fonte por função, contratos gerados, desempenho, prova de efetividade |

---

## 5.11 Decisões que dependem do dono do projeto

| # | Decisão | Recomendação |
|---|---|---|
| D1 | Ler automaticamente o projeto local para dar fatos ao aprimorador | Sim, ligado por padrão, com chave para desligar |
| D2 | Avaliação só offline, já que interações não são armazenadas | Sim; opcionalmente contadores locais sem conteúdo |
| D3 | Opção "Modelo que vai executar" | Sim, com dois valores: forte e econômico |
| D4 | Função "Executar relatório aprovado" | Sim, fecha o fluxo de repasse |
| D5 | Diagnóstico no Antigravity como artefato de plano | Não por enquanto; avaliar no spike |
| D6 | Usuário revisar skills antes de incorporar | Sim, com chips removíveis |

---

## 5.12 Status da aplicação, 2026-11-06

Aplicado com foco em funcionar sem projeto, sem pasta de skills e sem Vertex configurado. Verificado com 39 testes automatizados do servidor, build de produção do Angular com checagem estrita de templates e teste da tela no navegador. Os casos de regressão que dependem do modelo não rodaram: não há `GOOGLE_CLOUD_PROJECT` configurado.

| Item | Situação | Onde |
|---|---|---|
| A1, A2 | Feito: rota única `POST /api/enhance`; a tela faz uma chamada | `server/src/enhancer.mjs`, `frontend/src/app/core/enhance-api.ts` |
| A7 | Parcial: resposta do Vertex validada em tempo de execução, contrato do pedido atualizado; tipos do frontend ainda escritos à mão | `server/src/lint.mjs`, `agent/config/request-schema.json` |
| A8 | Feito o executor; casos com modelo pendentes de Vertex | `npm run eval` |
| A10 | Feito: uma linha de metadados por pedido | `server/src/enhancer.mjs` |
| L1, L2, L3, L4, L8, L12 | Feito | `agent/prompts/system-instruction.md`, `server/src/lint.mjs`, `server/src/text.mjs` |
| S1, S2, S3, S4 | Feito; com "Detectar", o seletor deduz a função pelo rascunho | `server/src/selector.mjs`, `agent/skills-selector/` |
| X1, X2, X4, X5 | Feito | `server/src/http.mjs`, tela |
| B1 a B12 | Feito | servidor e tela |
| Pasta `.agent`, regiões `us` e `eu`, lookbehind | Feito; regiões conferidas na documentação do Vertex | `server/src/locate.mjs`, `server/src/vertex.mjs` |
| L5 | Mantido de propósito: os campos são evidência para auditoria e regressão | `.rules/decisoes.md` |
| A3, X3 | Pendente: precisa de um projeto real e da decisão D1 | |
| A6 | Parcial: sem classificação compartilhada entre seletor e aprimorador | |
| L6, L7, S5, S6 | Pendente: decisões D3, D4 e D6 | |
| A4, A5, A9, L9, L10, L11 | Pendente: fase 4 e spike de integração | |
