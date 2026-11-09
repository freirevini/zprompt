# Plano de migração do frontend para o chassi Angular 20.3.17

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** executado em 2026-11-09, Etapas 0 a 5, branch `migracao-angular-20`.

**Goal:** Trocar o chassi de `frontend/` de Angular 15.2 / TypeScript 4.9 / webpack para Angular 20.3.17 / Node 22.12.0 / TypeScript 5.9.3 / ESLint 9.33.0 / RxJS 7.8.2, sem mudar nenhum comportamento visível da tela nem o contrato com `server/`.

**Architecture:** Chassi novo gerado a partir dos padrões do `ng new` 20.3.17 (builder `@angular/build:application`, esbuild/Vite) com os 7 arquivos-fonte atuais portados sem alteração; depois, só as migrações que o Angular 20 exige ou recomenda com schematic oficial (control flow, `inject()`); lint e testes entram como rede de regressão. Comportamento é fixado antes de mexer: golden da simulação local (`mock-enhancer.ts`) e checklist de tela executados em Angular 15 e repetidos em Angular 20.

**Tech Stack:** Angular 20.3.17, `@angular/build` 20.3.17, Node 22.12.0 (`.nvmrc`), TypeScript 5.9.3, RxJS 7.8.2, zone.js 0.15, ESLint 9.33.0 + angular-eslint 20.7 + typescript-eslint 8, Vitest 3 + jsdom via `@angular/build:unit-test`.

**Spec:** Seção 0 deste documento (diagnóstico de 2026-11-09) e o pedido do dono: "chassi Angular 20.3.17 com Node 22.12.0, TypeScript 5.9.3, ESLint 9.33.0, RxJS 7.8.2; cobrir 100% do projeto preservando integridade e funcionalidade".

---

## 0. Diagnóstico (2026-11-09)

### 0.1 Estado atual de `frontend/`

| Item | Valor | Evidência |
|---|---|---|
| Angular | 15.2.10 (CLI 15.2.11), `@angular-devkit/build-angular:browser` (webpack) | `frontend/package.json`, `frontend/angular.json:16` |
| TypeScript | 4.9.5 (`~4.9.4`) | `frontend/package.json:27` |
| RxJS / zone.js / tslib | 7.8.2 (`~7.8.0`) / 0.12.0 / 2.9.1 | `node_modules/*/package.json` |
| Node na máquina | v26.3.0; nvm tem 18.20.8, 22.23.4, 24.15.0 — **não tem 22.12.0** | `node -v`, `~/.nvm/versions/node` |
| Lint / testes | Nenhum: sem ESLint, sem alvo `test`, nenhum `*.spec.ts` | `frontend/angular.json` só tem `build` e `serve` |
| Controle de versão | Repositório git criado durante o diagnóstico: branch `main`, remoto `origin` = `github.com/freirevini/zprompt`, um único commit `c4b5aa0` com o projeto inteiro | `git log --oneline` |
| Código-fonte | 7 arquivos, 2 512 linhas (`.ts`/`.html`/`.scss`), tudo standalone, `bootstrapApplication` | `frontend/src/**` |
| Build de linha de base | Passa. Inicial 252,86 kB após a remoção de "Testar com" (254,61 kB antes); sem aviso de orçamento | `npx ng build` em Node 22.12.0, 2026-11-09 |
| CSS compilado de `app.component.scss` | **9 456 bytes** comprimidos | `npx sass --style=compressed` |

Dependências declaradas e não usadas: `@angular/animations` e `@angular/platform-browser-dynamic` (nenhum import em `src/`).

Padrões do Angular 15 presentes no código, aceitos pelo Angular 20 mas depreciados ou fora do estilo atual:

- `*ngIf`/`*ngFor` (`NgIf`, `NgFor`): 36 ocorrências em `app.component.html` e 1 em `segmented.component.ts`. Depreciados desde v20.0, remoção prevista para v22 ([v20.angular.dev/api/common/NgSwitch](https://v20.angular.dev/api/common/NgSwitch) marca "Deprecated since v20.0; intent to remove in v22"; o mesmo vale para `NgIf` e `NgForOf`).
- `standalone: true` explícito (padrão desde v19): `app.component.ts:31`, `segmented.component.ts:8`.
- Injeção por construtor em 3 classes (`AppComponent`, `HttpEnhanceApi`, `SegmentedComponent`); angular-eslint 20 recomenda `inject()`.
- `proxy.conf.js` tem `logLevel: 'warn'`, opção do `http-proxy-middleware` do webpack; o dev-server do `@angular/build` (Vite) ignora.

### 0.2 Compatibilidade verificada no registro npm (2026-11-09)

| Pacote | Requisito | Verificado |
|---|---|---|
| `@angular/core@20.3.17` | `node ^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0`; peers `rxjs ^6.5.3 \|\| ^7.4.0`, `zone.js ~0.15.0` | Node 22.12.0 ✔ (piso exato da linha 22), RxJS 7.8.2 ✔ |
| `@angular/compiler-cli@20.3.17` | peer `typescript >=5.8 <6.0` | TypeScript 5.9.3 ✔ |
| `@angular/build@20.3.17` | peers opcionais `vitest ^3.1.1`, `karma ^6.4.0` | Vitest 3 ✔ |
| `eslint@9.33.0` | `node ^18.18.0 \|\| ^20.9.0 \|\| >=21.1.0` | ✔ |
| `angular-eslint@20.7.0` | peers `eslint ^8.57.0 \|\| ^9.0.0`, `typescript-eslint ^8.0.0` | ✔ (typescript-eslint 8.72.1 é a última 8.x) |
| Patch mais recente da linha 20.3 | 20.3.35 | 20.3.17 existe e é o pedido; ver D2 |

Os CLIs intermediários (16 a 19) aceitam Node 22 (`>=18.10.0`, `>=20.9.0`, `>=22.0.0`), então um `ng update` encadeado também seria viável; a recomendação (D1) é outra.

### 0.3 Riscos encontrados e como o plano trata

| # | Risco | Tratamento |
|---|---|---|
| R1 | Orçamento padrão do Angular 20 para `anyComponentStyle` é 4 kB aviso / 8 kB erro; o CSS do `AppComponent` tem 9,4 kB → **build falharia** com o `angular.json` padrão | Manter 14 kB / 24 kB atuais (Etapa 1) |
| R2 | Angular 20 entra em fim de LTS em novembro de 2026 (lançado 2025-05-28, 18 meses de suporte) | Registrar em D2; o plano segue o chassi pedido |
| R3 | Node 22.12.0 não está instalado; nvm padrão é 24 | `nvm install 22.12.0` + `.nvmrc` na raiz (Etapa 0) |
| R4 | Histórico com um só commit; uma etapa mal feita no meio da migração não tem ponto de retorno próprio | Tag `angular-15` no commit atual e um commit por tarefa (Etapa 0 em diante) |
| R5 | Builder `@angular/build:unit-test` (Vitest) é experimental em 20.x ([v20.angular.dev/guide/testing/unit-tests](https://v20.angular.dev/guide/testing/unit-tests)); Karma é o padrão do `ng new` 20.3 mas está depreciado | Vitest (D5); se o builder falhar em algo concreto, o fallback é `@angular/build:karma`, sem mudar os specs de lógica |
| R6 | Dev-server Vite responde diferente do webpack quando o proxy não existe (`GET /api/health` cai no fallback do `index.html`) | Mensagem final da tela continua "Servidor local desligado"; teste em 4.2 |
| R7 | Migração de control flow gera `track` por identidade; listas de strings podem repetir (`warnings`, `notices`) | Regras de `track` fixadas em 2.1; teste em 4.4 |
| R8 | `mock-enhancer.ts` (434 linhas de regras) é a maior superfície lógica e não tem teste | Golden gerado em Angular 15 e verificado em Angular 20 (Etapa 0 e 1) |

### 0.4 Decisões para aprovação

| # | Decisão | Recomendação | Por quê |
|---|---|---|---|
| D1 | Estratégia: chassi novo (scaffold 20.3.17 + porte dos 7 arquivos) ou `ng update` encadeado 15→16→17→18→19→20 | **Chassi novo** | 7 arquivos-fonte e histórico git de um commit só: cinco saltos com troca de builder (webpack→esbuild) deixam resíduo de configuração e custam mais do que portar. Os schematics de migração (`control-flow`, `inject`) rodam igual no código portado. Alternativa fica documentada em 0.2 |
| D2 | Versões: `20.3.17` exato como pedido, sabendo que existe 20.3.35 e que a linha 20 sai de LTS em nov/2026 | **20.3.17 exato**, pinado sem `^` | É o chassi definido. Patch e salto para 21/22 ficam para plano próprio |
| D3 | Node: `.nvmrc` com `22.12.0` na raiz e `engines.node` `^22.12.0` em `frontend/package.json`; servidor continua `>=18.10` | **Sim** | Um Node para o repositório; o servidor já roda em 22 |
| D4 | zone.js mantido, `main.ts` sem alteração (nenhum `provideZoneChangeDetection` explícito); sem zoneless, sem signals, sem `provideBrowserGlobalErrorListeners` | **Manter zone.js, nada de signals** | Fidelidade: a tela usa `setTimeout` e mutação direta de campos; zoneless ou signal inputs mudam o modelo de detecção e são outra migração |
| D5 | Testes da tela: Vitest + jsdom via `@angular/build:unit-test` (experimental em 20.x, padrão em 21) ou Karma + Jasmine (padrão do `ng new` 20.3, depreciado) | **Vitest** | Sem navegador no `npm test`, mesmo runner para lógica pura e componentes, caminho oficial a partir de 21. Fallback Karma registrado em R5 |
| D6 | Nomes de arquivo e classes: manter `app.component.ts`/`AppComponent` (estilo v15) ou renomear para `app.ts`/`App` (guia de estilo v20) | **Manter** | Renomear não muda comportamento e multiplica o diff; o guia v20 só vale para código novo |
| D7 | Control flow: migrar `*ngIf`/`*ngFor` para `@if`/`@for` agora | **Sim** | Depreciado em v20, removido em v22; schematic oficial; revisão manual dos `track` |
| D8 | `inject()`: rodar `ng generate @angular/core:inject` | **Sim** | Mecânico, 3 classes, atende `@angular-eslint/prefer-inject` |
| D9 | Remover `@angular/animations` e `@angular/platform-browser-dynamic` | **Sim** | Não importados |
| D10 | Fora do escopo deste plano: signals, zoneless, Prettier, router, favicon/`public/`, salto para Angular 21/22 | **Registrar em `.rules/decisoes.md`** | Evita escopo crescer na execução |

## Global Constraints

- Versões exatas: `@angular/*` `20.3.17`, `typescript` `5.9.3`, `rxjs` `7.8.2`, `eslint` `9.33.0`. Node `22.12.0` via `.nvmrc`.
- Nenhuma mudança de comportamento visível: textos, estados, atalhos, chamadas HTTP (`POST /api/enhance`, `GET /api/health`, cabeçalho `x-zprompt: 1`) e contrato de `models.ts` ficam idênticos.
- Regras de `AGENTS.md`: credenciais só no backend; nada de persistência de rascunho ou resposta; model id só via `GEMINI_MODEL`.
- Orçamentos de build: `initial` 500 kB / 1 MB; `anyComponentStyle` 14 kB / 24 kB.
- `strictTemplates`, `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictInjectionParameters`, `strictInputAccessModifiers` continuam ligados.
- Toda etapa termina com `npx ng build` verde e commit.
- Nenhuma regra de lint desligada globalmente; exceção por linha só com comentário e registro em `.rules/decisoes.md`.

## Review Focus

Cenários que o pedido implica e que a execução cobre com teste na tarefa dona:

1. Rascunho acima de 8 000 caracteres: botão desabilitado, contador em vermelho, `Cmd+Enter` não envia — Tarefa 4.4.
2. `ng serve` sem proxy ou servidor desligado: `/api/enhance` com 404 sem JSON, status 0 ou 5xx vira `SERVER_OFFLINE` com as duas mensagens atuais; `/api/health` com HTML ou erro vira `null` e "Servidor local desligado" — Tarefa 4.2.
3. Clipboard indisponível: fallback `execCommand('copy')`; se também falhar, "Não foi possível copiar" — Tarefa 4.4.
4. Listas de strings repetidas (`warnings`, `notices`, `errorIssues`) renderizam todos os itens sem erro NG0955 após o `@for` — Tarefa 4.4.
5. `skills.needsPath: true` abre o formulário da pasta dentro do bloco de skills; "Seguir sem skills" remove o bloco e mantém o prompt — Tarefa 4.4.

---

## Etapa 0 — Linha de base em Angular 15 (nada do chassi muda aqui)

### Tarefa 0.1: Controle de versão e Node 22.12.0

**Files:**
- Create: `.nvmrc` (raiz)
- Modify: `frontend/package.json` (`engines`)

- [ ] **Step 1: Commitar este plano e marcar o ponto de retorno**

```bash
cd /Users/freire/Documents/Projetos/Zprompt && git add docs/06-plano-migracao-angular-20.md && git commit -m "docs: plano de migração do frontend para Angular 20.3.17" && git tag angular-15 && git status --short
```
Esperado: árvore limpa; `git tag` lista `angular-15` apontando para o estado Angular 15 completo. O `.gitignore` já exclui `node_modules/`, `dist/`, `.angular/`, `.env`.

- [ ] **Step 2: Instalar e fixar Node 22.12.0**

```bash
nvm install 22.12.0 && printf '22.12.0\n' > .nvmrc && nvm use && node -v
```
Esperado: `v22.12.0`.

- [ ] **Step 3: Declarar `engines` em `frontend/package.json`**

Adicionar `"engines": { "node": "^22.12.0" }` depois de `"private": true`.

- [ ] **Step 4: Provar que o projeto inteiro roda em Node 22.12.0 antes de mexer**

```bash
cd server && npm test && cd ../frontend && npx ng build
```
Esperado: servidor 42 testes passando; build com os tamanhos de 0.1 (inicial 252,86 kB) e sem erro. O CLI 15 pode avisar sobre a versão do Node; aviso não bloqueia.

- [ ] **Step 5: Commit**

```bash
git add .nvmrc frontend/package.json && git commit -m "chore: fixar Node 22.12.0 com .nvmrc e engines"
```

### Tarefa 0.2: Golden da simulação local (`buildMockResponse`)

**Files:**
- Create: `frontend/src/app/core/testing/mock-cases.ts`
- Create: `frontend/src/app/core/testing/mock-golden.ts` (gerado)
- Create: `frontend/src/app/core/mock-enhancer.spec.ts`
- Create: `frontend/tools/gen-golden.spec.ts`
- Modify: `frontend/package.json` (devDependency `vitest`)

**Interfaces:**
- Produces: `MOCK_CASES: ReadonlyArray<{ name: string; input: MockRequest }>` (48 casos) e `MOCK_GOLDEN: Record<string, EnhanceResponse>`; usados sem alteração pelas Tarefas 1.2 e 4.1.

- [ ] **Step 1: Instalar Vitest no pacote Angular 15**

```bash
cd frontend && npm i -D "vitest@^3.1.1"
```

- [ ] **Step 2: Escrever `mock-cases.ts`**

Exportar `MOCK_CASES` com, para cada um dos 7 rascunhos que a tela oferecia em "Testar com" (removida em 2026-11-09; lista inline `DRAFTS` no próprio arquivo, igual a `agent/examples/casos.json`) × `ide` ∈ {`cursor`, `antigravity`} × `autonomy` ∈ {`perguntar`, `decidir`, `diagnosticar`}, `function: 'auto'`, `scope: 'minimo'`, `preserveBehavior: true`, `skills: []` (42 casos, nome `${label}|${ide}|${autonomy}`), mais 6 extras:
- `skills|cursor`: "Erro vago", cursor, perguntar, `skills: [{ name: 'security-review', description: 'Revisão de segurança', reason: 'o rascunho fala de login' }, { name: 'tdd-workflow', description: 'TDD', reason: 'pede correção' }]`
- `ambicioso|antigravity`: "Projeto novo", antigravity, perguntar, `scope: 'ambicioso'`
- `sem-preservar|cursor`: "Erro com mensagem", cursor, decidir, `preserveBehavior: false`
- `keep-docs|cursor`: draft `'atualiza a dependência do build e roda os testes'`, cursor, perguntar, `function: 'keep-codebase-knowledge'`
- `keep-docs-diagnostico|antigravity`: mesmo draft, antigravity, diagnosticar, `function: 'keep-codebase-knowledge'`
- `test-forcado|cursor`: "Já específico", cursor, perguntar, `function: 'test'`

- [ ] **Step 3: Escrever o gerador `tools/gen-golden.spec.ts`**

Um `it` que monta `Object.fromEntries(MOCK_CASES.map((c) => [c.name, buildMockResponse(c.input)]))` e grava `src/app/core/testing/mock-golden.ts` com `writeFileSync(new URL('../src/app/core/testing/mock-golden.ts', import.meta.url), ...)`. Cabeçalho do arquivo gerado: `// Gerado por: npx vitest run tools/gen-golden.spec.ts — não editar à mão.` e `export const MOCK_GOLDEN: Record<string, EnhanceResponse> = <JSON com 2 espaços>;` importando `EnhanceResponse` de `'../models'`.

- [ ] **Step 4: Gerar o golden**

```bash
npx vitest run tools/gen-golden.spec.ts && wc -l src/app/core/testing/mock-golden.ts
```
Esperado: 1 teste passando; arquivo gerado com 48 chaves.

- [ ] **Step 5: Escrever `mock-enhancer.spec.ts`**

Imports explícitos de `vitest` (`describe`, `it`, `expect`). Testes:
- `golden cobre todos os casos`: `Object.keys(MOCK_GOLDEN).sort()` igual a `MOCK_CASES.map((c) => c.name).sort()`.
- `cada caso reproduz o golden`: `for` sobre `MOCK_CASES`, `expect(buildMockResponse(c.input)).toEqual(MOCK_GOLDEN[c.name])`.
- Asserções explícitas, independentes do golden: `Sem tarefa|cursor|perguntar` → `status === 'INSUFFICIENT'`; `Já específico|cursor|perguntar` → `status === 'UNCHANGED'`; `Projeto novo|antigravity|perguntar` → `prompt.startsWith('/plan /grill-me ')`, `recommendedMode === 'plan'`, `routedToPlanning === true`; `Erro com mensagem|cursor|perguntar` → `preservedLiterals` contém `"TypeError: Cannot read properties of undefined (reading 'map')"` e `OrdersTable.tsx`, `detectedFunction === 'fix'`; `Pergunta|cursor|perguntar` → `recommendedMode === 'ask'`, `modeInstruction === 'Envie no modo Ask.'`; `Revisão|cursor|diagnosticar` → `prompt` contém `'Alvo da revisão: @Branch (Diff with Main).'` e `'11. Prompt de implementação'`; `keep-docs|cursor` → `prompt` contém `` `docs/codebase/STACK.md` `` e `` `docs/codebase/TESTING.md` ``; `skills|cursor` → `prompt` contém `` Use as skills `security-review` e `tdd-workflow` nesta tarefa. ``.

- [ ] **Step 6: Rodar e confirmar**

```bash
npx vitest run src/app/core/mock-enhancer.spec.ts
```
Esperado: 10 testes passando.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/tools frontend/src/app/core/testing frontend/src/app/core/mock-enhancer.spec.ts && git commit -m "test: golden da simulação local em Angular 15"
```

### Tarefa 0.3: Checklist de tela em Angular 15 (registro da linha de base)

**Files:**
- Modify: este documento, seção "Resultados do checklist" (anexo A), coluna "Angular 15"

- [ ] **Step 1: Subir servidor sem `.env` e a tela**

Terminal 1: `cd server && npm start`. Terminal 2: `cd frontend && npm start`. Abrir `http://localhost:4200`.

- [ ] **Step 2: Executar S1 a S14 do anexo A e anotar "ok" ou o desvio na coluna Angular 15**

Esperado: 14 "ok". Um desvio aqui é bug pré-existente: anotar e **não corrigir** neste plano.

- [ ] **Step 3: Commit do registro**

```bash
git add docs/06-plano-migracao-angular-20.md && git commit -m "docs: checklist de tela na linha de base Angular 15"
```

---

## Etapa 1 — Chassi Angular 20.3.17 com o código portado sem alteração

### Tarefa 1.1: Substituir os arquivos de configuração

**Files:**
- Modify: `frontend/package.json`, `frontend/angular.json`, `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/proxy.conf.js`
- Create: `frontend/tsconfig.spec.json`
- Delete: `frontend/package-lock.json`, `frontend/node_modules/`, `frontend/.angular/`, `frontend/dist/`

- [ ] **Step 1: Reescrever `frontend/package.json`**

```json
{
  "name": "zprompt-web",
  "version": "0.2.0",
  "private": true,
  "engines": { "node": "^22.12.0" },
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test --no-watch",
    "lint": "ng lint"
  },
  "dependencies": {
    "@angular/common": "20.3.17",
    "@angular/compiler": "20.3.17",
    "@angular/core": "20.3.17",
    "@angular/forms": "20.3.17",
    "@angular/platform-browser": "20.3.17",
    "rxjs": "7.8.2",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular/build": "20.3.17",
    "@angular/cli": "20.3.17",
    "@angular/compiler-cli": "20.3.17",
    "@eslint/js": "9.33.0",
    "angular-eslint": "20.7.0",
    "eslint": "9.33.0",
    "jsdom": "^26.1.0",
    "typescript": "5.9.3",
    "typescript-eslint": "^8.72.1",
    "vitest": "^3.1.1"
  }
}
```

- [ ] **Step 2: Reescrever `frontend/angular.json`**

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "cli": { "analytics": false },
  "projects": {
    "zprompt-web": {
      "projectType": "application",
      "schematics": { "@schematics/angular:component": { "style": "scss" } },
      "root": "",
      "sourceRoot": "src",
      "prefix": "zp",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "outputPath": "dist/zprompt-web",
            "browser": "src/main.ts",
            "index": "src/index.html",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "inlineStyleLanguage": "scss",
            "assets": [],
            "styles": ["src/styles.scss"]
          },
          "configurations": {
            "production": {
              "budgets": [
                { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
                { "type": "anyComponentStyle", "maximumWarning": "14kB", "maximumError": "24kB" }
              ],
              "outputHashing": "all"
            },
            "development": { "optimization": false, "extractLicenses": false, "sourceMap": true }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "options": { "proxyConfig": "proxy.conf.js" },
          "configurations": {
            "production": { "buildTarget": "zprompt-web:build:production" },
            "development": { "buildTarget": "zprompt-web:build:development" }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "tsConfig": "tsconfig.spec.json",
            "runner": "vitest",
            "buildTarget": "::development",
            "include": ["src/**/*.spec.ts"]
          }
        },
        "lint": {
          "builder": "@angular-eslint/builder:lint",
          "options": { "lintFilePatterns": ["src/**/*.ts", "src/**/*.html"] }
        }
      }
    }
  }
}
```

- [ ] **Step 3: Reescrever `frontend/tsconfig.json`**

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "preserve"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "typeCheckHostBindings": true,
    "strictTemplates": true
  },
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.spec.json" }]
}
```
Saem, por serem padrão ou obsoletos no Angular 20: `baseUrl`, `outDir`, `forceConsistentCasingInFileNames`, `sourceMap`, `declaration`, `downlevelIteration`, `moduleResolution: node`, `useDefineForClassFields: false`, `lib`.

- [ ] **Step 4: Reescrever `frontend/tsconfig.app.json` e criar `frontend/tsconfig.spec.json`**

`tsconfig.app.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "outDir": "./out-tsc/app", "types": [] },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts", "src/**/testing/*.ts"]
}
```
`tsconfig.spec.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "outDir": "./out-tsc/spec", "types": [] },
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts", "src/**/testing/*.ts"]
}
```

- [ ] **Step 5: Ajustar `frontend/proxy.conf.js`**

Remover a linha `logLevel: 'warn',`. Manter `target`, `secure: false`, `changeOrigin: true` (o servidor exige `Host` local; `changeOrigin` garante `127.0.0.1:<porta>`).

- [ ] **Step 6: Instalar do zero**

```bash
cd frontend && rm -rf node_modules package-lock.json .angular dist && npm install && npx ng version
```
Esperado: `Angular CLI: 20.3.17`, `Angular: 20.3.17`, `TypeScript 5.9.3`, `rxjs 7.8.2`, `zone.js 0.15.x`, Node `22.12.0`; `npm ls eslint` mostra `9.33.0`.

### Tarefa 1.2: Compilar o código de Angular 15 no chassi 20 sem tocar nele

- [ ] **Step 1: Build de produção**

```bash
npx ng build
```
Esperado: sucesso, saída em `dist/zprompt-web/browser/`, sem erro de orçamento. Anotar tamanhos no anexo A (S12). Executado em 2026-11-09: 280,17 kB inicial (main 243,98 kB, polyfills 34,59 kB, styles 1,61 kB), sem aviso. Correção na execução: `include` com `**` no fim dá TS5010; glob trocado para `src/**/testing/*.ts`. `NgIf`/`NgFor` ainda compilam; avisos de depreciação são aceitos até a Tarefa 2.1.

- [ ] **Step 2: Golden no runner do Angular**

```bash
npm test
```
Esperado: exatamente 10 testes passando (`mock-enhancer.spec.ts`) no builder `unit-test` (Vitest). Se aparecer um 11º teste, o `include` de `angular.json` não está restringindo a `src/` e o gerador `tools/gen-golden.spec.ts` reescreveu o golden: corrigir o `include` e `git checkout src/app/core/testing/mock-golden.ts`. Se o builder falhar por motivo próprio (não por teste), aplicar o fallback R5: `"builder": "@angular/build:karma"` com `jasmine-core`, `karma`, `karma-chrome-launcher`, `karma-jasmine`, `@types/jasmine` e registrar em `.rules/decisoes.md`.

- [ ] **Step 3: Tela e proxy**

Servidor ligado, `npm start`; abrir `http://localhost:4200`: topbar "Demonstração: Vertex não configurado" (prova que `/api/health` passou pelo proxy) e S3 do anexo A ok.

- [ ] **Step 4: Commit**

```bash
git add -A frontend && git commit -m "build: chassi Angular 20.3.17, TypeScript 5.9.3, Node 22.12.0, ESLint 9.33.0"
```

---

## Etapa 2 — Migrações exigidas pelo Angular 20

### Tarefa 2.1: Control flow nativo

**Files:**
- Modify: `frontend/src/app/app.component.html`, `frontend/src/app/app.component.ts:1,32`, `frontend/src/app/ui/segmented.component.ts:1,9,13`

- [ ] **Step 1: Rodar o schematic**

```bash
npx ng generate @angular/core:control-flow --path src/app
```
Esperado: `*ngIf` → `@if`, `*ngFor` → `@for`, `*ngIf="...; else skillList"` → `@if … @else` com o `<ng-template #skillList>` inlinado; `*ngIf="state === 'done' && result as res"` → `@if (state === 'done' && result; as res)`; `NgIf` e `NgFor` saem dos `imports`. `ngTemplateOutlet` de `#pathForm` e `NgClass` permanecem.

- [ ] **Step 2: Fixar os `track`**

Revisar cada `@for` e deixar exatamente:
- `options` (segmented) → `track option.value`
- `s.selected` (skills) → `track skill.path`
- `errorIssues`, `res.warnings`, `res.notices`, `res.enhancement.preservedLiterals`, `readRoots` → `track $index` (listas de strings, trocadas inteiras a cada resultado; podem repetir)

- [ ] **Step 3: Remover `standalone: true`** em `app.component.ts` e `segmented.component.ts` (padrão desde v19).

- [ ] **Step 4: Verificar**

```bash
npx ng build && npm test && grep -c "ngIf\|ngFor" src/app/app.component.html src/app/ui/segmented.component.ts
```
Esperado: build ok, golden ok, `0` ocorrências. Repetir S3 a S11 do anexo A no navegador; console sem NG0955.

Executado em 2026-11-09. O schematic quebrou linha dentro de 5 trechos de texto inline (contador de caracteres, "detectada", dica de skills, rodapé de skills), o que mudava espaços na tela ("caracteres . Encurte", "existente ."). Corrigido colando o conteúdo nas chaves do bloco (`@if (x) {texto}`). Verificação usada: o mesmo roteiro de 23 estados (20 com servidor, 3 com servidor desligado) rodado no Angular 15 (worktree da tag `angular-15`) e no 20, com hash de `innerText`, estrutura de elementos e atributos ARIA de `zp-root`: 23/23 iguais, depois desta tarefa e depois da 2.2. Build 275,20 kB.

- [ ] **Step 5: Commit**

```bash
git add frontend/src && git commit -m "refactor: control flow nativo no lugar de NgIf/NgFor"
```

### Tarefa 2.2: `inject()` no lugar da injeção por construtor

**Files:**
- Modify: `frontend/src/app/app.component.ts:80`, `frontend/src/app/core/enhance-api.ts:38-40`, `frontend/src/app/ui/segmented.component.ts:64`

- [ ] **Step 1: Rodar o schematic**

```bash
npx ng generate @angular/core:inject --path src/app
```
Esperado: `private readonly api = inject(EnhanceApi);`, `private readonly http = inject(HttpClient);` (construtor de `HttpEnhanceApi` some; a chamada `super()` deixa de existir), `private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);`. Nenhuma outra linha muda.

- [ ] **Step 2: Verificar e commitar**

```bash
npx ng build && npm test && git add frontend/src && git commit -m "refactor: inject() nas três classes com dependências"
```

---

## Etapa 3 — ESLint 9.33.0

### Tarefa 3.1: Configuração flat e lint limpo

**Files:**
- Create: `frontend/eslint.config.js`

- [ ] **Step 1: Escrever `eslint.config.js`**

```js
// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  { ignores: ['dist/', '.angular/'] },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'zp', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'zp', style: 'kebab-case' }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
]);
```

- [ ] **Step 2: Rodar e corrigir**

```bash
npm run lint
```
Correções previstas pela leitura do código (confirmar na saída):
- `mock-enhancer.ts:20` `@typescript-eslint/array-type`: `ReadonlyArray<[WorkFunction, RegExp]>` → `readonly [WorkFunction, RegExp][]`.
- `@angular-eslint/prefer-inject`: já atendido pela Tarefa 2.2.
Qualquer outro apontamento: corrigir quando a correção não altera DOM nem comportamento; senão, `// eslint-disable-next-line <regra> -- <motivo>` na linha e registro em `.rules/decisoes.md`. Nenhum `rules: { ...: 'off' }` global.

- [ ] **Step 3: Verificar e commitar**

```bash
npm run lint && npx ng build && npm test && git add frontend/eslint.config.js frontend/src && git commit -m "chore: ESLint 9.33.0 com angular-eslint 20 em flat config"
```

---

## Etapa 4 — Testes da tela

Padrão dos specs: ao lado do arquivo testado, imports explícitos de `vitest` (`describe`, `it`, `expect`, `vi`, `beforeEach`), `TestBed` de `@angular/core/testing`. Nenhum `any`.

### Tarefa 4.1: Confirmar o golden no runner final

- [ ] **Step 1:** `npm test` → `mock-enhancer.spec.ts` 10/10 após Etapas 2 e 3 (prova que `array-type` e `inject` não mudaram a simulação). Sem commit próprio.

### Tarefa 4.2: `enhance-api.spec.ts`

**Files:**
- Create: `frontend/src/app/core/enhance-api.spec.ts`

Setup: `TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), HttpEnhanceApi] })`; `HttpTestingController`; `request` mínimo válido de `EnhanceRequest`.

- [ ] **Step 1: Escrever os testes**

- `envia POST /api/enhance com Content-Type application/json e x-zprompt 1 e devolve o corpo`: `req.request.headers.get('x-zprompt') === '1'`; `flush(result)` → emite `result`.
- `503 VERTEX_NOT_CONFIGURED vira demonstração com as skills do servidor`: `flush({ error: 'Vertex não configurado.', code: 'VERTEX_NOT_CONFIGURED', skills: report, notices: ['n1'] }, { status: 503, statusText: 'Service Unavailable' })` → `meta.source === 'demo'`, `skills === report`, `notices` igual `['n1']`, `demoReason === 'Vertex não configurado.'`, `enhancement.status` definido.
- `404 sem JSON vira SERVER_OFFLINE com a mensagem do proxy`: `flush('Cannot POST /api/enhance', { status: 404, statusText: 'Not Found' })` → erro `instanceof EnhanceFailure`, `code === 'SERVER_OFFLINE'`, `message === 'A tela não está ligada ao servidor local. Reinicie o ng serve na pasta frontend para carregar o proxy.'`.
- `status 0 vira SERVER_OFFLINE com a mensagem do servidor desligado`: `error(new ProgressEvent('error'), { status: 0 })` → `message === 'O servidor local não respondeu. Inicie com npm start na pasta server.'`.
- `502 LINT_FAILED repassa código, mensagem e issues`: `flush({ error: 'Falhou.', code: 'LINT_FAILED', issues: ['a', 'b'] }, { status: 502, statusText: 'Bad Gateway' })` → `code === 'LINT_FAILED'`, `message === 'Falhou.'`, `issues` igual `['a', 'b']`.
- `health devolve o objeto em 200 e null em erro de rede ou corpo não JSON`: três chamadas; `flush(health)` → `health`; `error(new ProgressEvent('error'), { status: 0 })` → `null`; `flush('<!doctype html>', { status: 200, statusText: 'OK' })` → `null`.

- [ ] **Step 2: Rodar, confirmar 6 passando, commitar**

```bash
npm test && git add frontend/src/app/core/enhance-api.spec.ts && git commit -m "test: HttpEnhanceApi com HttpTestingController"
```

### Tarefa 4.3: `segmented.component.spec.ts`

**Files:**
- Create: `frontend/src/app/ui/segmented.component.spec.ts`

Setup: `TestBed.createComponent(SegmentedComponent)`, `options = IDE_OPTIONS`, `value = 'cursor'`, `labelledBy = 'l'`, `detectChanges()`.

- [ ] **Step 1: Escrever os testes**

- `renderiza um botão por opção com role radio, aria-checked e tabindex só no selecionado`: 2 botões; `aria-checked` `"true"`/`"false"`; `tabindex` `"0"`/`"-1"`; o `div.seg` tem `aria-labelledby="l"` e não tem `aria-describedby`.
- `clique emite valueChange e marca a opção`: `vi.fn()` em `valueChange.subscribe`; clicar em "Antigravity" → emitido `'antigravity'`, `component.value === 'antigravity'`.
- `setas percorrem em círculo e focam o botão`: `ArrowRight` no índice 1 → emite `'cursor'` e `document.activeElement` é o botão 0; `ArrowLeft` no índice 0 → emite `'antigravity'`; `ArrowDown`/`ArrowUp` equivalem.
- `tecla que não é seta não emite nem cancela o evento`: `Tab` → `valueChange` não chamado, `event.defaultPrevented === false`.

- [ ] **Step 2: Rodar, confirmar 4 passando, commitar**

```bash
npm test && git add frontend/src/app/ui/segmented.component.spec.ts && git commit -m "test: SegmentedComponent"
```

Executado em 2026-11-09. `health` com corpo HTML e status 200 não é reproduzível no `HttpTestingController` (ele não faz parse de JSON); trocado pelo caso real do proxy Vite, status 500, nos testes de `enhance` e `health`.

### Tarefa 4.4: `app.component.spec.ts`

**Files:**
- Create: `frontend/src/app/app.component.spec.ts`

Setup: fábrica `enhanced(overrides?)` devolvendo um `EnhanceResult` com `status: 'ENHANCED'`, `meta.source: 'vertex'`, `skills: null`, `warnings: []`, `notices: []`; `fakeApi = { enhance: vi.fn(() => of(enhanced())), health: vi.fn(() => of(null)) }` satisfazendo `EnhanceApi`; `TestBed.configureTestingModule({ imports: [AppComponent], providers: [{ provide: EnhanceApi, useValue: fakeApi }] })`. jsdom não tem `navigator.clipboard` nem `document.execCommand`: definir com `Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true })` e `document.execCommand = vi.fn(() => true)` no `beforeEach`. `vi.useFakeTimers()` nos testes com `setTimeout`.

- [ ] **Step 1: Escrever os testes**

- `inicia em idle, consulta health e mostra "Servidor local desligado" quando health é null`: `fakeApi.health` chamado 1×; `topbarNote === 'Servidor local desligado'`; `.empty__lead` presente.
- `topbar reflete o estado do Vertex`: health `{ vertex: { configured: true, model: 'gemini-x' } }` → `'gemini-x no Vertex AI'`; `configured: false` → `'Demonstração: Vertex não configurado'`.
- `canSubmit e contador respeitam 8000 caracteres`: draft `''` → `false`; `'a'.repeat(7001)` → `showCounter true`, `canSubmit true`; `'a'.repeat(8001)` → `draftTooLong true`, `canSubmit false`, botão `.btn--primary[disabled]`, `.draft--over` presente; `onDraftKeydown` com `Cmd+Enter` nesse estado não chama `enhance` do fake.
- `Cmd+Enter envia e Enter simples não`: draft válido; `KeyboardEvent('keydown', { key: 'Enter', metaKey: true })` → `fakeApi.enhance` 1×; `{ key: 'Enter' }` → continua 1×.
- `envia skillPaths só com useSkills e pasta manual`: `useSkills = true`, `manualPath = '~/.cursor'` → `enhance` recebido com `skillPaths: ['~/.cursor']`, `useSkills: true`; `useSkills = false` → `skillPaths: []`.
- `resultado ENHANCED preenche o editor e permite desfazer edição`: `state === 'done'`, `editedPrompt === prompt`, `isEdited false`; `onPromptEdit('x')` → `isEdited true`, botão "Desfazer edições" renderizado; `restorePrompt()` → `isEdited false`.
- `SERVER_OFFLINE mostra o erro, oferece a demonstração e runDemo marca a origem demo`: `enhance` → `throwError(() => new EnhanceFailure('m', 'SERVER_OFFLINE'))` → `state 'error'`, `errorTitle === 'O prompt não foi aprimorado.'`, botão "Ver demonstração sem servidor" presente, `health` chamado de novo (2× no total); `runDemo()` → `isDemo true`, `result.demoReason === 'O servidor local está desligado.'`, `state 'done'`.
- `LINT_FAILED mostra título próprio e issues`: `new EnhanceFailure('m', 'LINT_FAILED', ['i1', 'i2'])` → `errorTitle === 'O prompt gerado não passou na validação.'`, `errorMessage === 'm'`, 2 `li` em `.notice--error .issues`.
- `trocar de IDE limpa pasta manual e formulário; repetir o IDE não limpa`: `manualPath = 'p'`, `pathFormOpen = true`, `onIde('antigravity')` → ambos zerados, `pathDraft === ''`; `manualPath = 'p'`, `onIde('antigravity')` → permanece `'p'`.
- `needsPath abre o formulário no bloco de skills e "Seguir sem skills" remove o bloco`: resultado com `skills: { ...report, needsPath: true, problem: 'não achei' }` → `pathFormPlacement === 'skills'`, `.path-form` dentro de `.details`, texto "Não encontrei as skills."; `continueWithoutSkills()` → `result.skills === null`, `useSkills false`, `showSkills false`, `editedPrompt` inalterado.
- `warnings e notices repetidos renderizam todos os itens`: `warnings: ['w', 'w']`, `notices: ['n', 'n']` → 2 `li` em `.checks .issues` e 2 em `.notes`; nenhum erro lançado em `detectChanges()`.
- `copiar usa a clipboard, mostra "Copiado" por 2 s e cai no fallback quando falha`: `navigator.clipboard.writeText` → `vi.fn().mockResolvedValue(undefined)`; `await copyPrompt()` → `copiedKey === 'prompt'`, botão com texto "Copiado"; `vi.advanceTimersByTime(2000)` → `null`. Depois `mockRejectedValue` e `document.execCommand = vi.fn(() => false)` → `copyFailedKey === 'prompt'`, `.copy-fail` presente.
- `liveMessage por estado`: `UNCHANGED` → `'O rascunho já está pronto para enviar.'`; `INSUFFICIENT` → `'O rascunho não descreve uma tarefa.'`; demo → `'Prompt de demonstração pronto.'`; enhanced vertex → `'Prompt aprimorado pronto para copiar.'`; loading → `loadingText`.

Executado em 2026-11-09. Achado do builder experimental (R5): com `segmented.component.spec.ts` importando valores de `options.ts`, o bundle de teste compartilha o chunk de `options.ts` entre os specs e `FUNCTION_LABEL` chega indefinido em `app.component.spec.ts` (5 falhas só na suíte completa; cada spec sozinho passa). Contorno: o spec do `SegmentedComponent` usa opções locais. Suíte completa 33/33 em 3 execuções seguidas. Se o problema voltar com novos specs, o fallback é o builder `@angular/build:karma`.

- [ ] **Step 2: Rodar, confirmar 13 passando, commitar**

```bash
npm test && git add frontend/src/app/app.component.spec.ts && git commit -m "test: AppComponent com EnhanceApi falso"
```

---

## Etapa 5 — Verificação final, documentação e decisão

### Tarefa 5.1: Checklist de tela em Angular 20

- [ ] **Step 1:** Repetir S1 a S14 do anexo A com servidor ligado e depois desligado (S11); preencher a coluna "Angular 20". Esperado: idêntico à coluna Angular 15.
- [ ] **Step 2:** Verificação completa:

```bash
cd frontend && npm run lint && npm test && npx ng build && cd ../server && npm test
```
Esperado: lint sem apontamentos, 33 testes da tela, build sem aviso de orçamento, 42 testes do servidor.

### Tarefa 5.2: Documentação e registro da decisão

**Files:**
- Modify: `AGENTS.md:10` ("Angular 15" → "Angular 20.3, Node 22.12 via `.nvmrc`"); seção Comandos: acrescentar `cd frontend && npm test` e `cd frontend && npm run lint`; seção Regras: acrescentar "Mudou `frontend/src/`: rodar `npm test` e `npm run lint`."
- Modify: `frontend/README.md:1` (título "Angular 20"), `:19` (Node 22.12.0 por `.nvmrc`, `nvm use`), tabela Estrutura (specs, `testing/`, `tools/gen-golden.spec.ts` e quando regenerar o golden), saída em `dist/zprompt-web/browser/`.
- Modify: `.rules/decisoes.md`: nova entrada `## <data> — Chassi Angular 20.3.17` com D1 a D10 aprovadas, o que mudou de fato (control flow, `inject()`, deps removidas, proxy), fallback R5 se usado e exceções de lint, se houver. Marca a entrada "2026-11-05 — Frontend" como superada.
- Modify: `docs/codebase/STACK.md:10-13,20-22,31,34,40-46,52,58`; `docs/codebase/CONCERNS.md:13,21-23,53-56`; `docs/codebase/TESTING.md:5,12-13,37,50,56`; `docs/codebase/STRUCTURE.md:10` — trocar os fatos de Angular 15/TypeScript 4.9/sem lint/sem testes pelos novos valores, mantendo o formato de cada tabela.

- [ ] **Step 1: Aplicar as edições acima**
- [ ] **Step 2: Limpar artefatos antigos**: `rm -rf frontend/.angular` já feito em 1.1; confirmar que `frontend/tools/` e `src/**/testing/` estão fora de `tsconfig.app.json` (build não os compila).
- [ ] **Step 3: Commit final**

```bash
git add -A && git commit -m "docs: chassi Angular 20.3.17 registrado em AGENTS, README, decisões e docs/codebase"
```

---

## Anexo A — Checklist de tela (executar em Angular 15 e em Angular 20)

Pré-condição: `cd server && npm start` sem `.env` (Vertex desligado); `cd frontend && npm start`; `http://localhost:4200`; console do navegador aberto.

| # | Ação | Esperado | Angular 15 | Angular 20 |
|---|---|---|---|---|
| S1 | Abrir a tela | Topbar "Demonstração: Vertex não configurado" | ok | ok |
| S2 | Estado inicial | "O prompt reescrito aparece aqui, pronto para colar no Cursor ou no Antigravity." | ok | ok |
| S3 | Digitar `o login quebra depois de um tempo, arruma` → Aprimorar | Bloco "Demonstração"; Função "Corrigir erro, detectada"; Modo "Agent"; editor com prompt; "Copiar prompt" → "Copiado" por ~2 s | ok | ok |
| S4 | Digitar `oi` → Aprimorar | "Nada para aprimorar ainda." | ok | ok |
| S5 | Colar o rascunho "Já específico" de `mock-cases.ts` → Aprimorar | "Este rascunho já está pronto para enviar." e texto do rascunho | ok | ok |
| S6 | IDE Antigravity, digitar `quero criar um app pra controlar despesas da república` → Aprimorar | prompt começa com `/plan /grill-me`; instrução sobre `/plan /grill-me` visível | ok | ok |
| S7 | Editar o prompt gerado | "Desfazer edições" aparece; clicar restaura o texto | ok | ok |
| S8 | `Cmd+Enter` (ou `Ctrl+Enter`) no rascunho | Envia | ok | ok |
| S9 | Colar 7 001 e depois 8 001 caracteres | Contador aparece; acima de 8 000 fica vermelho, borda vermelha, botão desabilitado | ok | ok |
| S10 | Ligar "Incorporar skills" → "Informar pasta manualmente" → pasta inexistente → Avaliar | Formulário no topo antes do resultado; depois "Não encontrei as skills." no bloco de skills; "Seguir sem skills" remove o bloco; trocar de IDE limpa a pasta | ok | ok |
| S11 | Parar o servidor → Aprimorar | "O servidor local não respondeu. Inicie com npm start na pasta server."; "Ver demonstração sem servidor" → demo com "O servidor local está desligado."; topbar "Servidor local desligado" | ok | ok |
| S12 | `npx ng build` | Sem aviso de orçamento; anotar tamanhos | 252,86 kB inicial | 275,20 kB inicial, sem aviso |
| S13 | Janela < 960 px | Painéis empilham; borda superior no resultado | ok | ok |
| S14 | Console durante S1–S11 | Nenhum erro `NG0…` nem exceção | ok | ok |

Execução Angular 15: 2026-11-09, Node 22.12.0, servidor sem `.env` na porta 4310 e `ng serve` na 4210 (`ZPROMPT_API_PORT=4310`), Chrome. S1–S14 ok; console sem erro nem aviso.

Execução Angular 20: 2026-11-09, mesmo ambiente (Vite na 4210). S1–S14 ok; console sem erro nem aviso. Verificação completa: `npm run lint` sem apontamentos, `npm test` 33/33, `npx ng build` 275,20 kB sem aviso, servidor 42/42.

Desvios pré-existentes (não corrigir neste plano):
- Estado vazio ainda diz "Escolha um exemplo à esquerda ou escreva o seu rascunho." depois da remoção de "Testar com" (`app.component.html`, bloco `.empty`).
- Topbar fica em "Servidor local desligado" se a tela abrir antes do servidor terminar de subir; corrige sozinha no primeiro pedido (`refreshHealth` após cada resultado).

## Fora do escopo (D10)

Signal inputs/outputs e estado em signals; zoneless; `provideBrowserGlobalErrorListeners`; Prettier; `@angular/router`; favicon e pasta `public/`; renomear arquivos para o estilo v20; salto para Angular 21/22; correção de bugs pré-existentes encontrados no anexo A.
