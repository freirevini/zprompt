// Gerado por: npx vitest run tools/gen-golden.spec.ts — não editar à mão.
import { EnhanceResponse } from '../models';

export const MOCK_GOLDEN: Record<string, EnhanceResponse> = {
  "Erro vago|cursor|perguntar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "o login quebra depois de um tempo, arruma",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Localizar o código envolvido",
        "basis": "function_guide"
      },
      {
        "change": "Reproduzir antes de corrigir",
        "basis": "function_guide"
      },
      {
        "change": "Correção mínima na causa",
        "basis": "function_guide"
      },
      {
        "change": "Preservar comportamento existente",
        "basis": "configuration"
      },
      {
        "change": "Regra de parada para problemas relacionados",
        "basis": "function_guide"
      },
      {
        "change": "Teste de regressão e relatório final",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Onde fica o código envolvido",
      "Como reproduzir o problema",
      "Comando de teste do projeto"
    ],
    "prompt": "O login quebra depois de um tempo, arruma.\n\nLocalize no codebase o trecho responsável pelo comportamento descrito. Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar. Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste. Preserve o comportamento existente fora do escopo. Se encontrar problemas relacionados, liste sem corrigir.\n\nAdicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Erro vago|cursor|decidir": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "o login quebra depois de um tempo, arruma",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Localizar o código envolvido",
        "basis": "function_guide"
      },
      {
        "change": "Reproduzir antes de corrigir",
        "basis": "function_guide"
      },
      {
        "change": "Correção mínima na causa",
        "basis": "function_guide"
      },
      {
        "change": "Preservar comportamento existente",
        "basis": "configuration"
      },
      {
        "change": "Regra de parada para problemas relacionados",
        "basis": "function_guide"
      },
      {
        "change": "Teste de regressão e relatório final",
        "basis": "function_guide"
      },
      {
        "change": "Autonomia para decidir detalhes",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [
      "Onde fica o código envolvido",
      "Como reproduzir o problema",
      "Comando de teste do projeto"
    ],
    "prompt": "O login quebra depois de um tempo, arruma.\n\nLocalize no codebase o trecho responsável pelo comportamento descrito. Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar. Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste. Preserve o comportamento existente fora do escopo. Se encontrar problemas relacionados, liste sem corrigir.\n\nAdicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste. Decida sozinho os detalhes técnicos menores e liste as suposições no relatório final.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Erro vago|cursor|diagnosticar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "o login quebra depois de um tempo, arruma",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "Envie no modo Ask, que não edita arquivos.",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "O login quebra depois de um tempo, arruma.\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nDescreva o sintoma exato e como reproduzi-lo, só lendo o código, com o comando a rodar depois. Levante as hipóteses de causa, confirme ou descarte cada uma com evidência e chegue à causa raiz. Use o histórico do git para dizer desde quando o problema existe e procure outros lugares com a mesma falha. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Reprodução e teste de regressão: passos para reproduzir e o teste proposto, que falha antes do ajuste e passa depois.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Cursor, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "ask"
  },
  "Erro vago|antigravity|perguntar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "o login quebra depois de um tempo, arruma",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Localizar o código envolvido",
        "basis": "function_guide"
      },
      {
        "change": "Reproduzir antes de corrigir",
        "basis": "function_guide"
      },
      {
        "change": "Correção mínima na causa",
        "basis": "function_guide"
      },
      {
        "change": "Preservar comportamento existente",
        "basis": "configuration"
      },
      {
        "change": "Regra de parada para problemas relacionados",
        "basis": "function_guide"
      },
      {
        "change": "Teste de regressão e relatório final",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Onde fica o código envolvido",
      "Como reproduzir o problema",
      "Comando de teste do projeto"
    ],
    "prompt": "O login quebra depois de um tempo, arruma.\n\nLocalize no codebase o trecho responsável pelo comportamento descrito. Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar. Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste. Preserve o comportamento existente fora do escopo. Se encontrar problemas relacionados, liste sem corrigir.\n\nAdicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Erro vago|antigravity|decidir": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "o login quebra depois de um tempo, arruma",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Localizar o código envolvido",
        "basis": "function_guide"
      },
      {
        "change": "Reproduzir antes de corrigir",
        "basis": "function_guide"
      },
      {
        "change": "Correção mínima na causa",
        "basis": "function_guide"
      },
      {
        "change": "Preservar comportamento existente",
        "basis": "configuration"
      },
      {
        "change": "Regra de parada para problemas relacionados",
        "basis": "function_guide"
      },
      {
        "change": "Teste de regressão e relatório final",
        "basis": "function_guide"
      },
      {
        "change": "Autonomia para decidir detalhes",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [
      "Onde fica o código envolvido",
      "Como reproduzir o problema",
      "Comando de teste do projeto"
    ],
    "prompt": "O login quebra depois de um tempo, arruma.\n\nLocalize no codebase o trecho responsável pelo comportamento descrito. Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar. Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste. Preserve o comportamento existente fora do escopo. Se encontrar problemas relacionados, liste sem corrigir.\n\nAdicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste. Decida sozinho os detalhes técnicos menores e liste as suposições no relatório final.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Erro vago|antigravity|diagnosticar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "o login quebra depois de um tempo, arruma",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "O login quebra depois de um tempo, arruma.\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nDescreva o sintoma exato e como reproduzi-lo, só lendo o código, com o comando a rodar depois. Levante as hipóteses de causa, confirme ou descarte cada uma com evidência e chegue à causa raiz. Use o histórico do git para dizer desde quando o problema existe e procure outros lugares com a mesma falha. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Reprodução e teste de regressão: passos para reproduzir e o teste proposto, que falha antes do ajuste e passa depois.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Antigravity, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Erro com mensagem|cursor|perguntar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx",
    "preservedLiterals": [
      "TypeError: Cannot read properties of undefined (reading 'map')",
      "OrdersTable.tsx"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Menções aos arquivos que o rascunho citou",
        "basis": "draft"
      },
      {
        "change": "Reproduzir antes de corrigir",
        "basis": "function_guide"
      },
      {
        "change": "Correção mínima na causa",
        "basis": "function_guide"
      },
      {
        "change": "Preservar comportamento existente",
        "basis": "configuration"
      },
      {
        "change": "Regra de parada para problemas relacionados",
        "basis": "function_guide"
      },
      {
        "change": "Teste de regressão e relatório final",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Como reproduzir o problema",
      "Comando de teste do projeto"
    ],
    "prompt": "Corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx.\n\nArquivos citados: @OrdersTable.tsx. Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar. Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste. Preserve o comportamento existente fora do escopo. Se encontrar problemas relacionados, liste sem corrigir.\n\nAdicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Erro com mensagem|cursor|decidir": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx",
    "preservedLiterals": [
      "TypeError: Cannot read properties of undefined (reading 'map')",
      "OrdersTable.tsx"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Menções aos arquivos que o rascunho citou",
        "basis": "draft"
      },
      {
        "change": "Reproduzir antes de corrigir",
        "basis": "function_guide"
      },
      {
        "change": "Correção mínima na causa",
        "basis": "function_guide"
      },
      {
        "change": "Preservar comportamento existente",
        "basis": "configuration"
      },
      {
        "change": "Regra de parada para problemas relacionados",
        "basis": "function_guide"
      },
      {
        "change": "Teste de regressão e relatório final",
        "basis": "function_guide"
      },
      {
        "change": "Autonomia para decidir detalhes",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [
      "Como reproduzir o problema",
      "Comando de teste do projeto"
    ],
    "prompt": "Corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx.\n\nArquivos citados: @OrdersTable.tsx. Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar. Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste. Preserve o comportamento existente fora do escopo. Se encontrar problemas relacionados, liste sem corrigir.\n\nAdicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste. Decida sozinho os detalhes técnicos menores e liste as suposições no relatório final.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Erro com mensagem|cursor|diagnosticar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx",
    "preservedLiterals": [
      "TypeError: Cannot read properties of undefined (reading 'map')",
      "OrdersTable.tsx"
    ],
    "routedToPlanning": false,
    "modeInstruction": "Envie no modo Ask, que não edita arquivos.",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx.\n\nArquivos citados: @OrdersTable.tsx.\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nDescreva o sintoma exato e como reproduzi-lo, só lendo o código, com o comando a rodar depois. Levante as hipóteses de causa, confirme ou descarte cada uma com evidência e chegue à causa raiz. Use o histórico do git para dizer desde quando o problema existe e procure outros lugares com a mesma falha. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Reprodução e teste de regressão: passos para reproduzir e o teste proposto, que falha antes do ajuste e passa depois.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Cursor, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "ask"
  },
  "Erro com mensagem|antigravity|perguntar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx",
    "preservedLiterals": [
      "TypeError: Cannot read properties of undefined (reading 'map')",
      "OrdersTable.tsx"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Menções aos arquivos que o rascunho citou",
        "basis": "draft"
      },
      {
        "change": "Reproduzir antes de corrigir",
        "basis": "function_guide"
      },
      {
        "change": "Correção mínima na causa",
        "basis": "function_guide"
      },
      {
        "change": "Preservar comportamento existente",
        "basis": "configuration"
      },
      {
        "change": "Regra de parada para problemas relacionados",
        "basis": "function_guide"
      },
      {
        "change": "Teste de regressão e relatório final",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Como reproduzir o problema",
      "Comando de teste do projeto"
    ],
    "prompt": "Corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx.\n\nArquivos citados: @OrdersTable.tsx. Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar. Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste. Preserve o comportamento existente fora do escopo. Se encontrar problemas relacionados, liste sem corrigir.\n\nAdicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Erro com mensagem|antigravity|decidir": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx",
    "preservedLiterals": [
      "TypeError: Cannot read properties of undefined (reading 'map')",
      "OrdersTable.tsx"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Menções aos arquivos que o rascunho citou",
        "basis": "draft"
      },
      {
        "change": "Reproduzir antes de corrigir",
        "basis": "function_guide"
      },
      {
        "change": "Correção mínima na causa",
        "basis": "function_guide"
      },
      {
        "change": "Preservar comportamento existente",
        "basis": "configuration"
      },
      {
        "change": "Regra de parada para problemas relacionados",
        "basis": "function_guide"
      },
      {
        "change": "Teste de regressão e relatório final",
        "basis": "function_guide"
      },
      {
        "change": "Autonomia para decidir detalhes",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [
      "Como reproduzir o problema",
      "Comando de teste do projeto"
    ],
    "prompt": "Corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx.\n\nArquivos citados: @OrdersTable.tsx. Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar. Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste. Preserve o comportamento existente fora do escopo. Se encontrar problemas relacionados, liste sem corrigir.\n\nAdicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste. Decida sozinho os detalhes técnicos menores e liste as suposições no relatório final.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Erro com mensagem|antigravity|diagnosticar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx",
    "preservedLiterals": [
      "TypeError: Cannot read properties of undefined (reading 'map')",
      "OrdersTable.tsx"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx.\n\nArquivos citados: @OrdersTable.tsx.\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nDescreva o sintoma exato e como reproduzi-lo, só lendo o código, com o comando a rodar depois. Levante as hipóteses de causa, confirme ou descarte cada uma com evidência e chegue à causa raiz. Use o histórico do git para dizer desde quando o problema existe e procure outros lugares com a mesma falha. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Reprodução e teste de regressão: passos para reproduzir e o teste proposto, que falha antes do ajuste e passa depois.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Antigravity, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Projeto novo|cursor|perguntar": {
    "detectedFunction": "start",
    "functionSource": "detected",
    "intentQuote": "quero criar um app pra controlar despesas da república",
    "preservedLiterals": [],
    "routedToPlanning": true,
    "modeInstruction": "Ative o Plan Mode com Shift+Tab antes de enviar.",
    "changes": [
      {
        "change": "Decisões a levantar antes de criar arquivos",
        "basis": "function_guide"
      },
      {
        "change": "Entregáveis mínimos do início",
        "basis": "function_guide"
      },
      {
        "change": "Verificação com saída dos comandos",
        "basis": "function_guide"
      },
      {
        "change": "Rota para planejamento antes de qualquer código",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Quero criar um app pra controlar despesas da república.\n\nAntes de criar qualquer arquivo, levante comigo as decisões em aberto: o que entra na primeira versão, o que fica de fora, a stack e onde o app vai rodar. Não sugira tecnologias antes de eu responder. Depois da aprovação, crie o mínimo para começar: estrutura, execução local, um teste de exemplo passando e um AGENTS.md com os comandos reais.\n\nPara verificar, mostre a saída dos comandos de instalar e testar.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "plan"
  },
  "Projeto novo|cursor|decidir": {
    "detectedFunction": "start",
    "functionSource": "detected",
    "intentQuote": "quero criar um app pra controlar despesas da república",
    "preservedLiterals": [],
    "routedToPlanning": true,
    "modeInstruction": "Ative o Plan Mode com Shift+Tab antes de enviar.",
    "changes": [
      {
        "change": "Decisões a levantar antes de criar arquivos",
        "basis": "function_guide"
      },
      {
        "change": "Entregáveis mínimos do início",
        "basis": "function_guide"
      },
      {
        "change": "Verificação com saída dos comandos",
        "basis": "function_guide"
      },
      {
        "change": "Rota para planejamento antes de qualquer código",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Quero criar um app pra controlar despesas da república.\n\nAntes de criar qualquer arquivo, levante comigo as decisões em aberto: o que entra na primeira versão, o que fica de fora, a stack e onde o app vai rodar. Não sugira tecnologias antes de eu responder. Depois da aprovação, crie o mínimo para começar: estrutura, execução local, um teste de exemplo passando e um AGENTS.md com os comandos reais.\n\nPara verificar, mostre a saída dos comandos de instalar e testar.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "plan"
  },
  "Projeto novo|cursor|diagnosticar": {
    "detectedFunction": "start",
    "functionSource": "detected",
    "intentQuote": "quero criar um app pra controlar despesas da república",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "Envie no modo Ask, que não edita arquivos.",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Quero criar um app pra controlar despesas da república.\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nLevante o objetivo do produto, o que entra na primeira versão e as decisões em aberto, como stack, hospedagem, dados e autenticação, cada uma com opções e trade-offs. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Estrutura inicial proposta e ordem de construção.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Cursor, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "ask"
  },
  "Projeto novo|antigravity|perguntar": {
    "detectedFunction": "start",
    "functionSource": "detected",
    "intentQuote": "quero criar um app pra controlar despesas da república",
    "preservedLiterals": [],
    "routedToPlanning": true,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Decisões a levantar antes de criar arquivos",
        "basis": "function_guide"
      },
      {
        "change": "Entregáveis mínimos do início",
        "basis": "function_guide"
      },
      {
        "change": "Verificação com saída dos comandos",
        "basis": "function_guide"
      },
      {
        "change": "Rota para planejamento antes de qualquer código",
        "basis": "function_guide"
      },
      {
        "change": "Prefixo que abre planejamento com entrevista no Antigravity",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "/plan /grill-me Quero criar um app pra controlar despesas da república.\n\nAntes de criar qualquer arquivo, levante comigo as decisões em aberto: o que entra na primeira versão, o que fica de fora, a stack e onde o app vai rodar. Não sugira tecnologias antes de eu responder. Depois da aprovação, crie o mínimo para começar: estrutura, execução local, um teste de exemplo passando e um AGENTS.md com os comandos reais.\n\nPara verificar, mostre a saída dos comandos de instalar e testar.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "plan"
  },
  "Projeto novo|antigravity|decidir": {
    "detectedFunction": "start",
    "functionSource": "detected",
    "intentQuote": "quero criar um app pra controlar despesas da república",
    "preservedLiterals": [],
    "routedToPlanning": true,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Decisões a levantar antes de criar arquivos",
        "basis": "function_guide"
      },
      {
        "change": "Entregáveis mínimos do início",
        "basis": "function_guide"
      },
      {
        "change": "Verificação com saída dos comandos",
        "basis": "function_guide"
      },
      {
        "change": "Rota para planejamento antes de qualquer código",
        "basis": "function_guide"
      },
      {
        "change": "Prefixo que abre planejamento com entrevista no Antigravity",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "/plan /grill-me Quero criar um app pra controlar despesas da república.\n\nAntes de criar qualquer arquivo, levante comigo as decisões em aberto: o que entra na primeira versão, o que fica de fora, a stack e onde o app vai rodar. Não sugira tecnologias antes de eu responder. Depois da aprovação, crie o mínimo para começar: estrutura, execução local, um teste de exemplo passando e um AGENTS.md com os comandos reais.\n\nPara verificar, mostre a saída dos comandos de instalar e testar.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "plan"
  },
  "Projeto novo|antigravity|diagnosticar": {
    "detectedFunction": "start",
    "functionSource": "detected",
    "intentQuote": "quero criar um app pra controlar despesas da república",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Quero criar um app pra controlar despesas da república.\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nLevante o objetivo do produto, o que entra na primeira versão e as decisões em aberto, como stack, hospedagem, dados e autenticação, cada uma com opções e trade-offs. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Estrutura inicial proposta e ordem de construção.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Antigravity, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Revisão|cursor|perguntar": {
    "detectedFunction": "review",
    "functionSource": "detected",
    "intentQuote": "revisa minhas mudanças antes de eu abrir o PR",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "Envie no modo Ask.",
    "changes": [
      {
        "change": "Alvo da revisão na sintaxe do Cursor",
        "basis": "function_guide"
      },
      {
        "change": "Foco da revisão sem estilo",
        "basis": "function_guide"
      },
      {
        "change": "Evidência e limite de achados",
        "basis": "function_guide"
      },
      {
        "change": "Somente leitura e veredito",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Se a revisão é das mudanças não commitadas ou da branch inteira"
    ],
    "prompt": "Revisa minhas mudanças antes de eu abrir o PR.\n\nAlvo da revisão: @Branch (Diff with Main). Foque em corretude, regressões, segurança e testes faltando. Ignore estilo. Para cada achado, informe arquivo e linha, trecho curto, por que importa, correção sugerida e severidade: bloqueador, importante ou menor. No máximo 10 achados.\n\nNão edite arquivos. Feche com o veredito, pronto para PR ou não, e os três itens mais importantes.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "ask"
  },
  "Revisão|cursor|decidir": {
    "detectedFunction": "review",
    "functionSource": "detected",
    "intentQuote": "revisa minhas mudanças antes de eu abrir o PR",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "Envie no modo Ask.",
    "changes": [
      {
        "change": "Alvo da revisão na sintaxe do Cursor",
        "basis": "function_guide"
      },
      {
        "change": "Foco da revisão sem estilo",
        "basis": "function_guide"
      },
      {
        "change": "Evidência e limite de achados",
        "basis": "function_guide"
      },
      {
        "change": "Somente leitura e veredito",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Se a revisão é das mudanças não commitadas ou da branch inteira"
    ],
    "prompt": "Revisa minhas mudanças antes de eu abrir o PR.\n\nAlvo da revisão: @Branch (Diff with Main). Foque em corretude, regressões, segurança e testes faltando. Ignore estilo. Para cada achado, informe arquivo e linha, trecho curto, por que importa, correção sugerida e severidade: bloqueador, importante ou menor. No máximo 10 achados.\n\nNão edite arquivos. Feche com o veredito, pronto para PR ou não, e os três itens mais importantes.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "ask"
  },
  "Revisão|cursor|diagnosticar": {
    "detectedFunction": "review",
    "functionSource": "detected",
    "intentQuote": "revisa minhas mudanças antes de eu abrir o PR",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "Envie no modo Ask, que não edita arquivos.",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Revisa minhas mudanças antes de eu abrir o PR.\n\nAlvo da revisão: @Branch (Diff with Main).\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nRevise as mudanças quanto a corretude em relação ao objetivo, regressões, segurança, desempenho com custo concreto e testes faltando. Ignore estilo. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Veredito: pronto ou não para seguir, e os três itens mais importantes.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Cursor, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "ask"
  },
  "Revisão|antigravity|perguntar": {
    "detectedFunction": "review",
    "functionSource": "detected",
    "intentQuote": "revisa minhas mudanças antes de eu abrir o PR",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Alvo da revisão",
        "basis": "function_guide"
      },
      {
        "change": "Foco da revisão sem estilo",
        "basis": "function_guide"
      },
      {
        "change": "Evidência e limite de achados",
        "basis": "function_guide"
      },
      {
        "change": "Somente leitura e veredito",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Se a revisão é das mudanças não commitadas ou da branch inteira"
    ],
    "prompt": "Revisa minhas mudanças antes de eu abrir o PR.\n\nRevise o diff da branch atual em relação à principal. Foque em corretude, regressões, segurança e testes faltando. Ignore estilo. Para cada achado, informe arquivo e linha, trecho curto, por que importa, correção sugerida e severidade: bloqueador, importante ou menor. No máximo 10 achados.\n\nNão edite arquivos. Feche com o veredito, pronto para PR ou não, e os três itens mais importantes.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Revisão|antigravity|decidir": {
    "detectedFunction": "review",
    "functionSource": "detected",
    "intentQuote": "revisa minhas mudanças antes de eu abrir o PR",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Alvo da revisão",
        "basis": "function_guide"
      },
      {
        "change": "Foco da revisão sem estilo",
        "basis": "function_guide"
      },
      {
        "change": "Evidência e limite de achados",
        "basis": "function_guide"
      },
      {
        "change": "Somente leitura e veredito",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Se a revisão é das mudanças não commitadas ou da branch inteira"
    ],
    "prompt": "Revisa minhas mudanças antes de eu abrir o PR.\n\nRevise o diff da branch atual em relação à principal. Foque em corretude, regressões, segurança e testes faltando. Ignore estilo. Para cada achado, informe arquivo e linha, trecho curto, por que importa, correção sugerida e severidade: bloqueador, importante ou menor. No máximo 10 achados.\n\nNão edite arquivos. Feche com o veredito, pronto para PR ou não, e os três itens mais importantes.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Revisão|antigravity|diagnosticar": {
    "detectedFunction": "review",
    "functionSource": "detected",
    "intentQuote": "revisa minhas mudanças antes de eu abrir o PR",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Revisa minhas mudanças antes de eu abrir o PR.\n\nAlvo da revisão: o diff da branch atual em relação à principal.\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nRevise as mudanças quanto a corretude em relação ao objetivo, regressões, segurança, desempenho com custo concreto e testes faltando. Ignore estilo. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Veredito: pronto ou não para seguir, e os três itens mais importantes.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Antigravity, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Pergunta|cursor|perguntar": {
    "detectedFunction": "understand",
    "functionSource": "detected",
    "intentQuote": "por que o useEffect roda duas vezes no meu componente?",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "Envie no modo Ask.",
    "changes": [
      {
        "change": "Exigência de evidência no código",
        "basis": "function_guide"
      },
      {
        "change": "Somente leitura",
        "basis": "function_guide"
      },
      {
        "change": "Formato curto da resposta",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Quais arquivos e módulos tratam do assunto do pedido"
    ],
    "prompt": "Por que o useEffect roda duas vezes no meu componente?\n\nAntes de responder, leia o código relevante e cite os caminhos que embasam a explicação. Não afirme nada sobre código que você não abriu. Não edite arquivos.\n\nResponda de forma curta: o que acontece, onde no código e por quê.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "ask"
  },
  "Pergunta|cursor|decidir": {
    "detectedFunction": "understand",
    "functionSource": "detected",
    "intentQuote": "por que o useEffect roda duas vezes no meu componente?",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "Envie no modo Ask.",
    "changes": [
      {
        "change": "Exigência de evidência no código",
        "basis": "function_guide"
      },
      {
        "change": "Somente leitura",
        "basis": "function_guide"
      },
      {
        "change": "Formato curto da resposta",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Quais arquivos e módulos tratam do assunto do pedido"
    ],
    "prompt": "Por que o useEffect roda duas vezes no meu componente?\n\nAntes de responder, leia o código relevante e cite os caminhos que embasam a explicação. Não afirme nada sobre código que você não abriu. Não edite arquivos.\n\nResponda de forma curta: o que acontece, onde no código e por quê.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "ask"
  },
  "Pergunta|cursor|diagnosticar": {
    "detectedFunction": "understand",
    "functionSource": "detected",
    "intentQuote": "por que o useEffect roda duas vezes no meu componente?",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "Envie no modo Ask, que não edita arquivos.",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Por que o useEffect roda duas vezes no meu componente?\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nMapeie os módulos envolvidos e como se conectam, o fluxo do pedido do início ao fim, as convenções, como rodar e testar e o estado do trabalho em andamento. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Mapa do sistema e pontos de atenção para quem vai continuar.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Cursor, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "ask"
  },
  "Pergunta|antigravity|perguntar": {
    "detectedFunction": "understand",
    "functionSource": "detected",
    "intentQuote": "por que o useEffect roda duas vezes no meu componente?",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Exigência de evidência no código",
        "basis": "function_guide"
      },
      {
        "change": "Somente leitura",
        "basis": "function_guide"
      },
      {
        "change": "Formato curto da resposta",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Quais arquivos e módulos tratam do assunto do pedido"
    ],
    "prompt": "Por que o useEffect roda duas vezes no meu componente?\n\nAntes de responder, leia o código relevante e cite os caminhos que embasam a explicação. Não afirme nada sobre código que você não abriu. Não edite arquivos.\n\nResponda de forma curta: o que acontece, onde no código e por quê.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Pergunta|antigravity|decidir": {
    "detectedFunction": "understand",
    "functionSource": "detected",
    "intentQuote": "por que o useEffect roda duas vezes no meu componente?",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Exigência de evidência no código",
        "basis": "function_guide"
      },
      {
        "change": "Somente leitura",
        "basis": "function_guide"
      },
      {
        "change": "Formato curto da resposta",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [
      "Quais arquivos e módulos tratam do assunto do pedido"
    ],
    "prompt": "Por que o useEffect roda duas vezes no meu componente?\n\nAntes de responder, leia o código relevante e cite os caminhos que embasam a explicação. Não afirme nada sobre código que você não abriu. Não edite arquivos.\n\nResponda de forma curta: o que acontece, onde no código e por quê.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Pergunta|antigravity|diagnosticar": {
    "detectedFunction": "understand",
    "functionSource": "detected",
    "intentQuote": "por que o useEffect roda duas vezes no meu componente?",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Por que o useEffect roda duas vezes no meu componente?\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nMapeie os módulos envolvidos e como se conectam, o fluxo do pedido do início ao fim, as convenções, como rodar e testar e o estado do trabalho em andamento. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Mapa do sistema e pontos de atenção para quem vai continuar.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Antigravity, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Já específico|cursor|perguntar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura.",
    "preservedLiterals": [
      "src/auth/refresh.ts",
      "src/auth/refresh.test.ts"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura. Adicione teste em src/auth/refresh.test.ts que falha antes e passa depois. Rode npm test -- refresh.",
    "status": "UNCHANGED",
    "reason": "O rascunho já indica alvo, ação, escopo e verificação.",
    "recommendedMode": "agent"
  },
  "Já específico|cursor|decidir": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura.",
    "preservedLiterals": [
      "src/auth/refresh.ts",
      "src/auth/refresh.test.ts"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura. Adicione teste em src/auth/refresh.test.ts que falha antes e passa depois. Rode npm test -- refresh.",
    "status": "UNCHANGED",
    "reason": "O rascunho já indica alvo, ação, escopo e verificação.",
    "recommendedMode": "agent"
  },
  "Já específico|cursor|diagnosticar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura.",
    "preservedLiterals": [
      "src/auth/refresh.ts",
      "src/auth/refresh.test.ts"
    ],
    "routedToPlanning": false,
    "modeInstruction": "Envie no modo Ask, que não edita arquivos.",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura. Adicione teste em src/auth/refresh.test.ts que falha antes e passa depois. Rode npm test -- refresh.\n\nArquivos citados: @src/auth/refresh.ts @src/auth/refresh.test.ts.\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nDescreva o sintoma exato e como reproduzi-lo, só lendo o código, com o comando a rodar depois. Levante as hipóteses de causa, confirme ou descarte cada uma com evidência e chegue à causa raiz. Use o histórico do git para dizer desde quando o problema existe e procure outros lugares com a mesma falha. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Reprodução e teste de regressão: passos para reproduzir e o teste proposto, que falha antes do ajuste e passa depois.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Cursor, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "ask"
  },
  "Já específico|antigravity|perguntar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura.",
    "preservedLiterals": [
      "src/auth/refresh.ts",
      "src/auth/refresh.test.ts"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura. Adicione teste em src/auth/refresh.test.ts que falha antes e passa depois. Rode npm test -- refresh.",
    "status": "UNCHANGED",
    "reason": "O rascunho já indica alvo, ação, escopo e verificação.",
    "recommendedMode": "agent"
  },
  "Já específico|antigravity|decidir": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura.",
    "preservedLiterals": [
      "src/auth/refresh.ts",
      "src/auth/refresh.test.ts"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura. Adicione teste em src/auth/refresh.test.ts que falha antes e passa depois. Rode npm test -- refresh.",
    "status": "UNCHANGED",
    "reason": "O rascunho já indica alvo, ação, escopo e verificação.",
    "recommendedMode": "agent"
  },
  "Já específico|antigravity|diagnosticar": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura.",
    "preservedLiterals": [
      "src/auth/refresh.ts",
      "src/auth/refresh.test.ts"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura. Adicione teste em src/auth/refresh.test.ts que falha antes e passa depois. Rode npm test -- refresh.\n\nArquivos citados: @src/auth/refresh.ts @src/auth/refresh.test.ts.\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nDescreva o sintoma exato e como reproduzi-lo, só lendo o código, com o comando a rodar depois. Levante as hipóteses de causa, confirme ou descarte cada uma com evidência e chegue à causa raiz. Use o histórico do git para dizer desde quando o problema existe e procure outros lugares com a mesma falha. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Reprodução e teste de regressão: passos para reproduzir e o teste proposto, que falha antes do ajuste e passa depois.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Antigravity, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "Sem tarefa|cursor|perguntar": {
    "detectedFunction": "implement",
    "functionSource": "detected",
    "intentQuote": "oi",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "oi",
    "status": "INSUFFICIENT",
    "reason": "O rascunho não descreve uma tarefa para o agente. Diga o que precisa ser feito e onde.",
    "recommendedMode": "agent"
  },
  "Sem tarefa|cursor|decidir": {
    "detectedFunction": "implement",
    "functionSource": "detected",
    "intentQuote": "oi",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "oi",
    "status": "INSUFFICIENT",
    "reason": "O rascunho não descreve uma tarefa para o agente. Diga o que precisa ser feito e onde.",
    "recommendedMode": "agent"
  },
  "Sem tarefa|cursor|diagnosticar": {
    "detectedFunction": "implement",
    "functionSource": "detected",
    "intentQuote": "oi",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "oi",
    "status": "INSUFFICIENT",
    "reason": "O rascunho não descreve uma tarefa para o agente. Diga o que precisa ser feito e onde.",
    "recommendedMode": "agent"
  },
  "Sem tarefa|antigravity|perguntar": {
    "detectedFunction": "implement",
    "functionSource": "detected",
    "intentQuote": "oi",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "oi",
    "status": "INSUFFICIENT",
    "reason": "O rascunho não descreve uma tarefa para o agente. Diga o que precisa ser feito e onde.",
    "recommendedMode": "agent"
  },
  "Sem tarefa|antigravity|decidir": {
    "detectedFunction": "implement",
    "functionSource": "detected",
    "intentQuote": "oi",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "oi",
    "status": "INSUFFICIENT",
    "reason": "O rascunho não descreve uma tarefa para o agente. Diga o que precisa ser feito e onde.",
    "recommendedMode": "agent"
  },
  "Sem tarefa|antigravity|diagnosticar": {
    "detectedFunction": "implement",
    "functionSource": "detected",
    "intentQuote": "oi",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "oi",
    "status": "INSUFFICIENT",
    "reason": "O rascunho não descreve uma tarefa para o agente. Diga o que precisa ser feito e onde.",
    "recommendedMode": "agent"
  },
  "skills|cursor": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "o login quebra depois de um tempo, arruma",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Localizar o código envolvido",
        "basis": "function_guide"
      },
      {
        "change": "Reproduzir antes de corrigir",
        "basis": "function_guide"
      },
      {
        "change": "Correção mínima na causa",
        "basis": "function_guide"
      },
      {
        "change": "Preservar comportamento existente",
        "basis": "configuration"
      },
      {
        "change": "Regra de parada para problemas relacionados",
        "basis": "function_guide"
      },
      {
        "change": "Teste de regressão e relatório final",
        "basis": "function_guide"
      },
      {
        "change": "Skills instaladas incorporadas",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [
      "Onde fica o código envolvido",
      "Como reproduzir o problema",
      "Comando de teste do projeto"
    ],
    "prompt": "O login quebra depois de um tempo, arruma.\n\nLocalize no codebase o trecho responsável pelo comportamento descrito. Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar. Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste. Preserve o comportamento existente fora do escopo. Se encontrar problemas relacionados, liste sem corrigir.\n\nAdicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste.\n\nUse as skills `security-review` e `tdd-workflow` nesta tarefa.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "ambicioso|antigravity": {
    "detectedFunction": "start",
    "functionSource": "detected",
    "intentQuote": "quero criar um app pra controlar despesas da república",
    "preservedLiterals": [],
    "routedToPlanning": true,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Decisões a levantar antes de criar arquivos",
        "basis": "function_guide"
      },
      {
        "change": "Entregáveis mínimos do início",
        "basis": "function_guide"
      },
      {
        "change": "Escopo ambicioso",
        "basis": "configuration"
      },
      {
        "change": "Verificação com saída dos comandos",
        "basis": "function_guide"
      },
      {
        "change": "Rota para planejamento antes de qualquer código",
        "basis": "function_guide"
      },
      {
        "change": "Prefixo que abre planejamento com entrevista no Antigravity",
        "basis": "function_guide"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "/plan /grill-me Quero criar um app pra controlar despesas da república.\n\nAntes de criar qualquer arquivo, levante comigo as decisões em aberto: o que entra na primeira versão, o que fica de fora, a stack e onde o app vai rodar. Não sugira tecnologias antes de eu responder. Depois da aprovação, crie o mínimo para começar: estrutura, execução local, um teste de exemplo passando e um AGENTS.md com os comandos reais. Inclua na primeira versão os estados vazio, de erro e de carregamento das telas.\n\nPara verificar, mostre a saída dos comandos de instalar e testar.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "plan"
  },
  "sem-preservar|cursor": {
    "detectedFunction": "fix",
    "functionSource": "detected",
    "intentQuote": "corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx",
    "preservedLiterals": [
      "TypeError: Cannot read properties of undefined (reading 'map')",
      "OrdersTable.tsx"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Menções aos arquivos que o rascunho citou",
        "basis": "draft"
      },
      {
        "change": "Reproduzir antes de corrigir",
        "basis": "function_guide"
      },
      {
        "change": "Correção mínima na causa",
        "basis": "function_guide"
      },
      {
        "change": "Regra de parada para problemas relacionados",
        "basis": "function_guide"
      },
      {
        "change": "Teste de regressão e relatório final",
        "basis": "function_guide"
      },
      {
        "change": "Autonomia para decidir detalhes",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [
      "Como reproduzir o problema",
      "Comando de teste do projeto"
    ],
    "prompt": "Corrige o TypeError: Cannot read properties of undefined (reading 'map') no OrdersTable.tsx.\n\nArquivos citados: @OrdersTable.tsx. Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar. Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste. Se encontrar problemas relacionados, liste sem corrigir.\n\nAdicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste. Decida sozinho os detalhes técnicos menores e liste as suposições no relatório final.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "keep-docs|cursor": {
    "detectedFunction": "keep-codebase-knowledge",
    "functionSource": "selected",
    "intentQuote": "atualiza a dependência do build e roda os testes",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Seguir convenções de teste existentes",
        "basis": "function_guide"
      },
      {
        "change": "Testar comportamento",
        "basis": "function_guide"
      },
      {
        "change": "Preservar comportamento existente",
        "basis": "configuration"
      },
      {
        "change": "Verificação com saída dos testes",
        "basis": "function_guide"
      },
      {
        "change": "Consulta aos documentos de docs/codebase/",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [
      "Qual código deve ser testado",
      "Framework e convenções de teste do projeto"
    ],
    "prompt": "Atualiza a dependência do build e roda os testes.\n\nAntes de agir, leia nesta ordem `docs/codebase/STRUCTURE.md`, `docs/codebase/CONVENTIONS.md`, `docs/codebase/CONCERNS.md`, `docs/codebase/STACK.md`, `docs/codebase/TESTING.md`, gerados pela skill `acquire-codebase-knowledge`. Siga as convenções e os padrões registrados e trate com cuidado as áreas de CONCERNS.md que a tarefa tocar. Se documento e código divergirem, vale o código: relate a divergência. Se `docs/codebase/` não existir, avise, siga lendo o código e sugira rodar a skill `acquire-codebase-knowledge`.\n\nDescubra no projeto o framework, a localização e as convenções de teste e siga-os. Teste comportamento, não implementação, cobrindo os casos que citei. Preserve o comportamento existente fora do escopo.\n\nRode os testes e mostre a saída.\n\nAo terminar, se a mudança deixou algum documento de `docs/codebase/` desatualizado, atualize só a seção afetada e cite no relato.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "keep-docs-diagnostico|antigravity": {
    "detectedFunction": "test",
    "functionSource": "selected",
    "intentQuote": "atualiza a dependência do build e roda os testes",
    "preservedLiterals": [],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [
      {
        "change": "Proibição de qualquer alteração no projeto",
        "basis": "configuration"
      },
      {
        "change": "Investigação e seção específicas da função",
        "basis": "function_guide"
      },
      {
        "change": "Escopo mínimo aplicado aos ajustes propostos",
        "basis": "configuration"
      },
      {
        "change": "Preservação de comportamento declarada por ajuste",
        "basis": "configuration"
      },
      {
        "change": "Relatório completo com prompt de implementação para repasse",
        "basis": "configuration"
      },
      {
        "change": "Consulta aos documentos de docs/codebase/",
        "basis": "configuration"
      }
    ],
    "agentMustDetermine": [],
    "prompt": "Atualiza a dependência do build e roda os testes.\n\nAntes de agir, leia nesta ordem `docs/codebase/STRUCTURE.md`, `docs/codebase/CONVENTIONS.md`, `docs/codebase/CONCERNS.md`, `docs/codebase/STACK.md`, `docs/codebase/TESTING.md`, gerados pela skill `acquire-codebase-knowledge`. Siga as convenções e os padrões registrados e trate com cuidado as áreas de CONCERNS.md que a tarefa tocar. Se documento e código divergirem, vale o código: relate a divergência. Se `docs/codebase/` não existir, avise, siga lendo o código e sugira rodar a skill `acquire-codebase-knowledge`.\n\nEsta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.\n\nIdentifique o framework e as convenções de teste, o que está coberto e o que não está, os casos de borda e de erro faltando e os testes frágeis. Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.\n\nLimite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para \"Fora do escopo\". Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para \"Decisões para aprovação\".\n\nEntregue um relatório com estas seções, nesta ordem:\n1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.\n2. Contexto verificado: arquivos, módulos, regras e histórico consultados.\n3. Diagnóstico: causa raiz ou situação atual, com evidência.\n4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.\n5. Casos de teste propostos: cada um com entrada, comportamento esperado e arquivo.\n6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.\n7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.\n8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.\n9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.\n10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.\n11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando menções @ do Antigravity, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.\n\nEscreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.\n\nListe no final os documentos de `docs/codebase/` que ficariam desatualizados.",
    "status": "ENHANCED",
    "reason": "",
    "recommendedMode": "agent"
  },
  "test-forcado|cursor": {
    "detectedFunction": "test",
    "functionSource": "selected",
    "intentQuote": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura.",
    "preservedLiterals": [
      "src/auth/refresh.ts",
      "src/auth/refresh.test.ts"
    ],
    "routedToPlanning": false,
    "modeInstruction": "",
    "changes": [],
    "agentMustDetermine": [],
    "prompt": "Em src/auth/refresh.ts, faça refreshToken lançar SessionExpiredError quando /token responder 401, sem mudar a assinatura. Adicione teste em src/auth/refresh.test.ts que falha antes e passa depois. Rode npm test -- refresh.",
    "status": "UNCHANGED",
    "reason": "O rascunho já indica alvo, ação, escopo e verificação.",
    "recommendedMode": "agent"
  }
};
