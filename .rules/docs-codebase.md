# Manter `docs/codebase/` atualizado

`docs/codebase/` descreve o código como ele está, no formato da skill `acquire-codebase-knowledge`. A função `keep-codebase-knowledge` manda agentes lerem esses documentos antes de agir; documento velho vira instrução errada.

## Quando

Toda mudança em código, configuração, dependência, comando, estrutura de pastas ou testes atualiza, no mesmo trabalho, a seção afetada. Mudança só de texto em `docs/` fora de `codebase/` não exige.

| Mudou | Atualizar |
|---|---|
| Dependência, versão, runtime, script de `package.json`, variável de ambiente | `STACK.md` |
| Pasta, arquivo de entrada, módulo novo ou removido | `STRUCTURE.md` |
| Fluxo do pedido, responsabilidade de módulo, padrão recorrente | `ARCHITECTURE.md` |
| Nome, formatação, tratamento de erro, log, redação de segredos | `CONVENTIONS.md` |
| Vertex, leitura de disco, proxy, timeout, nova tentativa, credenciais | `INTEGRATIONS.md` |
| Teste novo ou removido, contagem, comando, caso de regressão | `TESTING.md` |
| Risco resolvido ou criado, dívida, segurança, área frágil, tamanho de arquivo citado | `CONCERNS.md` |

## Como

- Editar só a seção afetada; não reescrever o documento.
- Toda afirmação nova com evidência: caminho do arquivo ou saída do terminal. Números (testes, linhas, versões) conferidos no terminal, nunca de memória.
- Sem certeza: `[TODO]`. Depende de decisão do dono: `[ASK USER]`, também listado em `CONCERNS.md`.
- Risco resolvido sai de `CONCERNS.md`; não fica riscado.
- Mudança estrutural grande, como pasta nova de primeiro nível ou troca de framework: rodar a skill `acquire-codebase-knowledge` de novo em vez de remendar.
- O relato final do trabalho cita quais documentos de `docs/codebase/` mudaram, ou diz que nenhum precisou.
