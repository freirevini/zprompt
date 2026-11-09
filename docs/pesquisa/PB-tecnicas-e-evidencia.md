# Pesquisa B — Técnicas e meta-prompts para um *prompt enhancer* one-shot em IDEs de IA

Data: 2026-11-05. Escopo: (A) meta-prompts e guias dos fornecedores de modelos; (B) métodos acadêmicos/open-source de otimização de prompts aplicáveis a um enhancer one-shot; (C) evidência empírica sobre o que torna prompts para agentes de código eficazes; (D) como avaliar um enhancer e seus modos de falha. Funcionalidades de enhancers específicos (Kilo "Enhance Prompt", bolt, Replit etc.) ficaram fora do escopo por combinação.

Convenções: citações verbatim ficam no idioma original, dentro de blocos de código ou entre aspas. Tudo que não pôde ser confirmado em fonte primária nesta sessão está marcado **[UNVERIFIED]**. Números de papers que cito de memória (não re-abertos nesta sessão) estão marcados **[UNVERIFIED-número]** — o paper e a URL existem, mas o valor exato não foi re-conferido.

---

## 1. Sumário executivo

1. **Os meta-prompts públicos dos fornecedores convergem num mesmo esqueleto.** O meta-prompt de geração da OpenAI (publicado verbatim na documentação) e a descrição do *prompt improver*/*generator* da Anthropic fazem essencialmente as mesmas cinco operações: (i) entender objetivo/requisitos/restrições/saída esperada; (ii) **preservar o conteúdo do usuário** e fazer mudanças mínimas; (iii) impor raciocínio antes da conclusão; (iv) padronizar/enriquecer exemplos; (v) explicitar formato de saída. O meta-prompt da OpenAI é o único cujo texto integral é público (Seção 2.2); o metaprompt da Anthropic é público no notebook do cookbook (Seção 2.1.2).

2. **Para agentes de código, a orientação oficial de 2025–2026 mudou de "adicione mais instruções" para "diga ao agente o que ele não consegue ver".** A página atual de boas práticas do Claude Code tem uma tabela "What you can stop doing" que desaconselha explicitamente `think hard`, `IMPORTANT`/CAIXA ALTA, "keep going / don't be lazy" e descrever arquitetura no CLAUDE.md. A Anthropic recomenda remover *over-prompting* ("Instructions such as 'If in doubt, use [tool]' cause overtriggering"); a OpenAI diz que, no GPT-5, prompts contraditórios ou vagos "can be more damaging" porque o modelo gasta raciocínio tentando reconciliá-los; o guia de modelos de raciocínio da OpenAI manda "Avoid chain-of-thought prompts"; o Google diz que o Gemini 3 gera raciocínio interno e que CoT explícito na saída "is usually unnecessary". **Implicação direta para um enhancer:** o valor está em *especificidade factual* (arquivo, símbolo, sintoma, critério de pronto, limites de escopo, comando de verificação), não em incantações.

3. **O que todas as fontes (vendors + estudos) dizem que falta nos prompts de desenvolvedores é o mesmo conjunto: restrições, tratamento de erros/edge cases, contexto do ambiente e critério de verificação.** O estudo Prompt Coach (15 devs profissionais, rubrica de 8 dimensões, LLM-as-judge) mediu as menores notas exatamente em *Inclusion of Constraints* (50,5/100), *Error Handling* (52,6) e *Context Awareness* (56,6), e as maiores em *Clarity* (79,9) — ou seja, devs já escrevem claro; o que falta é o "contorno" da tarefa. A tabela "Instead of / Try" do Claude Code e os pares fraco/forte de Copilot, Roo/Kilo, Devin/Windsurf e Lovable ilustram o mesmo padrão: nomear arquivo/função, descrever sintoma, dizer o que "pronto" significa, delimitar o que não tocar.

4. **Sub-especificação é o maior risco mensurável — e a solução one-shot não é "inventar o que falta".** Em Ambig-SWE (variante sub-especificada do SWE-bench Verified) modelos "struggle to distinguish between well-specified and underspecified instructions", e interagir para esclarecer melhora "up to 74% over the non-interactive settings". ClarifyGPT elevou o GPT-4 de 70,96% para 80,80% no MBPP-sanitized ao detectar ambiguidade (inconsistência entre amostras de código) e perguntar. No estudo de reescrita de prompts de Sarkar et al. (2025), o reescritor fez suposições plausíveis em 74 de 100 conversas e a plausibilidade **não** previu sucesso; os autores recomendam perguntar cedo em vez de adivinhar. Um enhancer one-shot deve, portanto, **tornar as lacunas explícitas** (seção "Assumptions / Open questions" no prompt gerado, ou instruir o agente a confirmar antes de agir em pontos ambíguos), não preenchê-las silenciosamente.

5. **Métodos acadêmicos de otimização automática (APE, OPRO, ProTeGi, TextGrad, MIPROv2, GEPA, PromptBreeder) não são one-shot**: exigem conjunto de validação + métrica + dezenas a milhares de execuções. Eles são úteis para *otimizar o meta-prompt do enhancer* offline (GEPA/MIPROv2 via DSPy), não para reescrever o prompt do usuário em tempo real. As técnicas one-shot com evidência razoável são: rephrase-and-respond/expansão de intenção, plan-and-solve (como estrutura do prompt, não como incantação), step-back (perguntar o princípio antes do detalhe), decomposição least-to-most (quebrar em passos verificáveis) e self-refine aplicado ao próprio prompt gerado (gerar → criticar com rubrica → corrigir, em 2–3 chamadas).

6. **Avaliação recomendada (Seção 5):** combinação de (a) *downstream task success* em tarefas de código com testes ocultos (SWE-bench-like + variantes sub-especificadas como Ambig-SWE/HumanEvalComm), (b) juiz LLM pareado com troca de posição e critério "vence só se melhor em ≥1 critério e não pior em nenhum" + rating humano de **preservação de intenção** numa escala de 3 pontos (protocolo de Sarkar et al.), (c) rubrica de qualidade de prompt (8 dimensões do Prompt Coach) como diagnóstico, e (d) métricas de produto: taxa de aceitação/envio sem edição, distância de edição entre o prompt gerado e o enviado, taxa de re-prompt. Controle de viés de verbosidade é obrigatório (juízes LLM têm *verbosity bias* documentado).

7. **Modos de falha documentados de reescritores**: requisitos alucinados/suposições silenciosas; *intent drift* (inclusive por moderação do reescritor); reescritor que *responde* em vez de reescrever; *prompt bloat* (degradação de raciocínio com comprimento, custo, truncamento); instruções contraditórias; perda da voz/conteúdo do usuário; injeção de incantações obsoletas (CoT, personas, CAIXA ALTA, "don't be lazy"); *few-shot* que induz cópia de padrão; e, em otimizadores baseados em LLM, reflexão que "struggle[s] to identify the true causes of errors" e é "biased by their own prior knowledge" (Ma et al., 2024).

---

## 2. Meta-prompts e guias dos fornecedores (com trechos verbatim)

### 2.1 Anthropic

#### 2.1.1 Prompt improver (Console)

A página de docs antiga (`/prompt-engineering/prompt-improver`) hoje redireciona para a página consolidada "Prompting best practices" e não tem mais texto próprio; o Internet Archive não é acessível a partir deste ambiente. A fonte primária disponível é o anúncio oficial (claude.com/blog/prompt-improver, 14 nov 2024). O que ele descreve (paráfrase próxima do original, confirmada na página):

- **Chain-of-thought refinement**: adiciona uma seção em que Claude raciocina passo a passo antes de responder.
- **Example standardization**: reformata exemplos numa estrutura XML consistente.
- **Example enrichment**: acrescenta raciocínio aos exemplos existentes para que casem com o prompt reestruturado.
- **Rewriting**: clarifica estrutura e corrige gramática/ortografia.
- **Prefill addition**: pré-preenche o turno do Assistant para direcionar comportamento e formato.
- Resultados reportados: +30% de acurácia num teste de classificação multirrótulo com Claude 3 Haiku e 100% de aderência a contagem de palavras numa tarefa de sumarização (dados baseados em Wikipedia; amostras nas notas de rodapé). Fluxo: rodar o prompt refinado → dar feedback do que ainda falha → repetir; gerenciamento de exemplos no Workbench, com geração de exemplos sintéticos quando o prompt não tem nenhum.

Observação importante para 2026: a técnica de *prefill* foi descontinuada nos modelos novos. A página atual de boas práticas diz: "Starting with Claude 4.6 models and Claude Mythos Preview, prefilled responses (providing a partial assistant message for Claude to continue from) on the last assistant turn are no longer supported. Requests with prefilled assistant messages to these models return a 400 error." A migração sugerida: "Use direct instructions in the system prompt: 'Respond directly without preamble. Do not start with phrases like "Here is...", "Based on...", etc.'" ou structured outputs. **Um enhancer não deve gerar prefills.**

#### 2.1.2 Prompt generator e o metaprompt do cookbook

Anúncio oficial (claude.com/blog/prompt-generator, 20 mai 2024): o gerador roda sobre "a long prompt that includes many task-description-to-template examples, asks Claude to plan the template's structure before writing it, and uses XML tags to mark each section"; adota papel de especialista (ex.: "You will be acting as a content moderator to classify chat transcripts as either approved or rejected"), dá espaço para raciocínio (scratchpad), usa variáveis em `{{HANDLEBARS}}` com entradas longas envoltas em XML. Afirmação: os prompts gerados "do not always produce perfect results" mas "often outperform hand-written prompts created by those who are new to prompt engineering".

Notebook público (fonte primária): `https://raw.githubusercontent.com/anthropics/anthropic-cookbook/main/misc/metaprompt.ipynb` (também linkado da página de overview como `claude-cookbooks/blob/main/misc/metaprompt.ipynb`). Estrutura confirmada no notebook:

- Abertura: Claude é posto a escrever instruções para "an eager, helpful, but inexperienced and unworldly AI assistant" que precisa de instruções cuidadosas e exemplos.
- Cinco exemplos completos de tarefa→instruções (agente de suporte, similaridade de sentenças, QA sobre documento com citações, tutor socrático de matemática, assistente de pesquisa com function calling).
- Processo em três passos exigido na saída: (1) listar o conjunto mínimo e não sobreposto de variáveis de entrada em `<Inputs>` (tipicamente 1–3); (2) planejar onde cada variável entra em `<Instructions Structure>`, colocando entradas longas **antes** das instruções que as usam; (3) escrever as instruções finais em `<Instructions>`.
- Regras: variáveis como `{$NOME}` envoltas em XML; quando há nota/score, justificar **antes** de pontuar; em tarefas complexas, mandar o modelo pensar em tags de scratchpad/inner monologue antes de responder — "Simple tasks should omit this"; se a saída deve ir em tags específicas, nomeá-las.
- O notebook extrai o conteúdo entre `<Instructions>`, encontra variáveis por regex e testa o template com um segundo modelo.

#### 2.1.3 "Prompting best practices" (página viva, platform.claude.com)

A antiga "Claude 4 best practices" e as páginas de técnicas (clear & direct, examples, XML, role, CoT, chaining, long context) foram consolidadas nesta página. Trechos verbatim relevantes para um enhancer:

```text
Claude responds well to clear, explicit instructions. Being specific about the output you want can help enhance results. If you want Claude to do more than the task strictly requires, explicitly request it rather than relying on the model to infer this from vague prompts.

Think of Claude as a brilliant but new employee who lacks context on your norms and workflows. The more precisely you explain what you want, the better the result.

Key test: Show your prompt to a colleague with minimal context on the task and ask them to follow it. If they'd be confused, Claude will be too.
```

Exemplo oficial (menos eficaz → mais eficaz):
```text
Create an analytics dashboard
```
```text
Create an analytics dashboard. Include as many relevant features and interactions as possible. Go beyond the basics to create a fully-featured implementation.
```

Contexto/motivação: "Providing context or motivation behind your instructions, such as explaining to Claude why such behavior is important, can give Claude more information about your goals" — exemplo `NEVER use ellipses` vs. `Your response will be read aloud by a text-to-speech engine, so never use ellipses since the text-to-speech engine will not know how to pronounce them.` "Claude can generalize from the explanation."

Exemplos: "Examples are one of the most reliable ways to steer Claude's output format, tone, and structure." Devem ser **Relevant**, **Diverse** ("Cover edge cases and vary enough that Claude doesn't pick up unintended patterns"), **Structured** (`<example>`/`<examples>`). "Include 3–5 examples for best results."

XML: "XML tags help Claude parse complex prompts unambiguously, especially when your prompt mixes instructions, context, examples, and variable inputs."

Long context: "Put long-form data at the top ... above your query, instructions, and examples." Nota: "Queries at the end can improve response quality by up to 30 percent in tests, especially with complex, multidocument inputs."

Overthinking / over-prompting (seção "Overthinking and excessive thoroughness"):
```text
* Replace blanket defaults with more targeted instructions. Instead of "Default to using [tool]," add guidance such as "Use [tool] when it would enhance your understanding of the problem."
* Remove over-prompting. Tools that undertriggered in previous models are likely to trigger appropriately now. Instructions such as "If in doubt, use [tool]" cause overtriggering.
```
Prompt de amostra: `When you're deciding how to approach a problem, choose an approach and commit to it. Avoid revisiting decisions unless you encounter new information that directly contradicts your reasoning. ...`

Overeagerness (prompt de amostra oficial — útil como bloco "scope" num enhancer):
```text
Avoid over-engineering. Only make changes that are directly requested or clearly
necessary. Keep solutions simple and focused:

- Scope: Don't add features, refactor code, or make "improvements" beyond what was
asked. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need
extra configurability.

- Documentation: Don't add docstrings, comments, or type annotations to code you didn't
change. Only add comments where the logic isn't self-evident.

- Defensive coding: Don't add error handling, fallbacks, or validation for scenarios
that can't happen. Trust internal code and framework guarantees. Only validate at system
boundaries (user input, external APIs).

- Abstractions: Don't create helpers, utilities, or abstractions for one-time
operations. Don't design for hypothetical future requirements. The right amount of
complexity is the minimum needed for the current task.
```

Evitar hardcoding para passar testes (prompt oficial):
```text
Please write a high-quality, general-purpose solution using the standard tools
available. Do not create helper scripts or workarounds to accomplish the task more
efficiently. Implement a solution that works correctly for all valid inputs, not just
the test cases. Do not hard-code values or create solutions that only work for specific
test inputs. Instead, implement the actual logic that solves the problem generally.

Focus on understanding the problem requirements and implementing the correct algorithm.
Tests are there to verify correctness, not to define the solution. Provide a principled
implementation that follows best practices and software design principles.

If the task is unreasonable or infeasible, or if any of the tests are incorrect, please
inform me rather than working around them. The solution should be robust, maintainable,
and extendable.
```

Minimizar alucinação em código:
```text
<investigate_before_answering>
Never speculate about code you have not opened. If the user references a specific file,
you MUST read the file before answering. Make sure to investigate and read relevant
files BEFORE answering questions about the codebase. Never make any claims about code
before investigating unless you are certain of the correct answer - give grounded and
hallucination-free answers.
</investigate_before_answering>
```

Autonomia vs. segurança (prompt oficial, resumido): "Consider the reversibility and potential impact of your actions. You are encouraged to take local, reversible actions like editing files or running tests, but for actions that are hard to reverse, affect shared systems, or could be destructive, ask the user before proceeding." Lista: operações destrutivas (`rm -rf`, drop table), difíceis de reverter (`git push --force`, `git reset --hard`), visíveis a terceiros (push, comentar PRs, mensagens). "When encountering obstacles, do not use destructive actions as a shortcut. For example, don't bypass safety checks (e.g. --no-verify)..."

Chaining: "The most common chaining pattern is self-correction: generate a draft → have Claude review it against criteria → have Claude refine based on the review."

Arquivos temporários: `If you create any temporary new files, scripts, or helper files for iteration, clean up these files by removing them at the end of the task.`

#### 2.1.4 Claude Code — "Best practices" (code.claude.com/docs/en/best-practices; o antigo artigo de engenharia redireciona para cá)

Princípio-guia: "Only write down what Claude can't find by reading the repo, or what it would otherwise spend time rediscovering every session." Teste: "1. Could it find this by reading the code? 2. Would it actually go and look? If both are yes, leave it out."

Seção "Write a specific prompt" (verbatim):
```text
A specific prompt helps for the same reason, because it gives Claude information it doesn't already have. If you name the file, describe the symptom, and say what "fixed" looks like up front, you usually save yourself a round of corrections later.

The same goes for a preference between two reasonable approaches: Claude can't read that from the code, so if you care which one it picks, say so up front.

| Instead of | Try |
| "fix the login bug" | "users report login fails after the session times out. look at token refresh in src/auth/, write a failing test that reproduces it, then fix it" |
| "add a calendar widget" | "follow the pattern in HotDogWidget.php and build a calendar widget that lets you pick a month and page between years. no new libraries" |
```
"If you already have the thing Claude needs, hand it over instead of describing it" (arquivo via `@`, screenshot, `cat error.log | claude -p ...`).

Sobre incantações: "Phrases like `think step by step` or `be thorough` are ordinary prompt text rather than keywords. The main control for how hard Claude thinks is the effort level ... One phrase that does still help is `be ambitious`. Claude tends to read a request conservatively and build the smallest thing that satisfies it, since it can't see how much you were hoping for." Exemplo: `build the settings page from the mockup. be ambitious: empty and error states, the save flow wired up, keyboard navigation, not just the layout` — "That's telling Claude about scope, which only you know, rather than how hard to think."

"Brainstorm with Claude first": `I want to add rate limiting to the public API but haven't thought it through yet. Interview me until you could write the spec, then write it to SPEC.md.` — depois iniciar sessão nova a partir do SPEC.md.

"Give Claude a check to run": "Claude stops when the work looks done. If it has nothing to run that tells it whether the work actually *is* done, 'looks done' is all it has to go on." Formas: no prompt (`run the auth tests after, and keep going until they pass`), `/goal`, Stop hook, revisão por subagente. "Whichever option you use, ask Claude for *evidence*: the command it ran and its output, or the screenshot." Revisão contra spec: `use a subagent to review the rate limiter diff against SPEC.md, check every requirement is implemented and the listed edge cases have tests, report gaps that affect correctness and skip style` — "Don't drop the `skip style` part ... A reviewer that's asked to find problems will always find *something*."

Tabela "What you can stop doing" (trechos):
```text
| Add IMPORTANT or ALL CAPS to instructions Claude keeps missing | Older models sometimes needed the emphasis. Current ones follow a plainly worded line, and piling on emphasis mostly makes Claude over-apply the rule. ... |
| `think hard`, `think harder`, `be thorough` in the prompt | Effort is the control for that. Those phrases are ordinary prompt text that nudges Claude within its effort setting rather than keywords that raise it. `ultrathink` still works ... |
| Tell Claude to keep going, loop until done, don't be lazy | Current models usually carry on through an agreed task without being told, and lines like that are more likely to cause over-work than fix a stall. Giving Claude a check to pass is different, and still worth doing. |
| Describe your architecture and file layout in `CLAUDE.md` | Claude reads the repo itself. Only write down what isn't in there. |
```

#### 2.1.5 "Building effective agents" (anthropic.com/research/building-effective-agents)

"finding the simplest solution possible"; padrões: prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer; três princípios: "Maintain simplicity in your agent's design", transparência (mostrar passos de planejamento), "Carefully craft your agent-computer interface (ACI)". Apêndice sobre ferramentas: documentar como "docstring for a junior developer"; *poka-yoke* ("Change the arguments so that it is harder to make mistakes"); exigir caminhos absolutos eliminou erros após `cd`; a equipe gastou mais tempo otimizando ferramentas do que o prompt geral no agente SWE-bench.

#### 2.1.6 "Effective context engineering for AI agents" (anthropic.com/engineering/...)

Objetivo: "the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome." *Context rot*: a precisão de recuperação cai conforme tokens crescem; atenção é orçamento finito. System prompt na "right altitude": "the Goldilocks zone between two common failure modes" — lógica rígida/frágil vs. orientação vaga. "We recommend organizing prompts into distinct sections" (XML ou headers Markdown). Exemplos: "a set of diverse, canonical examples" em vez de uma lista de casos de borda. Retrieval just-in-time; compaction; notas estruturadas; subagentes retornam "a condensed, distilled summary". Princípio: "Do the simplest thing that works."

#### 2.1.7 Agente SWE-bench da Anthropic (anthropic.com/engineering/swe-bench-sonnet)

"give as much control as possible to the language model itself, and keep the scaffolding minimal." Prompt sugere o fluxo sem ser longo: explorar repo → reproduzir o erro com script → editar → re-rodar → checar edge cases; pede "the minimal changes to non-tests files". Pensamento: "Your thinking should be thorough and so it's fine if it's very long." Ferramenta de edição por `old_str → new_str` com exatamente um match foi a mais confiável; "always require an absolute path". 49% no SWE-bench Verified (Claude 3.5 Sonnet upgraded, out/2024).

### 2.2 OpenAI

#### 2.2.1 Meta-prompt de geração de prompts (fonte primária, verbatim)

Página: developers.openai.com/api/docs/guides/prompt-generation (antiga platform.openai.com/docs/guides/prompt-generation). A página diz que o botão **Generate** do Playground usa "meta-prompts" com boas práticas embutidas e que versões futuras podem usar "techniques such as DSPy and gradient-descent-style optimization". Texto integral do meta-prompt de texto, extraído do HTML:

```text
Given a task description or existing prompt, produce a detailed system prompt to guide a language model in completing the task effectively.

# Guidelines

- Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.
- Minimal Changes: If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.
- Reasoning Before Conclusions**: Encourage reasoning steps before any conclusions are reached. ATTENTION! If the user provides examples where the reasoning happens afterward, REVERSE the order! NEVER START EXAMPLES WITH CONCLUSIONS!
    - Reasoning Order: Call out reasoning portions of the prompt and conclusion parts (specific fields by name). For each, determine the ORDER in which this is done, and whether it needs to be reversed.
    - Conclusion, classifications, or results should ALWAYS appear last.
- Examples: Include high-quality examples if helpful, using placeholders [in brackets] for complex elements.
   - What kinds of examples may need to be included, how many, and whether they are complex enough to benefit from placeholders.
- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions or bland statements.
- Formatting: Use markdown features for readability. DO NOT USE ``` CODE BLOCKS UNLESS SPECIFICALLY REQUESTED.
- Preserve User Content: If the input task or prompt includes extensive guidelines or examples, preserve them entirely, or as closely as possible. If they are vague, consider breaking down into sub-steps. Keep any details, guidelines, examples, variables, or placeholders provided by the user.
- Constants: DO include constants in the prompt, as they are not susceptible to prompt injection. Such as guides, rubrics, and examples.
- Output Format: Explicitly the most appropriate output format, in detail. This should include length and syntax (e.g. short sentence, paragraph, JSON, etc.)
    - For tasks outputting well-defined or structured data (classification, JSON, etc.) bias toward outputting a JSON.
    - JSON should never be wrapped in code blocks (```) unless explicitly requested.

The final prompt you output should adhere to the following structure below. Do not include any additional commentary, only output the completed system prompt. SPECIFICALLY, do not include any additional messages at the start or end of the prompt. (e.g. no "---")

[Concise instruction describing the task - this should be the first line in the prompt, no section header]

[Additional details as needed.]

[Optional sections with headings or bullet points for detailed steps.]

# Steps [optional]

[optional: a detailed breakdown of the steps necessary to accomplish the task]

# Output Format

[Specifically call out how the output should be formatted, be it response length, structure e.g. JSON, markdown, etc]

# Examples [optional]

[Optional: 1-3 well-defined examples with placeholders if necessary. Clearly mark where examples start and end, and what the input and output are. User placeholders as necessary.]
[If the examples are shorter than what a realistic example is expected to be, make a reference with () explaining how real examples should be longer / shorter / different. AND USE PLACEHOLDERS! ]

# Notes [optional]

[optional: edge cases, details, and an area to call or repeat out specific important considerations]
```
A mensagem de usuário enviada ao meta-prompt é `"Task, Goal, or Current Prompt:\n" + taskOrPrompt`.

Meta-prompt de **edição** (para melhorar um prompt existente dado um pedido de mudança) — começa com um bloco de raciocínio estruturado, e depois repete as mesmas Guidelines e estrutura acima:

```text
Given a current prompt and a change description, produce a detailed system prompt to guide a language model in completing the task effectively.

Your final output will be the full corrected prompt verbatim. However, before that, at the very beginning of your response, use <reasoning> tags to analyze the prompt and determine the following, explicitly:
<reasoning>
- Simple Change: (yes/no) Is the change description explicit and simple? (If so, skip the rest of these questions.)
- Reasoning: (yes/no) Does the current prompt use reasoning, analysis, or chain of thought?
    - Identify: (max 10 words) if so, which section(s) utilize reasoning?
    - Conclusion: (yes/no) is the chain of thought used to determine a conclusion?
    - Ordering: (before/after) is the chain of though located before or after
- Structure: (yes/no) does the input prompt have a well defined structure
- Examples: (yes/no) does the input prompt have few-shot examples
    - Representative: (1-5) if present, how representative are the examples?
- Complexity: (1-5) how complex is the input prompt?
    - Task: (1-5) how complex is the implied task?
    - Necessity: ()
- Specificity: (1-5) how detailed and specific is the prompt? (not to be confused with length)
- Prioritization: (list) what 1-3 categories are the MOST important to address.
- Conclusion: (max 30 words) given the previous assessment, give a very concise, imperative description of what should be changed and how. this does not have to adhere strictly to only the categories listed
</reasoning>
```
(A página também descreve um meta-prompt para saída de áudio — tom amigável, frases curtas, exemplos multi-turno com ≥4 trocas — irrelevante aqui.)

**Por que importa para o enhancer:** este é o único meta-prompt de produção integralmente público. Três cláusulas são diretamente reaproveitáveis: *Minimal Changes*, *Preserve User Content* e *Specificity ... (not to be confused with length)*. O bloco `<reasoning>` do meta-prompt de edição é um bom modelo de "diagnóstico antes de reescrever" (que pode ser oculto do usuário).

#### 2.2.2 GPT-4.1 prompting guide (developers.openai.com/cookbook/examples/gpt4-1_prompting_guide)

Três lembretes para agentes (o guia dá o texto completo; as aberturas verbatim): Persistence — "You are an agent - please keep going until the user's query is completely resolved..."; Tool-calling — "If you are not sure about file content or codebase structure pertaining to the user's request..." (não adivinhar, usar ferramentas); Planning — "You MUST plan extensively before each function call, and reflect extensively on the outcomes...". Reportado: os três lembretes elevaram o score interno em SWE-bench Verified em "close to 20%"; passar ferramentas pelo campo `tools` da API (e não no prompt) deu +2%; planejamento explícito +4%; harness resolveu 55%.

Estrutura recomendada de prompt: Role and Objective → Instructions (com subseções) → Reasoning Steps → Output Format → Examples → Context → instrução final ("think step by step"). Long context: instruções **no início e no fim**; se só uma posição, acima do contexto. Delimitadores: Markdown como ponto de partida; XML bom para aninhamento/metadata; JSON "performed particularly poorly for large document inputs". Prompt SWE-bench: fluxo de 8 passos (understand → investigate → plan → implement incrementally → debug → test frequently → iterate → reflect), ênfase pesada em testes/edge cases ("the top failure mode"), regra "if you say you will make a tool call, actually make it".

#### 2.2.3 GPT-5 prompting guide (developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)

- Eagerness: menos ("Goal: Get enough context fast. Parallelize discovery and stop as soon as you can act."; "Search depth: very low"; "Usually, this means an absolute maximum of 2 tool calls"; escape hatch "even if it might not be fully correct") vs. mais ("please keep going until the user's query is completely resolved, before ending your turn"; "Never stop or hand back to the user when you encounter uncertainty").
- Contradições: "poorly-constructed prompts containing contradictory or vague instructions can be more damaging to GPT-5" — o modelo "expends reasoning tokens searching for a way to reconcile the contradictions". "We recommend testing your prompts in our prompt optimizer tool to help identify these types of issues."
- Código: "Write code for clarity first. Prefer readable, maintainable solutions with clear names"; "Use high verbosity for writing code and code tools."; "Be aware that the code edits you make will be displayed to the user as proposed changes"; "you should almost never ask the user whether to proceed with a plan".
- Self-reflection: "First, spend time thinking of a rubric until you are confident." ... "create a rubric that has 5-7 categories" ... "do not show this to the user."
- Lições da Cursor: "sections of their prompt that had been effective with earlier models needed tuning"; removeram "the maximize_ prefix and softened the language around thoroughness"; "Bias towards not asking the user for help if you can find the answer yourself."; specs em XML como `<[instruction]_spec>` melhoraram aderência.

#### 2.2.4 Reasoning best practices (developers.openai.com/api/docs/guides/reasoning-best-practices)

Lista verbatim: "Keep prompts simple and direct"; "Avoid chain-of-thought prompts" (os modelos raciocinam internamente; pedir passo a passo "can hurt results"); "Use delimiters for clarity"; "Try zero shot first, then few shot if needed"; "Provide specific guidelines"; "Be very specific about your end goal" (definir critérios de sucesso e deixar o modelo iterar até atendê-los); "Markdown formatting" (`Formatting re-enabled`). Modelos de raciocínio: "Navigating ambiguous tasks" — "often ask clarifying questions before guessing"; "Reviewing, debugging, and improving code quality".

#### 2.2.5 Prompt engineering (docs gerais, developers.openai.com/api/docs/guides/prompt-engineering)

Estrutura de developer message: **Identity → Instructions → Examples → Context** ("Context ... usually placed near the end because it may change between requests"); headers Markdown + XML para delimitar documentos. "reasoning models will provide better results on tasks with only high-level guidance"; GPT models precisam de instruções explícitas (analogia sênior vs. júnior). Few-shot: "lets you steer a large language model toward a new task by including a handful of input/output examples", com entradas diversas.

#### 2.2.6 Codex — AGENTS.md (learn.chatgpt.com/docs/agent-configuration/agents-md; o antigo developers.openai.com/codex/guides/agents-md redireciona)

Exemplos oficiais: "Run `npm run lint` before opening a pull request."; "Prefer `pnpm` when installing dependencies."; "Ask for confirmation before adding new production dependencies."; "Document public utilities in `docs/` when you change behavior."; seção `## Code Review Rules` com regras "concise, explain the behavior to flag and any safe path or exception". Descoberta: global (`AGENTS.override.md`/`AGENTS.md`), depois cada diretório da raiz até o cwd; "Codex concatenates files from the root down, joining them with blank lines" — arquivos mais próximos "override earlier guidance because they appear later in the combined prompt"; limite `project_doc_max_bytes` = 32 KiB.

**GPT-5-Codex prompting guide** (cookbook, datado 30 set 2025; existe uma versão para GPT-5.1-Codex-Max de 4 dez 2025) — não consegui abrir o notebook (404 nos caminhos tentados). **[UNVERIFIED]** De memória, o guia defende prompting mínimo ("less is more"), remoção de preâmbulos e de prompts de planejamento, raciocínio adaptativo, e afirma que o system prompt do Codex CLI é ~40% menor que o do GPT-5. Trate como não confirmado.

### 2.3 Google

#### 2.3.1 Prompt design strategies (aistudio.google.com/docs/prompting-strategies; antiga ai.google.dev/gemini-api/docs/prompting-strategies)

Estratégias: instruções claras e específicas (tipos de entrada; restrições; formato de resposta; "completion strategy" — dar o começo da estrutura desejada); few-shot — "We recommend to always include few-shot examples in your prompts."; número ótimo: poucos bastam, excesso faz o modelo "overfit the response to the examples"; formatação consistente dos exemplos (tags, espaços, separadores); adicionar contexto em vez de "assuming that the model has all of the required information"; quebrar prompts em componentes (uma instrução por prompt; encadear; agregar); iteração ("If you're not getting the expected results from your prompt, try rephrasing it."; tarefa análoga; mudar ordem). Seção Gemini 3: ser direto, delimitadores consistentes, priorizar instruções críticas; em contextos longos "place instructions at the very end of the prompt"; Gemini 2.5/3 geram raciocínio interno, então raciocínio passo a passo explícito na saída "is usually unnecessary"; template de system instruction para agentes (steer reasoning, execution/reliability, interaction/output). Nota: para Gemini 4 e 3.6+, a página manda remover `temperature`/`top_p`/`top_k`.

#### 2.3.2 Gemini for Workspace — "Prompting guide 101" / "Writing effective prompts" (workspace.google.com/resources/ai/writing-effective-prompts)

Quatro áreas: **Persona, Task, Context, Format** (na versão PT da página: Perfil, Tarefa, Contexto, Formato — "você não precisa usar todas as quatro"). Dicas: "Use natural language"; "Be specific and iterate"; "Be concise and avoid complexity"; "Make it a conversation"; "Use your documents"; "Make Gemini your prompt editor". A afirmação de que "the most successful prompts average around 21 words" só apareceu em fonte secundária (9to5Google) e o PDF oficial (services.google.com/fh/files/misc/gemini-for-google-workspace-prompting-guide-101.pdf) retornou 404 nesta sessão — **[UNVERIFIED]**.

#### 2.3.3 Gemini CLI / Antigravity

Não encontrei página oficial de "como escrever prompts" para Gemini CLI nem para Antigravity (antigravity.google/docs redireciona para getting-started; buscas só retornam blogs de terceiros com frameworks tipo "Context-Action-Constraint"). **[UNVERIFIED / não encontrado]**. O guia do Gemini 3 (seção acima) é a orientação oficial mais próxima.

### 2.4 Fornecedores de ferramentas de código

#### 2.4.1 GitHub Copilot

Docs ("Prompt engineering for Copilot Chat"): "Start general, then get specific" (`Write a JavaScript function that tells me if a number is prime` + `The function should error if the input is not a positive integer`); "Give examples" (`findDates("I have a dentist appointment on 11/14/2023 and book club on 12-1-23") returns ["11/14/2023", "12-1-23"]`); "Break complex tasks into simpler tasks"; "Avoid ambiguity" (`What does the createUser function do?`); "Provide relevant context" (destacar código, `@` para anexar arquivos/issues/PRs); "Experiment and iterate"; "Keep history relevant" ("Start a new conversation or session when you begin a new task"); "Follow good coding practices".

Blog ("How to write better prompts for GitHub Copilot"): "Set the stage with a high-level goal" (`Create a basic markdown editor in Next.js with the following features:` + lista); "Make your ask simple and specific" (passos ordenados, saídas curtas); "Give Copilot an example or two" — sem exemplo gerou `[undefined, undefined]`, com `// Example: Extract names from the data array` / `// Desired outcome: ['John', 'Jane', 'Bob']` gerou `flatMap` correto; progressão `# Write some code for grades.py` → `# Implement a function in grades.py to calculate the average grade` → `# Implement the function calculate_average_grade in grades.py that takes a list of grades as input`; nomes descritivos (`def authenticate_user(username, password):` vs `def rndpwd(l):`).

#### 2.4.2 Cursor

Não localizei uma página oficial de "como escrever prompts" (cursor.com/docs não expõe tal página; a antiga guides/advanced/large-codebases retornou 404). O que existe de oficial e relevante está nas lições da Cursor dentro do GPT-5 guide da OpenAI (2.2.3): suavizar linguagem de "thoroughness", "Bias towards not asking the user for help if you can find the answer yourself", specs em XML. Síntese de terceiros aponta Plan Mode para tarefas complexas e começar conversas novas ao trocar de feature — **[UNVERIFIED]** quanto a texto oficial.

#### 2.4.3 Windsurf (→ Devin Desktop)

docs.windsurf.com/best-practices/prompt-engineering redireciona para docs.devin.ai/desktop/best-practices/prompt-engineering (Cognition). Conteúdo: "The better prompt and context that you provide to the model, the better the outcome will be." Três componentes: **Clear objective or outcome** (plano? código novo? refactor?), **All relevant context** (@-mentions), **Necessary constraints** (frameworks/linguagens, complexidade, segurança). Pares: `Write unit tests for all test cases for an Order Book object.` → `Using @class:unit-testing-module write unit tests for @func:src-order-book-add` + exceções a testar; `Refactor rawDataTransform.` → `Refactor @func:rawDataTransform by turning the while loop into a for loop` + casar com estrutura de `@func:otherDataTransformer`; `Create a new Button for the Contact Form.` → `Create a new Button component for the @class:ContactForm` usando o style guide de `@repo:frontend-components`.

#### 2.4.4 Lovable (parte de técnica)

Handbook (lovable.dev/blog/2025-01-16-lovable-prompting-handbook): quatro níveis — "Training Wheels Prompting" (template `# Context / ## Task / ### Guidelines / #### Constraints`), "No Training Wheels", "Meta Prompting" (`Rewrite this prompt to be more concise and detailed:`), "Reverse Meta Prompting" (pedir ao agente que documente erros resolvidos como prompt reutilizável). Técnicas: CoT só para depuração após ~3 tentativas falhas; "Steer clear of shortcuts or assumptions"; "seek clarification when necessary"; "Set constraints" (stack explícita); lock de arquivos (`Please refrain from altering pages X or Y and focus changes solely on page Z.`). Docs atuais (docs.lovable.dev/prompting/prompting-one): "Ask me any questions you need in order to fully understand what I want from this feature."; "Set boundaries for changes" — `Add a filter dropdown to the orders table so users can filter by status. Only change the orders page.`; prompt por componente; conteúdo real em vez de placeholders; pensar em estados vazio/carregando/erro.

#### 2.4.5 Kilo / Roo (páginas "Prompt Engineering")

Idênticas em conteúdo (kilo.ai/docs/customize/prompt-engineering; roocodeinc.github.io/Roo-Code/advanced-usage/prompt-engineering): "Clearly state what you want ... Avoid ambiguity." Pares: `Fix the code.` → `Fix the bug in the calculateTotal function that causes it to return incorrect results.`; `Fix the button.` → `@/src/components/Button.tsx Refactor the Button component to use the useState hook instead of the useReducer hook.`; `Write some Python code.` → `Create a new file named utils.py and add a function called calculate_average that takes a list of numbers and returns their average.`; `Fix everything.` → `@problems Address all errors and warnings in the current file.` Fluxo "think-then-do": Analyze → Plan → Execute (um passo por vez) → Review.

#### 2.4.6 Cline

A página de prompting atual (docs.cline.bot) foca em Rules: "Be explicit about file paths in your prompts." (nomear `src/services/user.ts` dispara regras por caminho); regras concretas, com o *porquê*; "Reference existing code" (apontar arquivo que já tem o padrão) em vez de descrever; regras curtas (consomem contexto); remover regras obsoletas; precedência workspace > global.

### 2.5 Síntese: o padrão convergente (base para o enhancer)

Todas as fontes acima, sem exceção, pedem as mesmas seis coisas num prompt para agente de código. Em ordem de frequência:

1. **Alvo concreto**: arquivo/símbolo/componente nomeado (`@` mentions quando a IDE suporta), não "o botão" ou "o login".
2. **Objetivo observável**: sintoma + comportamento esperado ("users report login fails after the session times out"), ou saída esperada com exemplo de I/O.
3. **Restrições e limites de escopo**: stack/libs permitidas ("no new libraries"), o que não tocar ("Only change the orders page"), padrão a seguir ("follow the pattern in HotDogWidget.php"), nível de ambição ("be ambitious: empty and error states...").
4. **Verificação**: teste a escrever/rodar, comando, evidência ("write a failing test that reproduces it, then fix it"; "run the auth tests after, and keep going until they pass"; "ask for evidence").
5. **Ordem de trabalho leve** (analisar → reproduzir → planejar → implementar → testar), sem micro-roteiro — Anthropic, OpenAI (8 passos) e mini-SWE-agent usam a mesma espinha dorsal.
6. **Tratamento de ambiguidade**: ou perguntar antes (Lovable, Claude Code "interview me", Ambig-SWE), ou declarar suposições; nunca preencher em silêncio.

E o que **não** incluir, por orientação oficial: CoT/"think step by step" para modelos de raciocínio; CAIXA ALTA/IMPORTANT; "don't be lazy/keep going"; personas genéricas; descrição de arquitetura que o agente lê sozinho; prefill; instruções contraditórias; listas longas de regras genéricas.

---

## 3. Catálogo de técnicas

Legenda de evidência: **A** = múltiplos papers/benchmarks ou docs oficiais com números; **B** = um paper sólido ou docs oficiais sem número; **C** = anedótico/terceiros. "One-shot?" avalia se cabe numa única chamada (ou 2–3 chamadas rápidas) de um enhancer de IDE, sem conjunto de validação.

| Técnica | O que faz | One-shot num enhancer de IDE? | Evidência | Fonte |
|---|---|---|---|---|
| Meta-prompt de geração (OpenAI) | Transforma descrição em system prompt estruturado: instrução concisa → detalhes → Steps → Output Format → Examples → Notes; preserva conteúdo do usuário; raciocínio antes da conclusão | **Sim** (é exatamente isso) | B (docs oficiais; sem números) | developers.openai.com/api/docs/guides/prompt-generation |
| Meta-prompt de edição com `<reasoning>` (OpenAI) | Diagnostica estrutura/exemplos/complexidade/especificidade antes de reescrever | **Sim** (diagnóstico oculto + reescrita) | B | idem |
| Metaprompt Anthropic (`<Inputs>`/`<Instructions Structure>`/`<Instructions>`) | Planeja variáveis e estrutura antes de escrever; XML; scratchpad só em tarefas complexas | Parcial (voltado a templates com variáveis; a ideia "planejar estrutura antes" é reaproveitável) | B | anthropic-cookbook/misc/metaprompt.ipynb |
| Prompt improver Anthropic (CoT + exemplos padronizados/enriquecidos + rewrite) | Melhora prompt existente iterativamente com feedback | Parcial (o passo de CoT é contraindicado para agentes de raciocínio; a padronização de exemplos é útil) | B (+30% em classificação, Haiku 3) | claude.com/blog/prompt-improver |
| Especificidade factual (arquivo, sintoma, "pronto") | Dá ao agente o que ele não consegue inferir do repo | **Sim** — núcleo do enhancer; limitado pelo que o usuário/IDE fornece (seleção, arquivo aberto, diagnostics) | A (convergência de todos os guias; Prompt Coach: menores notas em constraints/context/error handling) | code.claude.com/docs/en/best-practices; Prompt Coach arXiv 2607.06074 |
| Limites de escopo / anti-overengineering | "Only change X", "no new libraries", bloco "Avoid over-engineering" | **Sim** | B (prompt oficial Anthropic; Lovable) | platform.claude.com best practices |
| Verificação embutida (teste falho primeiro, comando, evidência) | Fecha o loop do agente | **Sim** (quando o enhancer sabe o comando de teste do repo ou pede ao agente para descobri-lo) | A (Claude Code docs; GPT-4.1 SWE-bench "top failure mode" = testes; SWE-bench agent reproduce-first) | code.claude.com; GPT-4.1 guide; swe-bench-sonnet |
| Plan-and-Solve (estrutura analisar→planejar→executar→revisar) | Força plano antes de agir | **Sim**, como esqueleto de workflow; **não** como frase mágica ("Let's first understand the problem and devise a plan...") em modelos de raciocínio | A para modelos antigos (Wang et al. 2023 **[UNVERIFIED-número]**); B para agentes (Roo/Kilo think-then-do; GPT-4.1 +4% planning) | arXiv 2305.04091; GPT-4.1 guide |
| Least-to-Most / decomposição | Quebra tarefa em subtarefas ordenadas e verificáveis | **Sim** (listar passos/entregáveis) | A (Zhou et al. 2022: SCAN 99% vs 16% CoT **[UNVERIFIED-número]**); Copilot docs "break complex tasks" | arXiv 2205.10625; docs.github.com |
| Step-Back prompting | Pergunta o princípio/abstração antes do detalhe | Parcial (útil como pergunta de diagnóstico interna do enhancer: "qual é a mudança de comportamento desejada?") | B (Zheng et al. 2023: ganhos de 7–27% em PaLM-2L **[UNVERIFIED-número]**) | arXiv 2310.06117 |
| Rephrase-and-Respond (RaR) | O modelo reformula/expande a pergunta antes de responder | **Sim** (é literalmente "expandir o pedido"); risco de intent drift | B (Deng et al. 2023 **[UNVERIFIED-número]**) | arXiv 2311.04205 |
| Self-Refine (gerar → critica → refinar) aplicado ao prompt gerado | 2–3 chamadas: rascunho, crítica por rubrica (ex.: 8 dimensões), correção | **Sim** (custo 2–3x) | A para tarefas gerais (~20% abs. médio, Madaan et al. 2023 **[UNVERIFIED-número]**); ressalva: "Is Self-Repair a Silver Bullet?" mostra ganhos modestos sem feedback informativo | arXiv 2303.17651; arXiv 2306.09896 |
| Clarificação / detecção de ambiguidade (ClarifyGPT, Ambig-SWE, HumanEvalComm, ClarifyCoder) | Detecta sub-especificação (ex.: inconsistência entre N amostras) e pergunta | Parcial: one-shot não pode perguntar, mas pode (a) listar "Open questions/Assumptions" no prompt, (b) instruir o agente a confirmar antes de agir, (c) oferecer 1–3 perguntas rápidas de múltipla escolha antes de gerar | A (ClarifyGPT GPT-4 70,96→80,80 MBPP-san.; Ambig-SWE até +74% com interação; HumanEvalComm >60% codificam em vez de perguntar; ClarifyCoder communication rate 24→63%) | arXiv 2310.10996; 2502.13069; 2406.00215; 2504.16331 |
| Few-shot / exemplos de I/O | Mostra formato/padrão desejado | **Sim** quando o usuário fornece (preservar); gerar exemplos sintéticos é arriscado (requisitos inventados) | A geral (Gemini "always include"; Anthropic 3–5 diversos; Copilot flatMap); contra: OpenAI reasoning "zero shot first"; Manus "don't few-shot yourself into a rut" | aistudio docs; platform.claude.com; reasoning-best-practices; manus.im |
| Estrutura com delimitadores (Markdown headers / XML) | Separa instrução, contexto, restrições, exemplos | **Sim** | A (todos os vendors; GPT-4.1: JSON ruim para docs longos; Cursor: XML specs) | GPT-4.1 guide; platform.claude.com; aistudio |
| Posição das instruções | Dados longos no topo, pergunta no fim (Anthropic: até +30%); GPT-4.1: início **e** fim; Gemini 3: fim | **Sim** (ordenar o prompt gerado: contexto → tarefa → critérios) | A | platform.claude.com; GPT-4.1 guide; aistudio |
| Contexto/motivação ("porquê") | Explicar a razão da restrição para o modelo generalizar | **Sim** | B (Anthropic; Cline rules) | platform.claude.com; docs.cline.bot |
| Role/persona | "You are a senior X" | **Não recomendado** como técnica de desempenho | A (Zheng et al. 2024: 162 personas, 4 famílias, 2.410 perguntas — "adding personas in system prompts does not improve model performance") | arXiv 2311.10054 |
| CoT explícito ("think step by step") | Pede raciocínio verbalizado | **Não** para modelos/agentes de raciocínio | A (Meincke et al. 2025: ganhos marginais e custo alto em modelos de raciocínio; OpenAI "Avoid chain-of-thought prompts"; Claude Code: frases ordinárias; Gemini 3 "usually unnecessary") | arXiv 2506.07142; reasoning-best-practices; code.claude.com |
| Agentic reminders (persistência, usar ferramentas, planejar) | Mantém o agente trabalhando até resolver | Depende da ferramenta-alvo: ajudou GPT-4.1 (~+20% interno); Claude Code 2026 diz que "keep going/don't be lazy" causa over-work; GPT-5 precisa de calibração de eagerness | A (conflitante por modelo) | GPT-4.1 guide; GPT-5 guide; code.claude.com |
| Self-reflection com rubrica interna (GPT-5 guide) | Modelo cria rubrica de 5–7 categorias e itera contra ela | **Sim** (pode ser instrução no prompt gerado para tarefas 0→1) | B | GPT-5 guide |
| Prefill do turno do assistente | Força formato/sem preâmbulo | **Não** (400 em Claude ≥4.6) | A (docs) | platform.claude.com |
| APE / OPRO / PromptBreeder / ProTeGi / TextGrad / PE2 | Busca/otimização de instruções com avaliação em dev set (OPRO: "Take a deep breath..." +8% GSM8K vs humano; ProTeGi até +31%; TextGrad GPQA 51→55% **[UNVERIFIED-número]**; PE2 +6,3% MultiArith / +3,1% GSM8K sobre "let's think step by step") | **Não** em tempo real; **Sim** offline para otimizar o meta-prompt do enhancer com um dataset de prompts rotulados | A (muitos papers; mas Ma et al. 2024 mostra reflexão pouco confiável) | arXiv 2211.01910; 2309.03409; 2309.16797; 2305.03495; 2406.07496; 2311.05661; 2402.02101 |
| DSPy MIPROv2 / GEPA | Otimização conjunta de instruções e demos de programas LM (MIPRO: até +13% em 5/7 programas; GEPA: +10% sobre MIPROv2, +6% média / até +20% sobre GRPO com até 35x menos rollouts) | **Não** em tempo real; forte candidato para otimizar offline o pipeline do enhancer (métrica: juiz pareado + sucesso downstream) | A | arXiv 2406.11695; 2507.19457; dspy.ai |
| Query rewriting (RAG) / Query2doc / PRewrite / Promptist / Prompt Expansion | Reescrita treinada por RL com recompensa da tarefa downstream (QA, retrieval, estética de imagem) | **Não** sem treino; conceito transferível: recompensa = sucesso do agente + preservação de intenção | A no domínio original (Ma et al. 2023 "consistent performance improvement") | arXiv 2305.14283; 2303.07678; 2401.08189; 2212.09611; 2312.16720 |
| Context engineering (Anthropic, Manus, LangChain) | Mínimo de tokens de alto sinal; recitação de objetivos (todo.md); manter erros no contexto; evitar poucos-exemplos uniformes; just-in-time retrieval | Parcial: informa o *tamanho* do prompt gerado (curto, alto sinal) e sugere incluir "plano/checklist recitável" | B | anthropic.com/engineering/effective-context-engineering-for-ai-agents; manus.im blog; blog.langchain.com/context-engineering-for-agents |
| Spec-driven development (Spec Kit, Kiro, SPEC.md) | Spec como fonte de verdade antes do código | Parcial: enhancer pode produzir mini-spec (objetivo, critérios de aceitação, fora de escopo) para tarefas grandes | C–B (análises conceituais; sem estudo controlado; Claude Code recomenda "interview me ... write SPEC.md") | arXiv 2602.00180; github.blog Spec Kit; code.claude.com |
| Taxonomias (Prompt Report; Prompt Pattern Catalog; Prompt Smells; Prompt Defects) | Vocabulário/checklists de técnicas e defeitos | **Sim** como lint negativo (defeitos a detectar no prompt do usuário e no gerado) | B | arXiv 2406.06608; 2302.11382; 2401.12611; 2509.14404 |

---

## 4. Evidência sobre eficácia de prompts para código

### 4.1 O que os desenvolvedores deixam de fora (e o que importa)

- **Prompt Coach (arXiv 2607.06074, 2026; 15 devs profissionais, 3 tarefas APPS, LLM-as-judge GPT-4.1, rubrica de 8 dimensões 0–100)**: baseline médio 63,0. Maiores: Clarity 79,9; Output Requirements 70,1. Menores: **Inclusion of Constraints 50,5; Error Handling 52,6; Context Awareness 56,6**. Experiência não previu a nota (r = 0,11). Após 60 min de tutoria socrática: 63,0 → 71,7 (+13,7%, p < .001), com maiores ganhos em Constraints (+31,6%), Error Handling (+30,7%) e Context Awareness (+23,6%); Clarity não mudou. Limitações: desenho de braço único, uma organização, sem contexto de projeto real. **Leitura para o enhancer:** as dimensões que um enhancer deve "puxar" do usuário/IDE são restrições, edge cases/erros e contexto de ambiente — não clareza de redação.
- **Ambig-SWE (arXiv 2502.13069, 2025)**: variante sub-especificada do SWE-bench Verified. "models struggle to distinguish between well-specified and underspecified instructions"; interação em entradas sub-especificadas rende "up to 74% over the non-interactive settings". Suposições não justificadas levam a "poor outcomes, safety risks from tool misuse, and wasted compute".
- **HumanEvalComm (arXiv 2406.00215, TOSEM 2025)**: com problemas modificados para serem inconsistentes/ambíguos/incompletos, ">60% of responses from code LLMs still generated code instead of asking questions".
- **ClarifyGPT (arXiv 2310.10996)**: detecção de ambiguidade por *code consistency check* (amostrar várias soluções e ver se divergem em testes gerados) + perguntas direcionadas; GPT-4 em MBPP-sanitized (avaliação humana, 10 participantes) 70,96% → 80,80%; média em 4 benchmarks GPT-4 68,02 → 75,75; ChatGPT 58,55 → 67,22.
- **ClarifyCoder (arXiv 2504.16331)**: fine-tuning para perguntar; communication rate 24% → 63% mantendo desempenho de geração competitivo.
- **Shin et al., "Prompt Engineering or Fine-Tuning" (arXiv 2310.10508; ICSE 2025)**: GPT-4 com prompt engineering automatizado "does not consistently outperform fine-tuned models" (em geração de código, modelos fine-tuned superaram em 28,3 pp no MBPP); o que mais ajudou foi **conversational prompting** com feedback humano (27 estudantes + 10 praticantes), em que participantes "gave explicit instructions or added context". Prompt engineering totalmente automático "still requires further investigation".
- **DevGPT (arXiv 2309.03914) e Jin et al. (arXiv 2402.11702)**: 29.778 prompts compartilhados; na análise de geração de código em PRs, o uso do código gerado "is typically limited to either demonstrating high-level concepts" ou exemplos de documentação — sinal de que prompts informais produzem código não integrável.
- **Prompting in the Wild (arXiv 2412.17298)**: em repositórios, desenvolvedores sobretudo acrescentam e modificam prompts durante desenvolvimento de features; apenas 21,9% das mudanças de prompt são documentadas em commits. **Patterns and Chaos (arXiv 2509.12421)**: 24.800 prompts em 92 repositórios com formatação inconsistente, duplicação e problemas de legibilidade/ortografia. **Prompts Are Programs Too! (arXiv 2409.12447)**: 14 observações sobre "prompt programming" (iteração por tentativa e erro, dificuldade de testar). **IBM — Exploring Prompt Engineering Practices in the Enterprise (arXiv 2403.08950)**: categoriza quais partes do prompt praticantes editam e como iteram (detalhes só no texto completo — não extraídos).
- **Barke et al., "Grounded Copilot" (arXiv 2206.15000) [UNVERIFIED-número]**: dois modos de uso — aceleração vs. exploração; em exploração, devs escrevem prompts/comentários e lutam para formulá-los — citado pelo Prompt Coach como motivação.

### 4.2 Evidência de vendors com números (agentes de código)

- GPT-4.1: três lembretes agentic (+~20% interno em SWE-bench Verified); planning explícito +4%; ferramentas via API +2%; "rigorous testing and edge cases" como principal modo de falha.
- Anthropic SWE-bench (49%): scaffold mínimo, reproduzir antes de editar, mudanças mínimas fora de testes, ferramenta de edição por string exata, caminhos absolutos; mais tempo em ferramentas do que no prompt.
- Anthropic prompting best practices: "Queries at the end can improve response quality by up to 30 percent" (contexto longo).
- GPT-5: contradições custam tokens de raciocínio; Cursor precisou **suavizar** linguagem de thoroughness.
- Claude Code (2026): "be ambitious" como alavanca de escopo; CAIXA ALTA faz o modelo "over-apply the rule"; "keep going" causa over-work.

### 4.3 Evidência sobre forma do prompt (geral, aplicável a código)

- **CoT**: Meincke et al. (arXiv 2506.07142; GPQA Diamond, 8 modelos): para modelos de raciocínio, CoT explícito traz "only marginal, if any, gains" com aumento substancial de tempo/tokens; em não-raciocínio ainda ajuda em média, mas aumenta variabilidade.
- **Persona**: Zheng et al. (arXiv 2311.10054, EMNLP Findings 2024): sem ganho sistemático; selecionar automaticamente a "melhor persona" não supera aleatório.
- **Formato/sensibilidade**: Sclar et al. (arXiv 2310.11324) mostram variações grandes de desempenho só por mudanças de formatação **[UNVERIFIED-número]**; He et al. (arXiv 2411.10541) idem com GPT-3.5/4 e formatos Markdown/JSON/YAML **[UNVERIFIED-número]** — reforça: usar estrutura consistente e testar no modelo-alvo.
- **Comprimento**: Levy et al. (arXiv 2402.14848): "notable degradation in LLMs' reasoning performance at much shorter input lengths than their technical maximum" (os experimentos chegam a poucos milhares de tokens **[UNVERIFIED-número]**); "Lost in the Middle" (arXiv 2307.03172) e "Easily Distracted by Irrelevant Context" (arXiv 2302.00093) **[UNVERIFIED-número]** — conteúdo irrelevante prejudica. Conclusão para o enhancer: **prompt gerado curto, com apenas contexto de alto sinal**.
- **Few-shot**: Gemini recomenda sempre, com poucos exemplos e formatação consistente; OpenAI (raciocínio) manda tentar zero-shot primeiro; Manus alerta que exemplos uniformes induzem imitação cega. Para código, exemplos de I/O concretos resolveram um caso real do Copilot (flatMap).
- **Spec-driven development**: a literatura 2025–2026 é conceitual (arXiv 2602.00180 define níveis spec-first / spec-anchored / spec-as-source; sem avaliação empírica); Gartner (mar 2026) pede "goals, technical constraints, acceptance criteria and boundary conditions"; relatos de praticantes são mistos (tempo total parecido; specs sub-especificadas produzem "confidently wrong code"). **Sem estudo controlado encontrado.**

### 4.4 Lições de agentes SWE-bench (OpenHands, SWE-agent, mini-SWE-agent)

- SWE-agent (arXiv 2405.15793): a interface agente-computador (ACI) importa tanto quanto o prompt — visualizador de arquivo com janelas pequenas, lint ao editar, buscas com saída concisa **[UNVERIFIED-detalhes]**. OpenHands (arXiv 2407.16741): plataforma com sandbox + browser + CodeAct **[UNVERIFIED-detalhes]**.
- mini-SWE-agent (config `mini.yaml`, fonte primária): system prompt de uma linha ("You are a helpful assistant that can interact with a computer."); o *instance template* carrega o fluxo: analisar código relevante → criar script que reproduz o problema → editar → "Verify your fix works by running your script again" → testar edge cases → submeter; cada resposta deve conter raciocínio + um comando bash. Ou seja, o **prompt de tarefa** (não o system prompt) é onde fica o workflow — análogo ao que um enhancer produz.

---

## 5. Como avaliar um prompt enhancer + modos de falha

### 5.1 Métodos e métricas

**(a) Sucesso downstream (o padrão-ouro).** Rodar o agente da IDE com o prompt original vs. o prompt melhorado sobre um conjunto fixo de tarefas com verificação automática: SWE-bench Verified/Lite (tarefas bem especificadas), **Ambig-SWE** e **HumanEvalComm** (sub-especificadas — medem se o enhancer evita suposições erradas), mais um conjunto próprio de pedidos reais de IDE (bug fix, feature, refactor, test writing). Métricas: pass rate em testes ocultos; nº de turnos/tool calls; tokens; nº de perguntas de clarificação feitas pelo agente; taxa de ações destrutivas/fora de escopo (arquivos tocados além do necessário — proxy de overengineering); regressões (testes existentes quebrados). Referências: GPT-4.1 guide (SWE-bench interno), Anthropic swe-bench-sonnet, Ambig-SWE.

**(b) Juiz LLM pareado — protocolo de Sarkar et al. (arXiv 2503.16789), adaptável diretamente.** Lá: GPT-4o compara as **respostas** obtidas com o prompt original vs. reescrito em escala Likert de 5 pontos por critério (coerência, relevância, adaptação, harmlessness); uma reescrita "vence" só se é melhor em ≥1 critério **e não pior em nenhum**; cada par é julgado nas duas ordens e a média é tomada (viés de posição); um segundo juiz (deepseek-v3) checa auto-preferência; 5 humanos julgam 100 casos (Krippendorff α = 0,67 vs. GPT-4o). Resultados: reescritas do GPT-4o venceram 68,6% / perderam 8,0% / empate 23,4% em conversas insatisfatórias; melhores em *information-seeking* (>70%) do que em escrita criativa; reescritores pequenos (Llama-3-8B) perdem mais do que ganham (23,8/40,5). **Para código**: julgar o *diff/resultado do agente*, não o prompt isolado, com critérios: corretude vs. intenção original, escopo respeitado, verificação feita, ausência de requisitos inventados.

**(c) Preservação de intenção (obrigatório).** Humanos (ou juiz LLM calibrado) avaliam se o prompt melhorado mantém a intenção numa escala de 3 pontos (Sarkar: ~74% forte, 21% parcial, 5% drift). Complementar com "contradiction check": o prompt gerado contém algo que o usuário não pediu ou que contradiz o pedido? Regra inspirada no juiz de intenção do LatentBreak: falha se adiciona negações/comandos ausentes do original **[UNVERIFIED-detalhe]**.

**(d) Rubrica de qualidade do prompt (diagnóstico, não objetivo final).** As 8 dimensões do Prompt Coach (Clarity, Specificity, Context Awareness, Adaptability, Inclusion of Constraints, Error Handling, Output Requirements, Testability; 0–100 com justificativa) servem para medir *o que* o enhancer acrescenta; a taxonomia de defeitos (arXiv 2509.14404) serve como lint negativo: ambiguous instruction, underspecified constraints, conflicting instructions, intent misalignment, missing relevant context, irrelevant/noisy context, overloaded prompt, excessive prompt length (prompt bloat), inefficient few-shot examples, unbounded output.

**(e) Métricas de produto.** Taxa de aceitação/envio do prompt melhorado sem edição; distância de edição (caracteres/tokens) entre o prompt gerado e o efetivamente enviado; taxa de "desfazer"; taxa de re-prompt/correção no turno seguinte; tempo até o primeiro diff aceito. Fundamento: em Copilot, a taxa de aceitação foi o melhor preditor de produtividade percebida (Ziegler et al., arXiv 2205.06537 **[UNVERIFIED-número]**).

**(f) Controle de viés de verbosidade e posição.** Juízes LLM têm *position bias*, *verbosity bias*, *self-enhancement bias* (Zheng et al., arXiv 2306.05685; concordância >80% com humanos quando bem configurados). Mitigações: troca de ordem, juiz de família diferente do reescritor, e win-rate controlado por comprimento (ideia do Length-Controlled AlpacaEval, arXiv 2404.04475). Reportar sempre o comprimento do prompt gerado como métrica própria.

**(g) Otimização offline do próprio enhancer.** Com (a)+(b) como métrica, usar MIPROv2/GEPA (DSPy) para otimizar o meta-prompt do enhancer; GEPA é atraente por usar feedback textual (traces de falha) e poucos rollouts. Cuidado com o achado de Ma et al. (arXiv 2402.02101): otimizadores-LLM "struggle to identify the true causes of errors during reflection" e são "biased by their own prior knowledge" — validar com holdout e humanos.

### 5.2 Modos de falha conhecidos de enhancers/reescritores

1. **Requisitos alucinados / suposições silenciosas.** Sarkar et al.: suposições plausíveis em 74/100 conversas; plausibilidade não previu sucesso; recomendam perguntar cedo. Ambig-SWE: suposições injustificadas → resultados ruins e risco de ferramentas. Taxonomia de defeitos: *intent misalignment* ("assumes a goal the user didn't have"). Mitigação: seção explícita "Assumptions (confirm before acting)" ou perguntas de múltipla escolha pré-geração (padrão "interview me" do Claude Code).
2. **Intent drift.** Casos de baixa preservação em Sarkar vieram de moderação do reescritor alterando o pedido; também o reescritor **respondendo** à tarefa em vez de reescrevê-la (ex.: entrada começando com "modify: ..."). O meta-prompt da OpenAI mitiga com "Preserve User Content" e "Minimal Changes".
3. **Verbosidade / prompt bloat.** Degradação de raciocínio com comprimento (Levy et al.), custo e truncamento (defeito "excessive prompt length"); Anthropic: "Remove over-prompting"; GPT-5: instruções contraditórias custam raciocínio; Claude Code: ênfase faz o modelo "over-apply". O meta-prompt da OpenAI distingue "Specificity ... (not to be confused with length)".
4. **Perda da voz/conteúdo do usuário.** Substituir termos do domínio, apagar exemplos ou snippets colados, traduzir o idioma do usuário sem pedir. Mitigação: regra de preservação literal de identificadores, caminhos, trechos de código e idioma.
5. **Injeção de incantações obsoletas.** CoT para modelos de raciocínio (OpenAI/Google/Anthropic desaconselham), personas (sem ganho), CAIXA ALTA, "don't be lazy", prefill (erro 400 em Claude ≥4.6).
6. **Over-constraint de autonomia ou de escopo.** Pedir "ask before every step" num agente feito para não perguntar (GPT-5: "almost never ask the user whether to proceed with a plan") ou, inversamente, "never ask" em tarefas sub-especificadas. A calibração depende da ferramenta-alvo; Anthropic sugere o critério de **reversibilidade** como meio-termo.
7. **Few-shot nocivo.** Exemplos sintéticos inventados pelo enhancer viram requisitos; exemplos uniformes induzem cópia (Manus; Gemini "overfit the response to the examples").
8. **Contradições internas** entre blocos gerados (ex.: "mudanças mínimas" + "be ambitious") — detectar com o lint de *conflicting instructions*.
9. **Reflexão não confiável do otimizador.** Ma et al. 2024 — não assumir que a "crítica" do LLM sobre o prompt identifica a causa real; medir downstream.
10. **Julgar o prompt em vez do resultado.** Juízes preferem prompts longos e estruturados independentemente do efeito; só (a) e (b) medem valor real.

### 5.3 Esqueleto recomendado para o prompt gerado (derivado das fontes)

Com base no meta-prompt da OpenAI (estrutura), nas tabelas "Instead of/Try" do Claude Code, nos componentes da Devin/Windsurf (objetivo, contexto, restrições), na rubrica do Prompt Coach e nos prompts oficiais da Anthropic (scope, verificação, reversibilidade):

```text
[Objetivo em 1–2 linhas, nas palavras do usuário, preservando termos/caminhos/código citados]

Context: arquivos/símbolos alvo (@mentions), stack, sintoma observado ou comportamento atual, padrão existente a seguir.
Requirements / acceptance criteria: comportamento esperado, exemplos de I/O se o usuário deu, casos de borda explicitamente pedidos.
Constraints / scope: o que não tocar, libs permitidas/proibidas, nível de ambição ("minimal fix" ou "be ambitious: ...").
Verification: teste a escrever/rodar (falhar antes, passar depois), comando, evidência a reportar.
Assumptions / open questions: lacunas detectadas; "confirm before acting on these" (ou perguntas para o usuário responder antes de enviar).
```
Sem persona, sem CoT, sem ênfase tipográfica, sem prefill; comprimento proporcional à tarefa; nunca inventar requisitos não inferíveis do pedido ou do contexto da IDE.

---

## 6. Lista de fontes

### Fornecedores (primárias, acessadas em 2026-11-05)
- Anthropic — Prompting best practices (página consolidada): https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Anthropic — Prompt engineering overview: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- Anthropic — Prompt improver (anúncio): https://claude.com/blog/prompt-improver
- Anthropic — Prompt generator (anúncio): https://claude.com/blog/prompt-generator
- Anthropic — Metaprompt notebook: https://raw.githubusercontent.com/anthropics/anthropic-cookbook/main/misc/metaprompt.ipynb (Colab: https://colab.research.google.com/github/anthropics/claude-cookbooks/blob/main/misc/metaprompt.ipynb)
- Anthropic — Claude Code best practices: https://code.claude.com/docs/en/best-practices (o antigo https://www.anthropic.com/engineering/claude-code-best-practices redireciona)
- Anthropic — Building effective agents: https://www.anthropic.com/research/building-effective-agents
- Anthropic — Effective context engineering for AI agents: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Anthropic — Raising the bar on SWE-bench Verified: https://www.anthropic.com/engineering/swe-bench-sonnet
- OpenAI — Prompt generation (meta-prompts verbatim): https://developers.openai.com/api/docs/guides/prompt-generation
- OpenAI — GPT-4.1 prompting guide: https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide
- OpenAI — GPT-5 prompting guide: https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide
- OpenAI — Reasoning best practices: https://developers.openai.com/api/docs/guides/reasoning-best-practices
- OpenAI — Prompt engineering: https://developers.openai.com/api/docs/guides/prompt-engineering
- OpenAI/Codex — AGENTS.md: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- OpenAI — GPT-5-Codex prompting guide (listado no cookbook, 30/09/2025; não aberto) [UNVERIFIED]: https://developers.openai.com/cookbook
- Google — Prompt design strategies (inclui seção Gemini 3): https://aistudio.google.com/docs/prompting-strategies
- Google Workspace — Writing effective prompts: https://workspace.google.com/resources/ai/writing-effective-prompts/ ; PDF "Prompting guide 101" (404 nesta sessão) [UNVERIFIED]: https://services.google.com/fh/files/misc/gemini-for-google-workspace-prompting-guide-101.pdf
- GitHub Docs — Prompt engineering for Copilot Chat: https://docs.github.com/en/copilot/using-github-copilot/prompt-engineering-for-github-copilot
- GitHub Blog — How to write better prompts for GitHub Copilot: https://github.blog/developer-skills/github/how-to-write-better-prompts-for-github-copilot/
- Windsurf → Devin — Prompt engineering: https://docs.devin.ai/desktop/best-practices/prompt-engineering (redirecionado de https://docs.windsurf.com/best-practices/prompt-engineering)
- Lovable — Prompting handbook: https://lovable.dev/blog/2025-01-16-lovable-prompting-handbook ; docs: https://docs.lovable.dev/prompting/prompting-one
- Kilo — Prompt engineering: https://kilo.ai/docs/customize/prompt-engineering
- Roo — Prompt engineering: https://roocodeinc.github.io/Roo-Code/advanced-usage/prompt-engineering
- Cline — Prompting/Rules: https://docs.cline.bot/prompting/prompt-engineering-guide
- Manus — Context Engineering for AI Agents: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
- mini-SWE-agent — config mini.yaml: https://raw.githubusercontent.com/SWE-agent/mini-swe-agent/main/src/minisweagent/config/mini.yaml
- Cursor docs (sem página oficial de prompting localizada) [UNVERIFIED]: https://cursor.com/docs
- Antigravity docs (sem página de prompting localizada) [UNVERIFIED]: https://antigravity.google/docs
- LangChain — Context engineering for agents (URL de memória) [UNVERIFIED]: https://blog.langchain.com/context-engineering-for-agents/
- GitHub — Spec Kit blog (URL de memória) [UNVERIFIED]: https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/

### Papers (verificados nesta sessão via abstract/HTML, salvo indicação)
- ClarifyGPT: https://arxiv.org/abs/2310.10996
- Ambig-SWE / Interactive Agents to Overcome Underspecificity in SE: https://arxiv.org/abs/2502.13069
- HumanEvalComm: https://arxiv.org/abs/2406.00215
- ClarifyCoder: https://arxiv.org/abs/2504.16331
- Prompt Engineering or Fine-Tuning (Shin et al.): https://arxiv.org/abs/2310.10508
- DevGPT: https://arxiv.org/abs/2309.03914 ; Can ChatGPT Support Developers? (Jin et al.): https://arxiv.org/abs/2402.11702
- Prompt Coach: https://arxiv.org/abs/2607.06074 (HTML: https://arxiv.org/html/2607.06074v1)
- A Taxonomy of Prompt Defects in LLM Systems: https://arxiv.org/abs/2509.14404
- Conversational User-AI Intervention (prompt rewriting): https://arxiv.org/abs/2503.16789
- Are LLMs Good Prompt Optimizers?: https://arxiv.org/abs/2402.02101
- GEPA: https://arxiv.org/abs/2507.19457 ; MIPRO(v2): https://arxiv.org/abs/2406.11695 ; PE2: https://arxiv.org/abs/2311.05661
- Personas do not improve performance (Zheng et al.): https://arxiv.org/abs/2311.10054
- Same Task, More Tokens (Levy et al.): https://arxiv.org/abs/2402.14848
- Judging LLM-as-a-Judge: https://arxiv.org/abs/2306.05685
- Query Rewriting for RAG (Ma et al.): https://arxiv.org/abs/2305.14283
- Exploring Prompt Engineering Practices in the Enterprise (IBM): https://arxiv.org/abs/2403.08950
- Spec-Driven Development: From Code to Contract: https://arxiv.org/abs/2602.00180
- The Prompt Report: https://arxiv.org/abs/2406.06608
- Decreasing Value of Chain of Thought (Meincke et al.): https://arxiv.org/abs/2506.07142
- Prompting in the Wild: https://arxiv.org/abs/2412.17298 ; Prompts Are Programs Too!: https://arxiv.org/abs/2409.12447 ; Patterns and Chaos in Prompt Management: https://arxiv.org/abs/2509.12421
- Prompt Smells: https://arxiv.org/abs/2401.12611

### Papers citados de memória (URL confiável; números marcados [UNVERIFIED-número] no texto)
- APE: https://arxiv.org/abs/2211.01910 ; OPRO: https://arxiv.org/abs/2309.03409 ; PromptBreeder: https://arxiv.org/abs/2309.16797 ; ProTeGi: https://arxiv.org/abs/2305.03495 ; TextGrad: https://arxiv.org/abs/2406.07496 ; DSPy: https://arxiv.org/abs/2310.03714
- RaR: https://arxiv.org/abs/2311.04205 ; Step-Back: https://arxiv.org/abs/2310.06117 ; Self-Refine: https://arxiv.org/abs/2303.17651 ; Plan-and-Solve: https://arxiv.org/abs/2305.04091 ; Least-to-Most: https://arxiv.org/abs/2205.10625 ; Is Self-Repair a Silver Bullet?: https://arxiv.org/abs/2306.09896
- Sclar et al. (formatting sensitivity): https://arxiv.org/abs/2310.11324 ; He et al. (prompt formatting impact): https://arxiv.org/abs/2411.10541 ; Lost in the Middle: https://arxiv.org/abs/2307.03172 ; Easily Distracted by Irrelevant Context: https://arxiv.org/abs/2302.00093
- Query2doc: https://arxiv.org/abs/2303.07678 ; PRewrite: https://arxiv.org/abs/2401.08189 ; Promptist: https://arxiv.org/abs/2212.09611 ; Prompt Expansion (T2I): https://arxiv.org/abs/2312.16720
- Length-Controlled AlpacaEval: https://arxiv.org/abs/2404.04475 ; Copilot acceptance rate (Ziegler et al.): https://arxiv.org/abs/2205.06537 ; Grounded Copilot (Barke et al.): https://arxiv.org/abs/2206.15000
- Prompt Pattern Catalog (White et al.): https://arxiv.org/abs/2302.11382 ; Meta Prompting for AI Systems: https://arxiv.org/abs/2311.11482 ; Systematic Survey of APO (Ramnath et al.): https://arxiv.org/abs/2502.16923 ; Survey of Automatic Prompt Engineering (optimization perspective): https://arxiv.org/abs/2502.11560 ; Survey of Context Engineering: https://arxiv.org/abs/2507.13334 ; Systematic Survey of Prompt Engineering (Sahoo et al.): https://arxiv.org/abs/2402.07927
- SWE-agent: https://arxiv.org/abs/2405.15793 ; OpenHands: https://arxiv.org/abs/2407.16741
