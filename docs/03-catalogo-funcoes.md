# 3. Catálogo de funções do aprimorador

**Projeto:** Zprompt · **Task 1 (pesquisa)** · 2026-11-05

Uma **função** é a intenção que o usuário seleciona (ou que o aprimorador detecta e confirma) antes de reescrever o prompt. Cada função determina quatro coisas: **que contexto coletar**, **que lacunas perguntar**, **que esqueleto gerar** e **que modo/primitiva do IDE sugerir**. Este catálogo cobre as cinco funções pedidas no briefing, mais funções estratégicas que apareceram com força no benchmark (`01-benchmark.md`) e na taxonomia de intenções da pesquisa C (`docs/pesquisa/PC-primitivas-de-ide-e-catalogos.md`).

---

## 3.1 Princípios do catálogo

1. **Poucas funções visíveis, muitas detectáveis.** A interface mostra um conjunto pequeno (as cinco núcleo mais "Auto"); a classificação automática cobre o resto e sempre exibe a função escolhida como um chip que o usuário pode trocar. Base: GaZmagik classifica por regex sem chamada de API (fix › investigate › research › build › general); Geoffrey-Zulu usa modos code/architecture/refactor; mhemdan usa feature/bugfix/explain/review.
2. **Função ≠ persona.** A função muda o que o prompt pede e verifica, não injeta "você é um engenheiro sênior" (sem ganho medido, Zheng et al. 2024).
3. **Cada função tem uma verificação própria.** Bug: teste que falha antes e passa depois. Feature: critérios de aceite + comando de teste. Refatoração: comportamento observável inalterado. Revisão: evidência `file:line` e veredito. Base: Claude Code "give Claude a check to run"; GaZmagik; Kiro.
4. **Cada função tem um conjunto fechado de perguntas de clarificação**, de múltipla escolha, com opções vindas do contexto real (arquivos encontrados, diagnósticos, branches), nunca genéricas. Base: severity1 (Target / Approach / Scope / Priority), Spec Kit (`/speckit.clarify`, máximo de 5 perguntas; prioridade escopo > segurança/privacidade > UX > detalhes técnicos), Ambig-SWE.
5. **Cada função mapeia para um modo do IDE alvo** (Agent, Plan, Ask/read-only, Debug) e para a sintaxe de contexto daquele IDE (`@arquivo`, `#file`, `@problems`, `#spec:`).
6. **Modificadores transversais** não são funções: escopo (mínimo ↔ ambicioso), autonomia (perguntar antes ↔ decidir e seguir), plano primeiro (sim/não), idioma do prompt gerado, modelo alvo. Eles ajustam qualquer função.

---

## 3.2 Da taxonomia de intenções às funções do produto

A pesquisa C consolidou 17 intenções estáveis a partir dos comandos/modos de 15 ferramentas e dos estudos empíricos (Hao et al. 2024: Code generation 20–27%, How-to 13–22%, Conceptual 14–18%, Issue resolving 12–14%, Review 4–9%; CUPS: Debugging/Testing, Looking up Documentation, Prompt Crafting). O mapeamento para o catálogo:

| Intenção (pesquisa C) | Função do catálogo | Prioridade |
|---|---|---|
| 1 Entender contexto / onboarding · 15 Gerir contexto/sessão | **F1 Entender o projeto (iniciar ou retomar)** | Núcleo |
| 4 Iniciar projeto / scaffold / configurar agente | **F2 Iniciar um projeto** (+ F13 Configurar o agente) | Núcleo |
| 5 Implementar · 3 Planejar | **F3 Implementar** (+ F6 Planejar/especificar quando a tarefa é ampla) | Núcleo |
| 6 Corrigir erro / depurar | **F4 Corrigir erro** | Núcleo |
| 7 Revisar código / segurança | **F5 Revisar código** (+ F10 Segurança) | Núcleo |
| 3 Planejar / especificar · 16 Levantar requisitos | **F6 Planejar / especificar** | Estratégica (MVP) |
| 8 Refatorar / simplificar / otimizar | **F7 Refatorar** · **F11 Otimizar desempenho** | Estratégica (MVP) / Fase 2 |
| 9 Testes | **F8 Testar** | Estratégica (MVP) |
| 2 Explicar / how-to | **F9 Explicar / perguntar** | Estratégica (MVP) |
| 7 (variante) · 13 Pesquisar | **F10 Investigar / auditar** · **F12 Pesquisar docs/web** | Fase 2 |
| 10 Documentar | **F14 Documentar** | Fase 2 |
| 12 Migrar / converter | **F15 Migrar / atualizar** | Fase 2 |
| 11 Git / commit / PR | **F16 Commit, PR e conflitos** | Fase 2 |
| 14 Orquestrar subtarefas | **F17 Decompor / orquestrar** | Fase 2 |
| 4 (variante) | **F13 Configurar o agente** (AGENTS.md, regras, skills) | Estratégica (MVP) |
| 17 Dados | fora do escopo inicial | — |

---

## 3.3 Ficha padrão de função

Cada função é descrita pelos campos abaixo. Na implementação (Task 2+), a ficha vira um arquivo de configuração por função (guia + exemplo trabalhado + perguntas + verificação), carregado no meta-prompt só quando a função é escolhida — o padrão de "progressive disclosure" usado por severity1 e GaZmagik.

- **Objetivo:** o que o prompt gerado deve fazer o agente produzir.
- **Sinais de classificação:** palavras e padrões (PT/EN) que sugerem a função; o que desempata.
- **Contexto a coletar (ordem):** fontes e orçamento.
- **Lacunas típicas e perguntas:** 1–3 perguntas de múltipla escolha, com origem das opções.
- **Esqueleto do prompt gerado:** blocos na ordem.
- **Verificação a embutir.**
- **Modo e primitivas do IDE.**
- **Riscos e anti-padrões.**
- **Exemplo antes → depois** (o "depois" marca entre colchetes o que vem do contexto coletado; nada é inventado).

---

## 3.4 Funções núcleo

### F1 — Entender o projeto (para iniciar ou continuar o desenvolvimento)

**Objetivo.** Fazer o agente construir (ou reconstruir) o modelo mental do projeto antes de qualquer mudança, e devolver um resumo acionável: arquitetura, convenções, como rodar/testar, estado atual do trabalho e próximos passos. Dois submodos: **Onboarding** (projeto novo para o usuário ou para o agente) e **Retomada** (continuar trabalho em andamento, nova sessão ou nova pessoa).

**Sinais.** "me explica o projeto", "como funciona esse repo", "onde fica", "continuar", "retomar", "o que estava fazendo", "contexto", "overview", "onboard", "where is", "how does this work", "resume", "pick up where". Desempate: se há menção a tarefa específica em andamento (branch, plano, PR), Retomada; senão Onboarding.

**Contexto a coletar.** (1) Rules files existentes: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*.mdc`, `.agents/rules`, `.github/copilot-instructions.md`, `.kilocode/rules`, `.clinerules` — se existem, o prompt deve mandá-los ler primeiro; (2) "project shape": diretórios de topo, manifestos (`package.json`, `pyproject.toml`, `go.mod`…), scripts de build/test, framework de teste, README; (3) git: branch atual, últimos commits, mudanças não commitadas; (4) Retomada: arquivos de plano (`.kilo/plans/`, `~/.devin/plans/`, `plan.md`, `SPEC.md`, `.specify/`, `tasks.md`), TODO/FIXME recentes, último relatório de sessão; (5) arquivos abertos/ativo.

**Lacunas e perguntas.** Profundidade ("visão geral em 1 página" vs "mapa detalhado por módulo"); foco ("todo o repo" vs "só o módulo X" — opções vindas dos diretórios de topo); saída ("responder no chat" vs "gravar em `AGENTS.md`/`docs/`"). Em Retomada: "qual trabalho continuar?" com opções vindas de branch, plano encontrado e commits recentes.

**Esqueleto.** Objetivo (onboarding ou retomada) → "Leia primeiro" (rules files e plano existentes, por caminho) → O que mapear (entrada/saída do sistema, módulos e dependências entre eles, convenções, como rodar/testar/lintar, pontos de risco) → Para Retomada: estado atual (branch, diff, tarefas abertas) e próximo passo sugerido com evidência → Formato da saída (seções curtas; caminhos reais; nada especulativo: "não afirme nada sobre código que não abriu") → Restrição: somente leitura, nenhuma edição → Verificação: listar os comandos que o agente efetivamente rodou.

**Verificação.** O resumo cita caminhos reais e comandos executados; opcionalmente o agente roda o comando de teste para confirmar que o ambiente funciona.

**Modo e primitivas.** Modo Ask/read-only (Roo/Kilo Ask, Devin `/ask`, Copilot Ask, Cursor `/ask`), ou Plan mode em Retomada; subagente Explore no Claude Code e Kilo; `/init` como alternativa quando o objetivo é gerar o arquivo de instruções (Claude, Gemini, Roo, Copilot); Antigravity `/plan` sem argumentos funciona como sessão de descoberta. Menções: pastas de topo (`@src/`, `#search/codebase`).

**Riscos.** Resumo genérico sem leitura real; alucinar arquitetura; gastar contexto lendo tudo. Mitigação: exigir evidência (caminhos, comandos), limitar a 1–2 páginas, pedir priorização.

**Exemplo.** Antes: "me explica esse projeto pra eu continuar o que o outro dev estava fazendo". Depois: "Quero retomar o trabalho em andamento neste repositório. Leia primeiro [AGENTS.md encontrado] e [docs/plan-auth.md encontrado]. Mapeie em até uma página: módulos principais e como se conectam, convenções de código, comandos para rodar, testar e lintar [scripts detectados: `pnpm test`, `pnpm lint`]. Depois descreva o estado atual da branch [feat/oauth-refresh]: o que o diff não commitado muda, quais tarefas do plano estão feitas e qual é o próximo passo, citando arquivos e linhas. Não edite nada. Não afirme nada sobre código que você não abriu; liste os comandos que executou."

### F2 — Iniciar um projeto

**Objetivo.** Transformar uma ideia em um kickoff executável: decisões de stack explícitas (as que o usuário já tomou) ou perguntadas (as que não tomou), estrutura inicial, ferramentas de qualidade (lint, testes, CI), arquivos de instrução para o agente e primeiro incremento verificável.

**Sinais.** "criar um projeto", "do zero", "novo app", "scaffold", "bootstrap", "inicializar", "start a new", "set up a project", "greenfield". Desempate com F3: ausência de código existente relevante no workspace.

**Contexto a coletar.** Workspace vazio ou não; manifestos existentes; preferências globais do usuário (stack favorita registrada em regras pessoais); templates/skills instalados (`.claude/skills`, `.agents/skills`, prompt files); sistema operacional e gerenciadores disponíveis.

**Lacunas e perguntas.** As três que mais mudam o resultado, na ordem do Spec Kit (escopo > segurança > UX > técnica): (1) o que é o MVP (uma frase; "a primeira coisa que precisa funcionar"); (2) stack/linguagem — **nunca inventar**: perguntar ou instruir o agente a propor duas opções com trade-offs antes de criar arquivos; (3) restrições (prazo, hospedagem, dependências proibidas, licença). Opcional: "quer que o agente crie o `AGENTS.md` junto?".

**Esqueleto.** Objetivo do produto nas palavras do usuário → MVP e não-objetivos → Decisões já tomadas (stack, hospedagem) e decisões em aberto a confirmar antes de criar arquivos → Entregáveis do kickoff (estrutura de pastas, dependências mínimas, lint/format, testes com um teste de exemplo, script de execução, README curto, arquivo de instruções do agente com comandos verificados) → Ordem de trabalho (plano curto → confirmação → criação → execução do teste) → Verificação (comandos de build/test rodam sem erro; mostrar a saída) → Restrição de escopo ("não adicione features além do MVP").

**Verificação.** `install` + `test` + `run` executam; o agente mostra a saída dos comandos.

**Modo e primitivas.** Plan mode primeiro (Cursor Plan, Claude `/plan`, Antigravity `/plan`, Kilo `plan`, Cline Plan); Copilot `/new` e `#newWorkspace`; Spec Kit `/speckit-constitution` → `/speckit-specify` quando o usuário quer rigor de spec; Kiro steering fundacional (`product.md`, `tech.md`, `structure.md`) como modelo dos arquivos de instrução.

**Riscos.** Inventar stack (o exemplo do Prompt Boost cria "Node.js with Express" sem o usuário pedir); scaffolds inchados; pular verificação. Mitigação: perguntas obrigatórias de stack quando ausente; "mínimo necessário"; teste de exemplo obrigatório.

**Exemplo.** Antes: "quero fazer um app pra controlar despesas da república". Depois: "Vamos iniciar um projeto novo: um app para controlar despesas compartilhadas de uma república (moradores lançam gastos, o app divide e mostra quem deve a quem). MVP: cadastrar moradores, lançar despesa com valor e pagador, ver saldo por pessoa. Fora do MVP por enquanto: login, app móvel, pagamentos. Antes de criar arquivos, proponha duas opções de stack com trade-offs em 5 linhas cada e aguarde minha escolha [nenhuma stack informada; nenhum manifesto no workspace]. Depois crie: estrutura mínima, lint e formatador, um teste de exemplo passando, script para rodar localmente, README curto e um `AGENTS.md` com os comandos reais de instalar/testar/rodar. Termine mostrando a saída de instalar e testar."

### F3 — Implementar (feature ou mudança em código existente)

**Objetivo.** Prompt que leva o agente a implementar uma mudança correta, dentro do escopo, seguindo os padrões do repositório, com verificação.

**Sinais.** "implementar", "adicionar", "criar", "fazer com que", "suportar", "integrar", "add", "implement", "build", "wire", "support". Desempate com F7: se o objetivo é comportamento novo, F3; se é "mesma coisa, código melhor", F7.

**Contexto a coletar.** Arquivo ativo e seleção; arquivos @mencionados; símbolos relacionados (busca rápida pelo nome do recurso); padrão existente semelhante (um arquivo que já faz algo parecido — "follow the pattern in HotDogWidget.php"); rules files; framework de teste e comando; branch e diff atual; diagnósticos abertos.

**Lacunas e perguntas.** (1) Onde (qual módulo/arquivo; opções vindas da busca); (2) comportamento esperado em 1–2 casos concretos de entrada/saída ou critério de aceite; (3) nível de ambição ("mínimo que funciona" vs "completo: estados vazio/erro/carregando, acessibilidade, testes") — a alavanca "be ambitious" do Claude Code; (4) restrições (sem nova dependência? não tocar em X?). Se a tarefa toca mais de ~3 arquivos ou envolve decisão de arquitetura, oferecer F6 (planejar primeiro).

**Esqueleto.** Objetivo e porquê (nas palavras do usuário) → Contexto (arquivos alvo com menção na sintaxe do IDE; padrão a seguir; stack) → Requisitos/critérios de aceite (comportamento observável; casos de borda explicitamente pedidos; exemplos de I/O fornecidos pelo usuário preservados verbatim) → Restrições e escopo (o que não tocar; dependências; "preserve o comportamento existente") → Ordem de trabalho leve (ler os arquivos citados → plano curto → implementar → testar) → Verificação (teste novo ou existente; comando; evidência) → Suposições/perguntas abertas ("confirme antes de agir em: …") quando o usuário optou por não responder perguntas.

**Verificação.** Testes existentes continuam passando; teste novo cobre o comportamento; comando exibido com saída.

**Modo e primitivas.** Agent/Code; menções de arquivo (`@src/x.ts`, `#file:src/x.ts`, `@/src/x.ts` no Cline); Kiro `#spec:<nome>` quando há spec; Copilot prompt files para tarefas repetitivas; Claude `/batch` e Antigravity `/teamwork` para mudanças em larga escala (encaminhar para F17).

**Riscos.** Inflar requisitos; micro-roteiro que engessa o agente; escopo aberto que vira refatoração geral. Mitigação: "Avoid over-engineering" (bloco oficial da Anthropic) quando ambição = mínima; limite de tamanho do prompt.

**Exemplo.** Antes: "adiciona um filtro por status na tabela de pedidos". Depois: "Adicione um filtro por status à tabela de pedidos em [@src/pages/orders/OrdersTable.tsx], para que o usuário veja só pedidos de um status por vez. Siga o padrão do filtro por data já existente em [@src/pages/orders/DateFilter.tsx] e os valores de status definidos em [@src/types/order.ts]. Critérios: dropdown com 'Todos' como padrão; a filtragem acontece no mesmo lugar em que a filtragem por data acontece hoje; estado vazio quando nenhum pedido corresponde. Só altere a página de pedidos; não adicione dependências. Verifique rodando [`pnpm test src/pages/orders`] e adicione um teste para o filtro seguindo [OrdersTable.test.tsx]. Mostre o comando e a saída."

### F4 — Corrigir erro

**Objetivo.** Prompt que exige reprodução, diagnóstico com evidência e correção mínima coberta por teste, evitando "consertar" o sintoma.

**Sinais.** "corrigir", "bug", "erro", "quebrou", "não funciona", "falha", "exceção", "stack trace", "regressão", "fix", "broken", "crash", "failing", "doesn't work", texto colado com traceback. Desempate: presença de mensagem de erro, diagnóstico ou teste falhando → F4 mesmo que o usuário diga "melhorar".

**Contexto a coletar.** Mensagem de erro/stack trace colada (preservada verbatim); diagnósticos do painel Problems (`@problems`, `#read/problems`); saída recente do terminal (`@terminal`, `#read/terminalLastCommand`); testes falhando (`#execute/testFailure`, Copilot `/fixTestFailure`); arquivo ativo e seleção; commits recentes nos arquivos envolvidos (`git log` do caminho); comando de teste do repo.

**Lacunas e perguntas.** (1) Qual erro, quando não há evidência no contexto — opções vindas de diagnósticos, testes falhando, TODO/FIXME e commits recentes (padrão severity1); (2) como reproduzir (comando, entrada, ambiente) se não dedutível; (3) escopo da correção ("só este caso" vs "e casos relacionados que encontrar: listar, não corrigir" — regra de parada do Kiro).

**Esqueleto.** Sintoma observado (verbatim) e comportamento esperado → Onde começar (arquivos/símbolos do stack trace ou da busca; mudanças recentes) → Método (reproduzir primeiro; levantar 2–3 causas prováveis e confirmar com evidência antes de editar — "Reflect on 5-7 different possible sources… distill… 1-2… add logs" do modo Debug de Roo/Kilo; pedir confirmação do diagnóstico quando a correção for invasiva) → Correção mínima; "preserve o comportamento existente"; não refatorar ao redor → Verificação (teste que falha antes e passa depois; suíte existente) → Relato (causa raiz, mudança, teste, efeitos colaterais possíveis) → Regra de parada para problemas relacionados.

**Verificação.** Teste de regressão novo; suíte verde; para bugs de UI, screenshot ou gravação quando o IDE suporta (Antigravity, Cursor `@Browser`).

**Modo e primitivas.** Modo Debug (Roo/Kilo Debug, Cursor CLI `/debug`, Antigravity `/boost` para bugs difíceis); Copilot `/fix`, `/fixTestFailure`; Kiro bugfix spec ("WHEN [condition] THEN the system SHALL CONTINUE TO [existing behavior]"); Spec Kit `/speckit-bug-assess` → `-fix` → `-test`.

**Riscos.** Corrigir o sintoma (try/catch engolindo erro); hardcode para passar teste (bloco oficial "general-purpose solution… Do not hard-code values"); mudar comportamento que outros dependem. Mitigação: exigir causa raiz + teste; "preserve existing behavior".

**Exemplo.** Antes: "o login tá quebrando depois de um tempo, arruma isso". Depois: "Usuários relatam que o login falha depois de algum tempo de sessão. Reproduza antes de corrigir: comece pelo fluxo de renovação de token em [@src/auth/ — arquivos `session.ts` e `refresh.ts` alterados nos últimos 3 commits] e pelo teste que falha [`auth.test.ts > refreshes expired token`, saída colada abaixo]. Levante as causas prováveis, confirme com evidência (logs ou teste) e me mostre o diagnóstico antes de editar se a correção tocar mais de um módulo. Faça a correção mínima, preservando o comportamento atual de logout. Adicione um teste que falhe antes e passe depois; rode [`pnpm test src/auth`]. Relate causa raiz, mudança e teste. Se encontrar problemas relacionados, liste sem corrigir. Erro observado: ```[traceback colado pelo usuário, verbatim]```."

### F5 — Revisar código

**Objetivo.** Prompt que produz uma revisão útil: foco em corretude, segurança e aderência às convenções do projeto, com evidência por achado, severidade e veredito, sem ruído de estilo (salvo se pedido).

**Sinais.** "revisar", "review", "dá uma olhada", "audita", "antes de mergear", "PR", "diff", "code review", "check this". Desempate com F10 (investigar): revisão é sobre uma mudança delimitada (diff, PR, arquivo); investigação é sobre o estado do sistema.

**Contexto a coletar.** Alvo da revisão: diff da branch (`@Branch (Diff with Main)` no Cursor, `#search/changes` no Copilot, `@git-changes` no Roo, número do PR), arquivos selecionados ou abertos; rules files (convenções a aplicar); testes que cobrem a área; checklist de revisão existente no repo (`.github/PULL_REQUEST_TEMPLATE`, `docs/review.md`).

**Lacunas e perguntas.** (1) O que revisar (diff não commitado, branch inteira, PR #, arquivo); (2) foco (corretude e bugs; segurança; desempenho; legibilidade; testes) — múltipla escolha; (3) saída (comentários no chat; comentários inline no PR; lista de ações; "só bloqueadores").

**Esqueleto.** Escopo exato (o que está em revisão e o que não está) → Foco e critérios (corretude vs intenção descrita; segurança; regressões; cobertura de testes; convenções do repo em [rules file]) → Disciplina de evidência (cada achado com `arquivo:linha`, trecho curto, por que é problema, correção sugerida; severidade; "só sinalize X se [critério]"; "até N achados"; pular estilo salvo se pedido — "Don't drop the `skip style` part", Claude Code) → Somente leitura (não editar; opcional: "proponha o diff da correção") → Veredito final (aprovar / mudanças necessárias) e os 3 itens mais importantes.

**Verificação.** Cada achado é verificável no código citado; opcionalmente o agente roda a suíte para confirmar regressões.

**Modo e primitivas.** Claude `/review`, `/security-review`; Copilot Code Review e agente Reviewer ("Review code for incorrect behavior and missing tests without editing files"); JetBrains "Perform Self-Review with AI"; Roo `review.md` (security-first); Cursor BugBot; modo Ask/read-only.

**Riscos.** Revisor que sempre acha "algo" (ruído de estilo); falsos positivos sem evidência; revisar fora do diff. Mitigação: noise guards, cap de achados, evidência obrigatória.

**Exemplo.** Antes: "revisa isso aí antes de eu abrir o PR". Depois: "Revise as mudanças não commitadas desta branch [@Commit (Diff of Working State); 6 arquivos em `src/payments/`] antes de eu abrir o PR. Foque em corretude em relação ao objetivo da branch [`feat/retry-webhooks`], regressões, erros de concorrência e cobertura de testes; aplique as convenções de [AGENTS.md]. Ignore estilo. Para cada achado: `arquivo:linha`, trecho, por que importa, correção sugerida, severidade (bloqueador/importante/menor). No máximo 10 achados; só sinalize desempenho se houver custo concreto. Não edite arquivos. Termine com veredito (pronto para PR ou não) e os três itens mais importantes."

---

## 3.5 Funções estratégicas adicionais

### F6 — Planejar / especificar (antes de implementar)
Objetivo: mini-spec revisável (objetivo, critérios de aceite, fora de escopo, riscos, passos) antes de qualquer edição; entrevista curta quando há ambiguidade. Sinais: "planejar", "como você faria", "arquitetura", "spec", "proposta", tarefa ampla detectada em F3. Contexto: igual a F3 + ADRs/docs de arquitetura. Perguntas: critérios de sucesso; restrições não negociáveis; nível de detalhe do plano. Esqueleto: problema → objetivo e critérios de aceite mensuráveis → alternativas a pesar (Kilo plan mode: "simplicity vs performance vs maintainability") → plano em passos ancorados em caminhos reais (nudge `plan` do severity1: "Anchor each step to a real file path"; sem estimativas de tempo, regra do Architect do Roo) → riscos e perguntas abertas (no máximo 3 `[NEEDS CLARIFICATION]`, Spec Kit) → "não implemente; pare para revisão". Modo: Plan em todos os IDEs; Antigravity `/plan` e `/grill-me`; Claude "interview me until you could write the spec, then write it to SPEC.md"; Spec Kit `/speckit-specify` → `/speckit-clarify`; Kiro requirements (EARS: "WHEN [condition] THE SYSTEM SHALL [behavior]").

### F7 — Refatorar / simplificar
Objetivo: mudança que preserva comportamento e interface pública, com a qualidade alvo nomeada. Sinais: "refatorar", "limpar", "simplificar", "extrair", "renomear", "dívida técnica", "refactor", "clean up", "simplify". Contexto: arquivo/símbolo alvo, testes que cobrem, usos do símbolo (`#search/usages`), padrão de referência no repo. Perguntas: qualidade a melhorar (legibilidade, duplicação, acoplamento, testabilidade); escopo (função, classe, módulo — opções vindas do código; padrão severity1); seguir padrão existente? Esqueleto: código em escopo → qualidade alvo → garantia de comportamento e API inalterados ("call out any place where behaviour could shift", Geoffrey-Zulu modo refactor) → diff contra o original → verificação (suíte existente; sem alteração de snapshot sem justificativa). Modo: Agent; Claude `/simplify`; Copilot `/simplify`/`/optimize`; JetBrains "Suggest refactoring".

### F8 — Testar
Objetivo: gerar ou corrigir testes que cobrem comportamento, não implementação. Sinais: "testes", "cobertura", "teste unitário", "e2e", "tests", "coverage", "TDD". Contexto: framework e convenções de teste (localização, nomes, fixtures), arquivo alvo, testes vizinhos como exemplo, relatório de cobertura se existir. Perguntas: escopo de cobertura ("happy path" / "+ erros" / "+ casos de borda" — template severity1); casos específicos que o usuário quer garantir; estilo (unitário/integração). Esqueleto: alvo e comportamento a cobrir → seguir [arquivo de teste exemplo] e fixtures existentes → casos listados (incluindo os do usuário verbatim) → rodar e mostrar saída; para TDD: "escreva os testes primeiro e garanta que falham" (Spec Kit). Modo: Agent; Copilot `/tests`, `/setupTests`; JetBrains "Generate unit tests"; Cursor skill `/write-tests`.

### F9 — Explicar / perguntar (sem alterar código)
Objetivo: resposta explicativa fundamentada no código real, com diagrama quando ajuda, sem edições. Sinais: "o que faz", "por que", "como funciona", "explica", "what does", "why", "how does". Contexto: seleção/arquivo ativo, símbolos referenciados, erro colado. Perguntas: raramente; talvez profundidade. Esqueleto: pergunta precisa → arquivos a ler antes de responder ("Never speculate about code you have not opened", prompt oficial da Anthropic) → formato (propósito, componentes-chave, padrões; diagrama Mermaid se útil) → "não altere nada". Modo: Ask/read-only (Roo/Kilo Ask, Copilot Ask, Devin `/ask`, Cursor `/ask`, Aider `/ask`); Copilot `/explain`; JetBrains "Explain code".

### F10 — Investigar / auditar
Objetivo: varredura com evidência e veredito (ex.: "todos os endpoints têm autenticação?"). Sinais: "auditar", "verificar se todos", "onde está", "mapear", "quais arquivos", "audit", "trace", "check all", "find every". Contexto: escopo (diretórios), padrões a procurar, rules de segurança. Perguntas: critério de "problema"; escopo; cap de achados; formato (tabela, JSON para processamento). Esqueleto: diretrizes do gênero investigate do GaZmagik — evidência `file:line`, conjunto completo de perguntas por item, noise guards, contrato de saída estrito, somente leitura, fan-out para subagentes em varreduras amplas. Modo: Ask/read-only com subagentes (Claude Explore, Kilo `explore`, Antigravity `/teamwork` para escala).

### F11 — Otimizar desempenho
Objetivo: melhoria medida, não suposta. Sinais: "lento", "performance", "otimizar", "memória", "N+1", "slow", "optimize". Contexto: profiling existente, consultas, métricas, caminho quente. Perguntas: métrica e meta (latência p95? memória? tempo de build?); restrições (sem mudar API; sem cache externo). Esqueleto: medir antes → hipóteses ordenadas → mudar uma de cada vez → medir depois → relatar números antes/depois; "não otimize sem medir". Modo: Agent; Copilot `/optimize`; JetBrains "Optimize queries".

### F12 — Pesquisar documentação / web
Objetivo: resposta com fontes, separando verificado de inferido. Sinais: "pesquisa", "documentação de", "versão mais recente", "está deprecado?", "research", "look up", "is X maintained". Contexto: versões das dependências no manifesto; links colados. Perguntas: profundidade; fontes permitidas. Esqueleto: gênero research do GaZmagik — quotes verbatim com links, VERIFIED vs inferido, veredito por afirmação, resultados negativos honestos, sem escrever arquivos. Modo: ferramentas web do IDE (Copilot `#web/fetch`, Antigravity `/browser`, Cursor `@Browser`, Kilo `scout`, MCP Context7).

### F13 — Configurar o agente (AGENTS.md, regras, skills)
Objetivo: criar ou auditar o contrato do projeto com o agente — comandos verificados, convenções que o agente não descobre sozinho, limites de escopo. Estratégica porque melhora todos os prompts futuros e porque o próprio aprimorador lê esses arquivos como contexto. Sinais: "cria o AGENTS.md", "regras para o agente", "o agente repetiu o erro", "configura o Cursor/Claude/Antigravity". Contexto: rules files existentes de todos os formatos; manifestos e scripts; erros recorrentes relatados. Perguntas: ferramentas-alvo (gera ponteiros, não cópias); o que o agente errou recentemente. Esqueleto: princípio do Claude Code ("Only write down what Claude can't find by reading the repo"); seções do padrão `agents.md` (overview, build/test, estilo, testes, segurança, PR); comandos verificados executando-os; ponteiros para `.cursor/rules`, `CLAUDE.md`, `.agents/rules`, `.github/copilot-instructions.md`. Modo: Claude `/init`, Gemini `/init`, Roo `/init`, Copilot `/init` e `/create-instructions`, Cursor `/create-rule`, Antigravity `/learn`, Cline `/newrule`.

### F14 — Documentar
Objetivo: documentação que segue o padrão do repo e não inventa comportamento. Sinais: "documentar", "README", "docstring", "comentários", "document", "JSDoc". Contexto: docs existentes e estilo; símbolos sem doc; público-alvo. Perguntas: público (usuário final, contribuidor, API); escopo. Esqueleto: alvo → estilo a seguir [arquivo exemplo] → "documente só o que o código faz; marque incertezas" → não alterar código. Modo: Copilot `/doc`; JetBrains "Generate documentation".

### F15 — Migrar / atualizar / converter
Objetivo: mudança mecânica em larga escala com segurança. Sinais: "migrar", "atualizar versão", "converter para", "upgrade", "migrate", "port". Contexto: versão atual e alvo (manifesto), changelog da dependência, testes existentes. Perguntas: alvo exato; incremental ou tudo; critério de pronto. Esqueleto: inventário do que muda → plano por etapas verificáveis → executar por lotes com suíte verde entre lotes → relatório. Modo: F17 quando grande (Claude `/batch`, Antigravity `/teamwork`); Amazon Q `/transform` (legado).

### F16 — Commit, PR e conflitos
Objetivo: mensagem de commit/PR fiel ao diff; resolução de conflitos explicada. Sinais: "commit", "PR", "mensagem", "conflito", "changelog". Contexto: diff staged (`!{git diff --staged}` no Gemini; `@Commit` no Cursor), convenção de commits do repo, template de PR. Esqueleto: descrever o que mudou e por quê a partir do diff real; formato (conventional commits se o repo usa); para PR: resumo, como testar, riscos. Modo: Claude skill `commit`, JetBrains "Generate commit messages", Cline "Generate Commit Message", Windsurf `/address-pr-comments`.

### F17 — Decompor / orquestrar
Objetivo: quebrar tarefa grande em subtarefas independentes, com contexto completo para cada uma. Sinais: tarefa que toca muitos arquivos/módulos; "em todo o repo"; "paralelo". Esqueleto: regras do Orchestrator do Roo/Kilo (subtarefas com escopo explícito, "só faça o que está descrito", resumo de conclusão como fonte da verdade; ondas por dependência e por arquivos tocados). Modo: Claude `/batch` e subagentes, Antigravity `/teamwork`, Cursor agentes paralelos em worktrees, Copilot `#agent/runSubagent`.

---

## 3.6 Modificadores transversais

| Modificador | Valores | Efeito no prompt gerado |
|---|---|---|
| Escopo | mínimo (padrão para F4, F7) · ambicioso (opcional em F3, F2) | mínimo: bloco "Avoid over-engineering" (Anthropic); ambicioso: "be ambitious: [lista concreta do que incluir]" (Claude Code) |
| Autonomia | perguntar antes · decidir e seguir | "perguntar": perguntas do aprimorador antes de gerar ou seção "confirme antes de agir"; "seguir": "faça suposições razoáveis, liste-as no final"; critério de reversibilidade para ações destrutivas (Anthropic) |
| Plano primeiro | automático por complexidade · forçado · desligado | adiciona "pare após o plano" e sugere o modo Plan do IDE |
| Verificação | obrigatória (padrão) · leve | comando de teste do repo; evidência |
| Idioma do prompt | igual ao do usuário (padrão) · inglês | nunca traduzir sem pedir (queixa Augment #112); termos técnicos e código preservados |
| Modelo alvo | raciocínio · não raciocínio | raciocínio: sem CoT, sem "be thorough"; não raciocínio: pode manter ordem de passos explícita |

---

## 3.7 Matriz função × IDE (modo e primitiva a emitir)

| Função | Cursor | Antigravity | Copilot (VS Code) | Claude Code | Kilo / Roo / Cline | Windsurf (Devin Desktop) |
|---|---|---|---|---|---|---|
| F1 Entender | `/ask`, `@pasta/`, Plan Mode | `/plan` (descoberta), `@` fuzzy | Ask, `#search/codebase`, `/init` | Explore, `/init`, `@dir` | Ask (Kilo/Roo), `explore`; Cline Plan | `/ask`, `/plan` |
| F2 Iniciar | Plan Mode → Agent, `/create-rule` | `/plan` → Proceed, `/learn` | `/new`, `#newWorkspace`, `/create-instructions` | `/plan`, `/init` | `plan` → `code`; Roo Architect; Cline `/deep-planning` | `/plan` → Implement |
| F3 Implementar | Agent, `@arquivo` | Agent, `@arquivo`, `/goal` | Agent, `#file`, prompt files | Agent, `@arquivo`, `/goal` | `code`/Act, `@/arquivo` | `/code` |
| F4 Corrigir | `/debug`, `@Terminals` | `/boost` (difíceis) | `/fix`, `/fixTestFailure`, `#read/problems` | Agent + teste; `/debug` (sessão) | Debug; `@problems`, `@terminal` | `/code` |
| F5 Revisar | BugBot; Ask + `@Branch…` | Ask-like + `/diff` | Reviewer agent, Code Review, `#search/changes` | `/review`, `/security-review` | Roo `review.md`; `@git-changes` | `/ask` |
| F6 Planejar | Plan Mode (Shift+Tab) | `/plan`, `/grill-me` | Plan agent `/plan` | `/plan`, Plan subagent | `plan`; Architect; `/deep-planning` | `/plan`, `megaplan` |
| F7 Refatorar | Agent | Agent | `/simplify`, `/optimize` | `/simplify` | `code`; "Improve with Cline" | `/code` |
| F8 Testar | skill `/write-tests` | Agent | `/tests`, `/setupTests` | Agent | `code` | `/code` |
| F9 Explicar | `/ask` | Ask-like | `/explain`, Ask | Agent (somente leitura pedido) | Ask; "Explain with Cline" | `/ask` |
| F13 Configurar agente | `/create-rule`, `/create-skill` | `/learn`, `.agents/rules` | `/init`, `/create-instructions` | `/init`, `/memory` | `/init` (Roo); `/newrule` (Cline) | `.devin/rules` |

Sintaxe de menção por alvo: Cursor `@arquivo`, `@pasta/`, `@Terminals`, `@Chats`, `@Commit (Diff of Working State)`, `@Branch (Diff with Main)`, `@Browser` (removidos em 2.0: `@Web`, `@Link`, `@Definitions`); Antigravity `@` parcial fuzzy, `@rules:`, `@conversation:`; Copilot `#file`, `#selection`, `#<símbolo>`, `#search/codebase`, `#read/problems`, `#search/changes`, `#web/fetch`; Claude Code `@caminho`, `@server:resource`; Roo `@/arquivo`, `@problems`, `@terminal`, `@git-changes`, `@url`; Cline `@/caminho`, `@/pasta/`; Kiro `#[[file:…]]`, `#spec:<nome>`.

---

## 3.8 Classificação automática (função "Auto")

1. **Bypass:** slash commands, prompts muito curtos (< 10 tokens, GaZmagik), respostas a perguntas do agente ("sim", "ok, faça"), texto já estruturado (seções/critérios presentes) → devolver inalterado.
2. **Evidência forte primeiro:** stack trace/diagnóstico/teste falhando → F4; diff/PR como alvo → F5; workspace vazio → F2.
3. **Regex por função** (PT + EN), pontuação por acertos, desempate por especificidade na ordem F4 > F10 > F12 > F5 > F7 > F8 > F6 > F2 > F3 > F9 (gêneros mais distintivos primeiro, como no GaZmagik).
4. **Fallback:** modelo pequeno classifica entre as 17 intenções com confiança; abaixo do limiar, F3 (implementar) com pergunta "é isso?".
5. **Sempre visível e trocável:** chip da função no preview; a troca regenera o prompt.

---

## 3.9 Priorização sugerida

- **MVP (Task 2–3):** F1, F2, F3, F4, F5 (pedidas) + F6 Planejar, F8 Testar, F9 Explicar, F13 Configurar agente, e o modo Auto. Motivo: cobrem as intenções mais frequentes nos estudos (geração de código, resolução de issues, how-to/conceitual, revisão) e as alavancas com mais evidência (planejar antes, verificar depois, perguntar quando ambíguo).
- **Fase 2:** F7, F10, F11, F12, F14, F15, F16, F17.
- **Critério de entrada de uma função nova:** tem verificação própria, tem perguntas próprias fundamentáveis no contexto, e muda o esqueleto. Se só muda o tom, é modificador, não função.
