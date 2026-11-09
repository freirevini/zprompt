# Frontend — Angular 20

Tela do zprompt. Envia rascunho e configuração ao servidor local em `server/`, que faz todo o pipeline. O navegador nunca fala com o Vertex.

## Rodar

Dois terminais:

```bash
cd server && npm install && npm start
```

```bash
nvm use && cd frontend && npm install && npm start
```

Abre em `http://localhost:4200`; com a porta ocupada, `npx ng serve --port 56036`. O `ng serve` encaminha `/api` para o servidor pelo `proxy.conf.js`, na porta de `ZPROMPT_API_PORT` do ambiente ou do `.env` da raiz, padrão `4300`.

Angular 20.3.17 com Node 22.12.0, fixado no `.nvmrc` da raiz. O dev-server é o Vite do `@angular/build`; o build de produção sai em `dist/zprompt-web/browser/`.

## Verificar

```bash
npm test        # 33 testes (Vitest pelo builder @angular/build:unit-test, experimental no Angular 20)
npm run lint    # ESLint 9 com angular-eslint
npx ng build    # build de produção com checagem estrita de templates
```

O golden da simulação local (`src/app/core/testing/mock-golden.ts`) trava o comportamento da demonstração. Mudou a simulação de propósito: `npx vitest run tools/gen-golden.spec.ts` regenera o golden. `npx vitest run` sem caminho também roda o gerador; use `npm test`.

## Configuração na tela

- **IDE de destino:** Cursor ou Antigravity.
- **Função:** Detectar, Entender, Iniciar projeto, Implementar, Corrigir erro, Revisar, Testar e `keep-codebase-knowledge`, que manda o agente ler `docs/codebase/` antes da tarefa.
- **Escopo:** Mínimo ou Completo. **Dúvidas:** Perguntar antes, Decidir e seguir ou Só diagnosticar.
- **Preservar comportamento existente** e **Incorporar skills instaladas**, com pasta manual quando a detecção falha.
- Abaixo de Função, Escopo, Dúvidas e Preservar comportamento, uma descrição do que a opção escolhida faz o agente fazer, com o modo do IDE quando ele é fixo. Textos em `src/app/core/options.ts`; acompanham `agent/prompts/system-instruction.md`.

## Resultado

- Prompt editável, com "Copiar prompt" e "Desfazer edições" quando editado.
- Bloco "Skills incorporadas": "Copiar skills" copia todas, e "Copiar" ao lado de cada uma copia só ela, uma linha por skill com nome, motivo e caminho do `SKILL.md`.

## Estados da tela

- **Vertex configurado:** prompt do agente, com avisos de validação quando sobrarem.
- **Vertex não configurado:** resultado de demonstração, gerado por regras fixas no navegador e rotulado como tal, com o passo a passo para ligar o Vertex. As skills vêm do servidor mesmo assim.
- **Servidor desligado:** erro com a opção de ver a demonstração.
- **Skills:** pasta não encontrada ou recusada não bloqueia o resultado; o pedido do caminho aparece no bloco de skills. Trocar de IDE limpa a pasta informada.

`Cmd+Enter` ou `Ctrl+Enter` envia.

## Estrutura

| Caminho | Papel |
|---|---|
| `src/app/core/models.ts` | Tipos que espelham `agent/config/request-schema.json`, `response-schema.json` e as respostas do servidor |
| `src/app/core/enhance-api.ts` | `POST /api/enhance`, `GET /api/health` e a troca para demonstração quando o Vertex não está configurado |
| `src/app/core/options.ts` | Opções dos seletores, rótulos e as descrições exibidas abaixo de cada seleção |
| `src/app/core/mock-enhancer.ts` | Simulação simplificada das regras do agente, só para a demonstração |
| `src/app/ui/segmented.component.ts` | Seletor acessível com setas do teclado |
| `src/app/app.component.*` | Tela única |
| `src/app/**/*.spec.ts` | Testes ao lado de cada arquivo |
| `src/app/core/testing/` | Casos e golden da simulação local |
| `tools/gen-golden.spec.ts` | Gerador do golden |
| `eslint.config.js` | Regras de lint |
