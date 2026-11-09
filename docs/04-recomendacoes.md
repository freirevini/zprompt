# 4. Recomendações para as próximas etapas

**Projeto:** Zprompt · **Task 1 (pesquisa)** · 2026-11-05

Legenda: **[V]** verificado em fonte primária nesta pesquisa; **[NV]** não verificado (vai para o spike de integração da Task 2).

---

## 4.1 Conclusões que orientam as decisões

1. **Há espaço de mercado real.** Cursor, Antigravity, Windsurf/Devin Desktop, Copilot, JetBrains e Claude Code não têm aprimorador nativo em novembro de 2026. Os pedidos nos fóruns e repositórios não foram atendidos. As extensões de terceiros são pequenas e fracas.
2. **O "botão raso" é commodity.** Kilo, Roo, bolt.diy e pi reescrevem só o texto, sem contexto. O valor percebido vem de contexto de código (Augment) e de clarificação (bolt.new, severity1, skill `boost-prompt`, Lovable). A queda de qualidade relatada na Augment quando o contexto sumiu confirma isso.
3. **O diferencial possível tem cinco pernas:** funções com método próprio, contexto do IDE e das regras do projeto, perguntas curtas fundamentadas, preview com diff e origem de cada acréscimo, e avaliação publicada.
4. **Hooks não são caminho para reescrever.** No Claude Code o `UserPromptSubmit` só anexa contexto ou bloqueia [V]. Nos demais IDEs a capacidade de reescrita ainda está [NV]. O produto não deve depender de hooks.
5. **As primitivas dos IDEs mudam rápido.** Workflows do Antigravity deixaram de funcionar em 19/10/2026 e migraram para skills [V]. O Cursor migra commands para skills [V]. O Windsurf virou Devin Desktop e removeu o Cascade [V]. Qualquer integração precisa ser fina e gerada a partir de uma fonte única.

---

## 4.2 Posicionamento recomendado

**Proposta de valor:** "Transforme um pedido rápido em um prompt que o agente do seu IDE acerta na primeira tentativa, sem inventar nada e mostrando exatamente o que mudou."

**Dois níveis de aprimoramento**, porque a pesquisa mostra duas demandas distintas:

| Nível | Quando | Como | Latência | Inspiração |
|---|---|---|---|---|
| **Rápido** | Pedido do dia a dia | Modelo pequeno, contexto local (editor, regras, git), sem tools, preview com diff | 2–5 s | Kilo, Kiro Crew, OpenCode PR |
| **Profundo** | Tarefa ambígua ou ampla | O próprio agente do IDE executa um comando de pré-voo: explora o repositório, faz 1–3 perguntas com a primitiva nativa e devolve o prompt (ou mini-spec) sem executar | 30 s–2 min | severity1, skill `boost-prompt`, Antigravity `/grill-me`, Claude Code "interview me" |

O usuário escolhe a função (ou Auto) e o nível. O nível Rápido pode sugerir o Profundo quando o diagnóstico detecta lacunas que só a exploração resolve.

---

## 4.3 Arquitetura recomendada: uma fonte, vários adaptadores

```
                 ┌──────────────────────────────────────────────┐
                 │  FONTE ÚNICA (versionada no repositório)      │
                 │  funções/*.md  · regras-núcleo · lint         │
                 │  exemplares · presets de projeto (.zprompt/)  │
                 └──────────────────────┬───────────────────────┘
                                        │ compilação
     ┌──────────────┬───────────────────┼──────────────────┬───────────────────┐
     ▼              ▼                   ▼                  ▼                   ▼
 Núcleo + CLI   Comandos de        Extensão            Servidor MCP        Hooks / hotkey
 (nível Rápido) pré-voo por IDE    VS Code-compatível  (tool + prompts)    (fase 2–3)
                (nível Profundo)   (UX completa)
```

**Fonte única.** Cada função do catálogo vira um arquivo com: sinais de classificação, contexto a coletar, perguntas, esqueleto, verificação, anti-padrões e um exemplo trabalhado. Desse arquivo saem o guia que entra no meta-prompt do núcleo, os comandos de pré-voo de cada IDE e os prompts MCP. Assim a mudança de formato de um IDE altera só o adaptador.

**Superfícies avaliadas:**

| Superfície | Alcance | Reescreve? | Contexto acessível | Estado | Papel |
|---|---|---|---|---|---|
| Núcleo + CLI `zprompt` | Terminal, CI, harness de avaliação | Sim | Sistema de arquivos, git, regras do projeto | Nosso | Base de tudo; Task 3 |
| Comandos de pré-voo | Todos os IDEs-alvo | O agente gera o prompt e para | Total, via tools do agente; perguntas nativas | Formatos [V] | Validar método e catálogo rápido; Task 4 |
| Extensão VS Code-compatível | VS Code, Cursor, Antigravity, Devin Desktop, Kiro, Trae, Qoder | Sim, no painel próprio | Editor, diagnósticos, arquivos, git, regras | APIs de editor conhecidas; inserção no chat de cada fork [NV] | Produto principal; Task 5 |
| Servidor MCP | Qualquer cliente MCP | Gera texto para o agente | O que o cliente envia, mais arquivos locais | Exibição de prompts MCP por IDE [NV] | Distribuição ampla; fase 2 |
| Hooks de envio | Claude Code, Cursor, Copilot, Antigravity, Gemini CLI, Cline | Claude Code não [V]; outros [NV] | Prompt e transcript | Parcial | Modo "avaliar clareza e sugerir", não reescrita; fase 2 |
| Atalho global do SO | Qualquer aplicativo | Sim, via clipboard | Só o texto | Não pesquisado | Fallback universal; fase 3 |

**Formatos de pré-voo por IDE** (verificados pela pesquisa C):

| IDE | Arquivo | Argumentos e recursos | Primitiva para perguntar |
|---|---|---|---|
| Claude Code | `.claude/skills/zprompt/SKILL.md` (ou `.claude/commands/zprompt.md`) | `$ARGUMENTS`; injeção de saída de shell com `` !`cmd` ``; `allowed-tools` | `AskUserQuestion` |
| Cursor | Skill invocada por `/zprompt`; `.cursor/commands/*.md` ainda aceito | Pasta e formato exato da skill [NV] | Plan Mode faz perguntas; primitiva dedicada [NV] |
| Antigravity | `.agents/skills/zprompt/SKILL.md` | Combina com `/plan` e `/grill-me` | `/grill-me` entrevista uma pergunta por vez |
| Copilot (VS Code) | `.github/prompts/zprompt.prompt.md` e agente `.github/agents/zprompt.agent.md` | `${selection}`, `${input:nome}`, `agent:`, `tools:`; `handoffs` com `send: false` | `#vscode/askQuestions` |
| Kilo Code 7.x | `.kilo/command/` ou `.kilo/skills/` (estrutura vista no repositório) | Formato OpenCode [NV] | Ferramenta de pergunta do agente [NV] |
| Roo Code | `.roo/commands/zprompt.md` | `description`, `argument-hint`, `mode` | `ask_followup_question` [NV] |
| Gemini CLI | `.gemini/commands/zprompt.toml` | `{{args}}`, `!{git diff --staged}` | [NV] |
| Devin Desktop | Skills (workflows legados não rodam no Devin Local) | [NV] | [NV] |

O pré-voo instrui o agente a: classificar a função, ler as regras do projeto, coletar o contexto da ficha, fazer no máximo 3 perguntas só sobre o que não pode descobrir, gerar o prompt no esqueleto da função, passar pelo checklist do lint em linguagem natural e **parar sem executar**. No Copilot, um `handoff` "Executar este prompt" leva ao modo Agent sem enviar automaticamente (semântica de `send: false` a confirmar).

---

## 4.4 Roteiro por etapas

### Task 2 — Especificação e spike de integração (ainda sem código de produto)

- Fechar as decisões da seção 4.7.
- Executar o checklist da seção 4.5 nos IDEs que o usuário usa (Cursor e Antigravity primeiro).
- Especificar o esquema de arquivo de função, o esquema de contexto em camadas com orçamentos, o contrato de entrada e saída do núcleo em JSON, e as regras do lint como casos de teste.
- Montar o dataset inicial: 60 a 100 rascunhos reais, cerca de 10 por função núcleo, com a intenção real anotada; 20 tarefas com verificação automática para o nível 3 de avaliação. Fonte sugerida: o histórico do próprio usuário, anonimizado. O Claude Code guarda transcripts locais; o histórico local do Cursor e do Antigravity precisa ser verificado.
- **Entregáveis:** `docs/05-especificacao.md`, `docs/06-spike-integracao.md`, `eval/dataset/`.
- **Pronto quando:** cada item [NV] está marcado como confirmado ou negado, com evidência; dataset revisado pelo usuário.

### Task 3 — Núcleo v0, CLI e avaliação níveis 1 e 2

- Meta-prompt com as 10 regras-núcleo; funções F1 a F5 e Auto; lint determinístico; pós-processamento; contexto L0 a L2 a partir de arquivos e git.
- CLI: rascunho, função, IDE-alvo e idioma como entrada; prompt aprimorado, perguntas pendentes e resumo de mudanças como saída.
- Harness rodando o dataset com lint, juiz pareado e preservação de intenção.
- **Pronto quando:** metas iniciais da metodologia atingidas no dataset; latência p95 até 5 s com modelo pequeno.

### Task 4 — Pré-voo nativo nos IDEs-alvo

- Gerar os comandos de pré-voo a partir das fichas de função para Claude Code, Cursor, Antigravity, Copilot e Kilo.
- Uso real pelo usuário por 1 a 2 semanas, com registro simples: rascunho, função, aceito sem edição, editado, resultado do agente.
- **Pronto quando:** as fichas de função foram ajustadas com base no uso e há números de aceitação por função.

### Task 5 — Extensão VS Code-compatível

- Painel com função e nível, perguntas em cartões, preview com diff por bloco e chips de origem, desfazer, copiar e inserir no chat conforme o spike.
- Contexto de editor (arquivo ativo, seleção, diagnósticos, terminal) e de projeto; BYOK e modelo local opcional; telemetria local.
- **Pronto quando:** fluxo completo em menos de 10 s com perguntas, funcionando em VS Code, Cursor e Antigravity.

### Task 6 — Funções estratégicas e personalização

- F6 Planejar, F8 Testar, F9 Explicar, F13 Configurar o agente; modificadores de escopo, autonomia, plano primeiro e idioma.
- Exemplares do usuário por função e presets por projeto em `.zprompt/`, versionáveis e compartilháveis com o time.

### Task 7 — Avaliação downstream e otimização

- Nível 3 de avaliação: agente com prompt original contra prompt aprimorado em tarefas com testes, incluindo subconjuntos sub-especificados.
- Otimização offline do meta-prompt por função com DSPy (MIPROv2 ou GEPA), validada em holdout e com humanos.
- Relatório público de eficácia. Nenhum concorrente publica métricas, então isso é diferencial.

### Fase 2 e 3

Servidor MCP; modo de avaliação de clareza via hooks; atalho global do sistema operacional; funções F7, F10 a F12 e F14 a F17; recursos de time.

---

## 4.5 Spike de integração: checklist do que ficou sem verificar

A pesquisa dessas superfícies foi interrompida: o subagente responsável falhou por limite de uso, e em seguida o modo auto passou a bloquear acesso web e Bash nesta sessão. Os itens abaixo devem ser verificados no início da Task 2, de preferência testando nos IDEs instalados.

| # | Pergunta | Onde verificar | Impacto na arquitetura |
|---|---|---|---|
| 1 | O hook `beforeSubmitPrompt` do Cursor pode alterar o texto ou só permitir/bloquear e mostrar mensagem? | Página de hooks do Cursor; teste com `.cursor/hooks.json` | Se reescrever, vira superfície de "aprimorar ao enviar" no Cursor |
| 2 | Existe deeplink do Cursor que abre o chat com prompt pré-preenchido sem enviar? Qual formato e codificação? | Docs de deeplinks do Cursor; teste | Permite à extensão e ao CLI entregar o prompt direto no chat |
| 3 | Uma extensão consegue inserir texto no input do chat do Cursor, do Antigravity e do Devin Desktop? Por qual comando? | Paleta de comandos e atalhos de cada IDE; teste com extensão mínima | Define se a extensão insere no chat ou só copia |
| 4 | O comando `workbench.action.chat.open` do VS Code aceita texto e opção de não enviar para o Copilot Chat? | Código-fonte do VS Code; teste | Inserção direta no Copilot |
| 5 | Antigravity, Kiro, Trae e Qoder instalam extensões do Open VSX e expõem as APIs de editor e diagnósticos? | Teste de instalação de uma extensão mínima | Alcance real da extensão |
| 6 | Os hooks do Antigravity têm evento de envio de prompt? Podem reescrever? | Página de hooks do Antigravity | Superfície adicional no IDE prioritário |
| 7 | `BeforeAgent` e `BeforeModel` do Gemini CLI podem alterar a mensagem do usuário? | Referência de hooks do Gemini CLI | Superfície no Gemini CLI e possivelmente no CLI do Antigravity |
| 8 | Um plugin do OpenCode e do Kilo CLI pode alterar a mensagem no evento de chat antes do modelo? | Docs de plugins do OpenCode; pacote `@kilocode/plugin`, cuja existência foi vista no repositório do Kilo | Aprimoramento nativo no Kilo 7.x |
| 9 | O `UserPromptSubmit` do Cline e os hooks do Copilot podem reescrever ou só anexar contexto? | Docs de hooks do Cline e do VS Code | Completa a matriz de hooks |
| 10 | O que faz o novo evento `UserPromptExpansion` do Claude Code? | Página de hooks do Claude Code | Possível ponto de reescrita no Claude Code |
| 11 | Quais IDEs exibem prompts MCP como comandos? | Docs de MCP de cada IDE | Valor do servidor MCP |
| 12 | Pasta e formato das skills do Cursor e do Devin Desktop; semântica de `send: false` nos handoffs do Copilot | Docs de cada IDE | Formato dos comandos de pré-voo |
| 13 | Ferramentas de atalho global que já reescrevem texto selecionado com LLM, como extensões de Raycast ou espanso | Busca de produtos | Fallback universal na fase 3 |

Já verificados e que não precisam de spike: hook `UserPromptSubmit` do Claude Code não substitui o prompt; endpoint `POST /enhance-prompt` no Kilo CLI; formatos de comandos e regras de Claude Code, Copilot, Antigravity, Roo, Cline, Kiro e Gemini CLI levantados na pesquisa C.

---

## 4.6 Dados e avaliação desde a Task 3

- **Dataset vivo** versionado em `eval/`: rascunhos reais por função, intenção anotada, contexto mínimo associado e, quando houver, tarefa com verificação.
- **Testes de regressão do meta-prompt:** rascunhos em forma de pergunta e de instrução para garantir que o aprimorador reescreve em vez de responder, como os testes do Kilo; rascunhos já bons que devem voltar inalterados; rascunhos com caminhos e trechos de código que devem ser preservados; rascunhos com segredos que devem ser redigidos.
- **Metas iniciais**, a calibrar: preservação forte de intenção acima de 90%; vitória pareada acima de 60% com derrota abaixo de 10%; zero requisito inventado em amostra de 100; latência p95 até 5 s; comprimento mediano até 2,5 vezes o original.
- **Métricas de produto** desde a Task 4: aceitação sem edição, distância de edição, desfazer e re-prompt no turno seguinte.

---

## 4.7 Decisões que dependem do dono do projeto

| Decisão | Opções | Recomendação |
|---|---|---|
| IDEs prioritários | Cursor, Antigravity, VS Code com Copilot, Claude Code, Kilo | Cursor e Antigravity, conforme o briefing; VS Code vem junto pela extensão; Claude Code pelo pré-voo mais simples |
| Forma do MVP | Núcleo e pré-voo primeiro, ou extensão primeiro | Núcleo e pré-voo primeiro: validam método e catálogo em dias; a extensão reaproveita tudo |
| Modelo e chaves | Serviço próprio, BYOK, modelo local | BYOK com modelo pequeno padrão e opção local; sem servidor próprio no início |
| Idioma do prompt gerado | Do usuário ou inglês | Do usuário, com opção de inglês |
| Autonomia padrão | Perguntar ou assumir e listar suposições | Perguntar quando a lacuna é de alvo ou escopo; assumir detalhes técnicos |
| Telemetria | Nenhuma, local, compartilhada | Local por padrão; compartilhamento opcional e anonimizado |
| Licença | Aberta ou fechada | Aberta no núcleo e nas fichas de função favorece adoção e confiança; concorrentes diretos como Kilo e Roo são abertos |
| Público inicial | Desenvolvedor individual ou times | Individual, com presets em `.zprompt/` já pensados para times |

---

## 4.8 Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Um IDE lança aprimorador nativo | Competir em profundidade: funções, contexto, perguntas, diff e métricas; ser multi-IDE |
| Primitivas dos IDEs mudam ou são descontinuadas | Fonte única e adaptadores finos gerados; testes de compatibilidade por IDE |
| Hooks não reescrevem | Não depender de hooks; usá-los só para avaliar clareza e sugerir |
| Qualidade alegada sem prova | Avaliação a partir da Task 3 e relatório público na Task 7 |
| Prompts inflados ou requisitos inventados | Limite de tamanho, devolução inalterada, lint de preservação e de existência de caminhos |
| Perguntas demais irritam | No máximo 3, opções vindas do contexto, botão para pular, nível Rápido sem perguntas por padrão |
| Vazamento de segredos | Redação antes do envio e na saída, processamento local, nada de segredos na telemetria |
| Latência e custo | Modelo pequeno, bypass para rascunhos curtos ou já bons, contexto orçado |
| Injeção via texto colado | Rascunho e contexto tratados como dados, escape e redação |

---

## 4.9 Fora do escopo por enquanto

- Indexação semântica própria do repositório: o agente do IDE já explora; o aprimorador coleta só o necessário.
- Execução de tarefas: o aprimorador nunca executa; entrega o prompt.
- Geração de UI e prompts de design, como Stitch e v0: só se o usuário pedir uma função específica no futuro.
- Funções de dados e notebooks.
