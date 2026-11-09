# Decisões

## 2026-11-05 — Escopo do aprimorador

- Objetivo: reescrever o prompt do desenvolvedor para Cursor ou Antigravity. Não gera código, não responde ao pedido.
- Sem campos de contexto no formulário: só rascunho e configuração.
- Sem armazenamento de interações; log técnico sem conteúdo.
- Funções: `understand`, `start`, `implement`, `fix`, `review`, `test`, mais `auto`.
- Ambiguidade vai para planejamento nativo: `/plan /grill-me` no Antigravity, Plan Mode no Cursor.

## 2026-11-05 — Modelo

- `gemini-3.8-flash` via Vertex AI, escolha do usuário. GA, lançado 2026-09-02, retirada não antes de 2027-09-02. Regiões `global`, `us`, `eu`. Dados conferidos na referência local verificada em 2026-10-23; confirmar na página do modelo antes de produção.
- `thinkingLevel: MEDIUM`, igual ao default. Sem `temperature`, `topP`, `topK`, `seed`: ignorados pelo modelo.
- Determinismo via `responseSchema` e system instruction.
- Model id só em `GEMINI_MODEL`.

## 2026-11-05 — Só diagnosticar

- Terceira opção em "Dúvidas". Prompt gerado proíbe qualquer alteração, pede investigação com evidência e relatório autocontido: resumo, diagnóstico, achados com severidade, ajustes propostos passo a passo, como verificar e decisões para aprovação.
- Uso: modelo forte investiga; modelo mais barato implementa a partir do relatório.
- Prevalece só sobre a parte de execução da função e sobre a rota para planejamento. Função, IDE, escopo, preservação de comportamento e skills continuam valendo dentro do relatório. Cursor em Ask; Antigravity em Agent com proibição no texto.
- Relatório com onze seções, incluindo seção específica por função, fora do escopo e um prompt de implementação pronto para o modelo mais barato. Limite do prompt gerado: 450 palavras.

## 2026-11-05 — Skills instaladas

- Opção selecionável "Incorporar skills instaladas". Segundo agente, `agent/skills-selector/`, perfil classificação, `gemini-3.8-flash`, `thinkingLevel: MEDIUM`.
- Servidor local em `server/` varre `SKILL.md` em qualquer profundidade. Cursor: `.cursor` do projeto e da home. Antigravity: `.gemini` e `.agents` do projeto, `.gemini` da home.
- Projeto detectado por `ZPROMPT_PROJECT_DIR`, depois pela pasta onde o `npm` foi chamado, subindo até um marcador de projeto; a home nunca vira projeto.
- Sem limite de quantidade: catálogo inteiro avaliado em lotes por orçamento de caracteres; estouro de saída divide o lote; ids conferidos contra o catálogo.
- Sem credenciais do Vertex, seleção por termos em comum, sinalizada na resposta e na tela.
- Removidos da tela: aba de diferenças, "O que mudou" e "O agente vai descobrir no código". Os campos continuam na resposta do aprimorador para validação no backend.

## 2026-11-05 — Frontend

- Angular 15, escolha do usuário. Versão fora de suporte desde maio de 2024 e dependente de Node 14, 16 ou 18, todos fora de suporte. Registrado como risco aceito. Superado em 2026-11-09 pelo chassi Angular 20.3.17 (entrada abaixo).
- Frontend nunca chama o Vertex direto; passa por backend.

## 2026-11-06 — Pipeline real e validação

- Aprimorador real: rota única `POST /api/enhance` no servidor local; o navegador só envia rascunho e configuração. Contrato do pedido mudou: `useSkills` e `skillPaths` no lugar da lista `skills`.
- Sem Vertex configurado, a tela mostra demonstração por regras fixas, rotulada, com o passo a passo para ligar o Vertex. Servidor desligado: erro com opção de demonstração.
- Segredos aparentes viram `[segredo-N]` antes de qualquer envio; o prompt final devolve o valor original.
- Triagem sem modelo: saudação ou texto sem palavra vira `INSUFFICIENT`.
- Skills nunca derrubam o aprimoramento: pasta ausente, pasta recusada ou falha do seletor viram aviso, e o pedido do caminho aparece no bloco de skills.
- Validação determinística com uma nova tentativa. Grave persistente (literal perdido, referência inventada, código novo, schema): erro, sem entregar prompt. Leve persistente (tamanho, frase proibida, skill não citada): prompt entregue com aviso.
- Regras 5 e 6 da instrução carregam as próprias exceções. Limite mínimo de palavras passou de 60 para 120: o exemplo de "Corrigir erro" da própria instrução tinha cerca de 90 palavras. Linhas de skills não contam no limite. Prompt 1.4.0; seletor 1.1.0, que passa a receber a autonomia.
- Arquivos de convenção (`AGENTS.md`, regras do IDE) podem ser citados sem estar no rascunho, sempre condicionados a existir.
- `changes` e `agentMustDetermine` continuam no schema como evidência para auditoria e regressão, fora da tela.
- Servidor só atende Host e Origin locais; POST exige JSON e o cabeçalho `x-zprompt`. Pasta informada só dentro da home, do projeto ou de `ZPROMPT_SKILL_ROOTS`; varredura com teto de pastas, arquivos, bytes e tempo.
- Regiões `us` e `eu` usam `aiplatform.us.rep.googleapis.com` e `aiplatform.eu.rep.googleapis.com`, conforme a documentação de locais do Vertex AI consultada em 2026-11-06. `VERTEX_API_HOST` sobrescreve.
- Pendentes por dependerem de decisão do dono ou de um projeto real (docs/05, 5.11 e 5.12): sonda do projeto (D1), modelo que vai executar (D3), função "Executar relatório aprovado" (D4), chips de skills (D6).

## 2026-11-09 — Copiar skills à parte

- Bloco "Skills incorporadas" ganha "Copiar skills" (todas) e "Copiar" por skill, separados do "Copiar prompt". Formato de cada linha: ``- `nome`: motivo (caminho do SKILL.md)``. O prompt continua incorporando as skills.

## 2026-11-09 — Função keep-codebase-knowledge

- Nova função `keep-codebase-knowledge`, com esse nome também na tela. Executa a tarefa do rascunho depois de consultar `docs/codebase/`, os documentos da skill `acquire-codebase-knowledge`.
- O prompt manda ler sempre `STRUCTURE.md`, `CONVENTIONS.md` e `CONCERNS.md`; `ARCHITECTURE.md`, `STACK.md`, `INTEGRATIONS.md` e `TESTING.md` conforme a tarefa. A natureza da tarefa sai dos sinais das outras funções, nunca `start`, e define esqueleto e modo.
- Documento e código divergem: vale o código, e a divergência entra no relato. Pasta ausente: o agente avisa, segue pelo código e sugere rodar a skill. Ao terminar, atualiza só a seção do documento que ficou desatualizada; em tarefa que não edita, só lista.
- Lint: `UNCHANGED` proibido nesta função; prompt sem `docs/codebase/` é falha grave; os sete documentos e a pasta contam como referência permitida; limite de palavras +60. Prompt 1.5.0, schema 1.3.0, seletor 1.2.0.
- Com `auto`, só é detectada quando o rascunho pede explicitamente a consulta aos documentos.

## 2026-11-09 — Descrição das opções

- Abaixo de Função, Escopo, Dúvidas e Preservar comportamento, a tela descreve o que a opção escolhida faz o agente fazer, com o modo do IDE quando ele é fixo. Textos em `FUNCTION_HINT`, `SCOPE_HINT`, `AUTONOMY_HINT` e `PRESERVE_HINT` (`frontend/src/app/core/options.ts`). Mudou o comportamento de uma opção em `agent/prompts/system-instruction.md`: ajustar o texto correspondente.

## 2026-11-09 — Sem rascunhos de exemplo na tela

- Removida a linha "Testar com" e seus sete rascunhos de exemplo. Os mesmos rascunhos seguem como casos de regressão em `agent/examples/casos.json`.

## 2026-11-09 — `docs/codebase/` sempre atualizado

- Regra em `AGENTS.md`: mudança em código, configuração, dependência, comando, estrutura ou testes atualiza no mesmo trabalho a seção afetada de `docs/codebase/`. Mapa de mudança para documento e modo de atualizar em `.rules/docs-codebase.md`.

## 2026-11-09 — Chassi Angular 20.3.17

- Frontend migrado de Angular 15.2 para Angular 20.3.17, Node 22.12.0, TypeScript 5.9.3, ESLint 9.33.0 e RxJS 7.8.2, escolha do dono. Plano e registro de cada etapa em `docs/06-plano-migracao-angular-20.md`; ponto de retorno na tag `angular-15`.
- Aprovado como proposto (D1 a D10): chassi novo no lugar de `ng update` encadeado; versões fixas sem `^` (20.3.17, mesmo com 20.3.35 publicado); `.nvmrc` com 22.12.0 na raiz e `engines` `^22.12.0` na tela, servidor segue `>=18.10`; zone.js mantido, sem zoneless nem signals; testes com Vitest pelo builder `@angular/build:unit-test`; nomes `app.component.*` mantidos; control flow `@if`/`@for`; `inject()`; `@angular/animations` e `@angular/platform-browser-dynamic` removidos.
- Mudou de fato: builder `@angular/build:application` (esbuild, dev-server Vite), saída em `dist/zprompt-web/browser/`; orçamento de estilo por componente mantido em 14 kB / 24 kB, porque o padrão do Angular 20 (8 kB de erro) quebraria o build; `logLevel` saiu de `proxy.conf.js`.
- Fidelidade: o DOM da tela foi comparado com o do Angular 15 em 23 estados, iguais em texto, estrutura e atributos de acessibilidade; golden de 48 casos da simulação local igual; checklist de tela S1 a S14 igual nas duas versões.
- Testes da tela: 33. Contorno do builder experimental: specs fora de `app.component.spec.ts` não importam valores de `core/options.ts`. Se o problema voltar, trocar para `@angular/build:karma`.
- Lint sem exceções: nenhuma regra desligada nem `eslint-disable`.
- Fora do escopo: signals, zoneless, Prettier, router, favicon e `public/`, nomes no estilo v20, Angular 21 ou 22, e os dois desvios de tela que já existiam no Angular 15 (texto "Escolha um exemplo à esquerda" e topbar desligada até o primeiro pedido).
- Risco: a linha 20 do Angular sai do suporte LTS em novembro de 2026. O salto para 21 ou 22 precisa de plano próprio.
