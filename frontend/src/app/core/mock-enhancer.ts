import {
  AgentMode,
  ChangeBasis,
  EnhanceChange,
  MockRequest,
  EnhanceResponse,
  TaskFunction,
  WorkFunction,
} from './models';

// Simulação local do agente, usada só quando o Vertex não está configurado ou o servidor
// está desligado. Regras fixas e simplificadas; o resultado aparece rotulado como demonstração.

const GREETING = /^(oi|ol[aá]|e a[ií]|bom dia|boa tarde|boa noite|teste|hello|hi|hey)[\s!.?]*$/i;
const FILE_RE = /(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.(?:tsx?|jsx?|py|java|cs|go|rb|php|json|md|html|s?css|sql|ya?ml)\b/g;
const CODE_RE = /`[^`]+`/g;
const ERROR_RE = /\b[A-Z][A-Za-z]*(?:Error|Exception):.*?(?=\s+(?:no|na|em|in|at)\s|$)/g;
const ANTIGRAVITY_ROUTE = '/plan /grill-me ';

const SIGNALS: readonly [WorkFunction, RegExp][] = [
  ['fix', /(erro|bug|quebr|falh|não funciona|nao funciona|exce[cç][aã]o|stack trace|regress|corrig|arrum|typeerror|referenceerror|exception)/i],
  ['review', /(revis|review|antes do pr|abrir o pr|pull request|\bdiff\b|minhas mudan[cç]as)/i],
  ['test', /\b(testes?|cobertura|testar|tdd)\b/i],
  ['start', /(do zero|novo app|criar um app|criar um projeto|novo projeto|inicializ|scaffold|come[cç]ar um sistema)/i],
  ['implement', /(implement|adicion|criar|cria |integr|suport|refator)/i],
  ['understand', /(explic|entend|como funciona|onde fica|por que|porque|vis[aã]o geral|retom|continuar)/i],
];

interface Plan {
  paragraphs: string[][];
  changes: EnhanceChange[];
  determine: string[];
  routed: boolean;
}

export function buildMockResponse(req: MockRequest): EnhanceResponse {
  const draft = req.draft.trim();
  const files = unique(draft.match(FILE_RE) ?? []);
  const detected: TaskFunction = req.function === 'auto' ? detectFunction(draft) : req.function;
  const keepDocs = detected === 'keep-codebase-knowledge';
  // keep-codebase-knowledge executa a tarefa do rascunho; a natureza dela sai dos sinais, nunca start.
  const nature: WorkFunction = keepDocs ? natureOf(draft) : (detected as WorkFunction);
  const functionSource: EnhanceResponse['functionSource'] = req.function === 'auto' ? 'detected' : 'selected';

  const base = {
    detectedFunction: detected,
    functionSource,
    intentQuote: firstSentence(draft),
    preservedLiterals: extractLiterals(draft),
    routedToPlanning: false,
    modeInstruction: '',
    changes: [] as EnhanceChange[],
    agentMustDetermine: [] as string[],
    prompt: req.draft,
  };

  if (GREETING.test(draft) || wordCount(draft) < 2) {
    return {
      ...base,
      status: 'INSUFFICIENT',
      reason: 'O rascunho não descreve uma tarefa para o agente. Diga o que precisa ser feito e onde.',
      preservedLiterals: [],
      recommendedMode: 'agent',
    };
  }

  if (req.autonomy === 'diagnosticar') {
    const response = diagnosisResponse(req, base, nature, files);
    return keepDocs ? withCodebaseDocs(response, nature, draft, true) : response;
  }

  if (!keepDocs && req.skills.length === 0 && files.length > 0 && /\b(testes?|test)\b/i.test(draft) && wordCount(draft) >= 20) {
    return {
      ...base,
      status: 'UNCHANGED',
      reason: 'O rascunho já indica alvo, ação, escopo e verificação.',
      recommendedMode: 'agent',
    };
  }

  const plan = compose(nature, draft, files, req);
  if (req.skills.length) {
    const names = req.skills.map((s) => `\`${s.name}\``);
    const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
    (plan.paragraphs[3] ??= []).push(names.length === 1 ? `Use a skill ${list} nesta tarefa.` : `Use as skills ${list} nesta tarefa.`);
    plan.changes.push({ change: 'Skills instaladas incorporadas', basis: 'configuration' });
  }
  const mode: AgentMode = plan.routed
    ? 'plan'
    : readOnly(nature) && req.ide === 'cursor'
      ? 'ask'
      : 'agent';

  let prompt = plan.paragraphs
    .filter((p) => p.length > 0)
    .map((p) => p.join(' '))
    .join('\n\n');

  let modeInstruction = '';
  if (req.ide === 'antigravity' && plan.routed) {
    prompt = ANTIGRAVITY_ROUTE + prompt;
    plan.changes.push({ change: 'Prefixo que abre planejamento com entrevista no Antigravity', basis: 'function_guide' });
  }
  if (req.ide === 'cursor') {
    if (mode === 'plan') {
      modeInstruction = 'Ative o Plan Mode com Shift+Tab antes de enviar.';
    } else if (mode === 'ask') {
      modeInstruction = 'Envie no modo Ask.';
    }
  }

  const response: EnhanceResponse = {
    ...base,
    status: 'ENHANCED',
    reason: '',
    recommendedMode: mode,
    routedToPlanning: plan.routed,
    modeInstruction,
    changes: plan.changes,
    agentMustDetermine: plan.determine,
    prompt,
  };
  return keepDocs ? withCodebaseDocs(response, nature, draft, false) : response;
}

function compose(fn: WorkFunction, draft: string, files: string[], req: MockRequest): Plan {
  const plan: Plan = { paragraphs: [[asSentence(draft)]], changes: [], determine: [], routed: false };
  const add = (para: number, text: string, change?: string, basis: ChangeBasis = 'function_guide') => {
    (plan.paragraphs[para] ??= []).push(text);
    if (change) {
      plan.changes.push({ change, basis });
    }
  };
  const mention = files.map((f) => `@${f}`).join(' ');
  const mentionFiles = () => add(1, `Arquivos citados: ${mention}.`, 'Menções aos arquivos que o rascunho citou', 'draft');
  const preserve = () => {
    if (req.preserveBehavior) {
      add(1, 'Preserve o comportamento existente fora do escopo.', 'Preservar comportamento existente', 'configuration');
    }
  };
  const decide = () => {
    if (req.autonomy === 'decidir') {
      add(2, 'Decida sozinho os detalhes técnicos menores e liste as suposições no relatório final.', 'Autonomia para decidir detalhes', 'configuration');
    }
  };

  switch (fn) {
    case 'understand':
      if (files.length) mentionFiles();
      add(1, 'Antes de responder, leia o código relevante e cite os caminhos que embasam a explicação. Não afirme nada sobre código que você não abriu.', 'Exigência de evidência no código');
      add(1, 'Não edite arquivos.', 'Somente leitura');
      add(2, 'Responda de forma curta: o que acontece, onde no código e por quê.', 'Formato curto da resposta');
      if (!files.length) plan.determine.push('Quais arquivos e módulos tratam do assunto do pedido');
      break;

    case 'start':
      plan.routed = true;
      add(1, 'Antes de criar qualquer arquivo, levante comigo as decisões em aberto: o que entra na primeira versão, o que fica de fora, a stack e onde o app vai rodar. Não sugira tecnologias antes de eu responder.', 'Decisões a levantar antes de criar arquivos');
      add(1, 'Depois da aprovação, crie o mínimo para começar: estrutura, execução local, um teste de exemplo passando e um AGENTS.md com os comandos reais.', 'Entregáveis mínimos do início');
      if (req.scope === 'ambicioso') {
        add(1, 'Inclua na primeira versão os estados vazio, de erro e de carregamento das telas.', 'Escopo ambicioso', 'configuration');
      }
      add(2, 'Para verificar, mostre a saída dos comandos de instalar e testar.', 'Verificação com saída dos comandos');
      plan.changes.push({ change: 'Rota para planejamento antes de qualquer código', basis: 'function_guide' });
      break;

    case 'implement': {
      const vague = !files.length && wordCount(draft) < 6 && req.autonomy === 'perguntar';
      if (files.length) {
        mentionFiles();
      } else {
        add(1, 'Localize no codebase onde essa mudança deve entrar e siga o padrão de código existente mais parecido.', 'Localizar o ponto de mudança e seguir o padrão existente');
        plan.determine.push('Onde a mudança deve entrar', 'Qual padrão existente seguir');
      }
      if (vague) {
        plan.routed = true;
        add(1, 'Antes de editar, levante comigo o escopo e o critério de pronto desta mudança.', 'Rota para planejamento: escopo e pronto em aberto');
      }
      scopeLine(req.scope, add);
      preserve();
      add(2, 'Rode os testes do projeto e adicione um teste para o novo comportamento seguindo as convenções existentes. Mostre comando e saída.', 'Verificação com teste do novo comportamento');
      plan.determine.push('Comando de teste do projeto');
      decide();
      break;
    }

    case 'fix':
      if (files.length) {
        mentionFiles();
      } else {
        add(1, 'Localize no codebase o trecho responsável pelo comportamento descrito.', 'Localizar o código envolvido');
        plan.determine.push('Onde fica o código envolvido');
      }
      add(1, 'Reproduza o problema antes de corrigir e confirme a causa com evidência antes de editar.', 'Reproduzir antes de corrigir');
      add(1, 'Faça a correção mínima na causa, não no sintoma, sem valores fixos para passar em teste.', 'Correção mínima na causa');
      preserve();
      add(1, 'Se encontrar problemas relacionados, liste sem corrigir.', 'Regra de parada para problemas relacionados');
      add(2, 'Adicione um teste que falhe antes e passe depois e rode a suíte do projeto, mostrando comando e saída. No final, relate causa raiz, mudança e teste.', 'Teste de regressão e relatório final');
      plan.determine.push('Como reproduzir o problema', 'Comando de teste do projeto');
      decide();
      break;

    case 'review':
      if (req.ide === 'cursor') {
        add(1, 'Alvo da revisão: @Branch (Diff with Main).', 'Alvo da revisão na sintaxe do Cursor');
      } else {
        add(1, 'Revise o diff da branch atual em relação à principal.', 'Alvo da revisão');
      }
      add(1, 'Foque em corretude, regressões, segurança e testes faltando. Ignore estilo.', 'Foco da revisão sem estilo');
      add(1, 'Para cada achado, informe arquivo e linha, trecho curto, por que importa, correção sugerida e severidade: bloqueador, importante ou menor. No máximo 10 achados.', 'Evidência e limite de achados');
      add(2, 'Não edite arquivos. Feche com o veredito, pronto para PR ou não, e os três itens mais importantes.', 'Somente leitura e veredito');
      plan.determine.push('Se a revisão é das mudanças não commitadas ou da branch inteira');
      break;

    case 'test':
      if (files.length) {
        mentionFiles();
      } else {
        plan.determine.push('Qual código deve ser testado');
      }
      add(1, 'Descubra no projeto o framework, a localização e as convenções de teste e siga-os.', 'Seguir convenções de teste existentes');
      add(1, 'Teste comportamento, não implementação, cobrindo os casos que citei.', 'Testar comportamento');
      preserve();
      add(2, 'Rode os testes e mostre a saída.', 'Verificação com saída dos testes');
      plan.determine.push('Framework e convenções de teste do projeto');
      break;
  }

  return plan;
}

// Investigação e seção específica por função. Espelha a tabela de "Só diagnosticar" na system instruction.
const DIAGNOSIS_BY_FUNCTION: Record<WorkFunction, { investigate: string; section: string }> = {
  fix: {
    investigate: 'Descreva o sintoma exato e como reproduzi-lo, só lendo o código, com o comando a rodar depois. Levante as hipóteses de causa, confirme ou descarte cada uma com evidência e chegue à causa raiz. Use o histórico do git para dizer desde quando o problema existe e procure outros lugares com a mesma falha.',
    section: 'Reprodução e teste de regressão: passos para reproduzir e o teste proposto, que falha antes do ajuste e passa depois.',
  },
  implement: {
    investigate: 'Mapeie onde a mudança entra, que código existente é afetado, que padrão do projeto seguir, quais contratos e interfaces públicas são tocados e se há dados ou migrações envolvidos.',
    section: 'Critérios de aceite e mudanças por arquivo: comportamento observável esperado e o que muda em cada arquivo.',
  },
  review: {
    investigate: 'Revise as mudanças quanto a corretude em relação ao objetivo, regressões, segurança, desempenho com custo concreto e testes faltando. Ignore estilo.',
    section: 'Veredito: pronto ou não para seguir, e os três itens mais importantes.',
  },
  understand: {
    investigate: 'Mapeie os módulos envolvidos e como se conectam, o fluxo do pedido do início ao fim, as convenções, como rodar e testar e o estado do trabalho em andamento.',
    section: 'Mapa do sistema e pontos de atenção para quem vai continuar.',
  },
  test: {
    investigate: 'Identifique o framework e as convenções de teste, o que está coberto e o que não está, os casos de borda e de erro faltando e os testes frágeis.',
    section: 'Casos de teste propostos: cada um com entrada, comportamento esperado e arquivo.',
  },
  start: {
    investigate: 'Levante o objetivo do produto, o que entra na primeira versão e as decisões em aberto, como stack, hospedagem, dados e autenticação, cada uma com opções e trade-offs.',
    section: 'Estrutura inicial proposta e ordem de construção.',
  },
};

function diagnosisResponse(
  req: MockRequest,
  base: Omit<EnhanceResponse, 'status' | 'reason' | 'recommendedMode'>,
  fn: WorkFunction,
  files: string[],
): EnhanceResponse {
  const guide = DIAGNOSIS_BY_FUNCTION[fn];
  const changes: EnhanceChange[] = [
    { change: 'Proibição de qualquer alteração no projeto', basis: 'configuration' },
    { change: 'Investigação e seção específicas da função', basis: 'function_guide' },
  ];

  // 1. Objetivo, com menções na sintaxe do IDE
  const paragraphs: string[] = [asSentence(req.draft.trim())];
  const targets: string[] = [];
  if (files.length) {
    targets.push(`Arquivos citados: ${files.map((f) => `@${f}`).join(' ')}.`);
  }
  if (fn === 'review') {
    targets.push(req.ide === 'cursor' ? 'Alvo da revisão: @Branch (Diff with Main).' : 'Alvo da revisão: o diff da branch atual em relação à principal.');
  }
  if (targets.length) paragraphs.push(targets.join(' '));

  // 2. Proibição de tarefa prática
  paragraphs.push(
    'Esta é uma tarefa só de diagnóstico. Não edite, crie, apague nem mova arquivos; não instale dependências; não faça commit, push ou merge; não altere configuração, banco ou ambiente; não rode comandos que escrevam em disco ou chamem serviços externos. Use apenas leitura de arquivos e comandos somente leitura, como busca, listagem, git log, git diff e git status. Se precisar executar algo para confirmar, descreva o comando no relatório em vez de rodá-lo.',
  );

  // 3 a 5. Investigação, abrangência e evidência
  paragraphs.push(
    `${guide.investigate} Vá além do ponto citado: verifique outros lugares que usam o mesmo código ou padrão, efeitos colaterais, dependências entre módulos, testes que cobrem ou não a área e as regras do projeto em AGENTS.md e nas regras do IDE. Registre o que não pôde verificar e por quê. Para cada conclusão, cite arquivo e linha com um trecho curto e diga o que observou, separando o confirmado do suposto.`,
  );

  // 6. Escopo, comportamento e skills
  const alignment: string[] = [];
  if (req.scope === 'minimo') {
    alignment.push('Limite os ajustes propostos ao necessário para resolver o pedido, sem novas abstrações nem dependências; melhorias além disso vão para "Fora do escopo".');
    changes.push({ change: 'Escopo mínimo aplicado aos ajustes propostos', basis: 'configuration' });
  } else {
    alignment.push('Os ajustes propostos devem cobrir a solução completa, incluindo casos de borda e estados vazio, de erro e de carregamento quando houver interface.');
    changes.push({ change: 'Escopo completo aplicado aos ajustes propostos', basis: 'configuration' });
  }
  if (req.preserveBehavior) {
    alignment.push('Para cada ajuste, diga se altera comportamento observável ou interface pública; os que alteram vão para "Decisões para aprovação".');
    changes.push({ change: 'Preservação de comportamento declarada por ajuste', basis: 'configuration' });
  } else {
    alignment.push('Mudanças de comportamento são permitidas, mas liste cada uma em "Riscos e efeitos colaterais".');
  }
  if (req.skills.length) {
    const names = req.skills.map((s) => `\`${s.name}\``).join(', ');
    alignment.push(`Use as skills ${names} na investigação e cite qual embasou cada achado ou ajuste.`);
    changes.push({ change: 'Skills instaladas usadas na investigação e no repasse', basis: 'configuration' });
  }
  paragraphs.push(alignment.join(' '));

  // 7. Relatório
  const syntax = req.ide === 'cursor' ? 'menções @ do Cursor' : 'menções @ do Antigravity';
  const skillsLine = req.skills.length ? ', mande usar as mesmas skills' : '';
  paragraphs.push(
    [
      'Entregue um relatório com estas seções, nesta ordem:',
      '1. Resumo: o problema ou objetivo e a conclusão principal, em até cinco frases.',
      '2. Contexto verificado: arquivos, módulos, regras e histórico consultados.',
      '3. Diagnóstico: causa raiz ou situação atual, com evidência.',
      '4. Achados: erros, riscos e melhorias, cada um com severidade bloqueador, importante ou menor, evidência e impacto.',
      `5. ${guide.section}`,
      '6. Ajustes propostos: passos numerados e ordenados por dependência, cada um com arquivo e local, o que mudar, por que, de que passo depende e o risco. Descreva a mudança sem escrever o código, com detalhe suficiente para outro modelo executar sem refazer a investigação.',
      '7. Como verificar: comandos e testes que provam cada ajuste, com o resultado esperado.',
      '8. Riscos e efeitos colaterais: o que pode quebrar e como perceber.',
      '9. Decisões para aprovação: escolhas que preciso fazer, cada uma com opções e sua recomendação.',
      '10. Fora do escopo: problemas encontrados que não fazem parte do pedido, só listados.',
      `11. Prompt de implementação: um prompt pronto para o modelo que vai implementar, usando ${syntax}, que referencie este relatório, liste os passos aprovados, repita as restrições de escopo e de comportamento${skillsLine}, mande seguir os passos na ordem, rodar a verificação de cada um e parar se algo divergir do relatório.`,
    ].join('\n'),
  );
  changes.push({ change: 'Relatório completo com prompt de implementação para repasse', basis: 'configuration' });

  // 8. Fechamento
  paragraphs.push('Escreva o relatório autocontido, sem depender desta conversa, porque ele será entregue a outro modelo. Não implemente nada; aguarde minha aprovação do relatório.');

  return {
    ...base,
    status: 'ENHANCED',
    reason: '',
    detectedFunction: fn,
    recommendedMode: req.ide === 'cursor' ? 'ask' : 'agent',
    routedToPlanning: false,
    modeInstruction: req.ide === 'cursor' ? 'Envie no modo Ask, que não edita arquivos.' : '',
    changes,
    agentMustDetermine: [],
    prompt: paragraphs.join('\n\n'),
  };
}

function scopeLine(scope: MockRequest['scope'], add: (para: number, text: string, change?: string, basis?: ChangeBasis) => void) {
  if (scope === 'minimo') {
    add(1, 'Não faça mudanças além do pedido nem crie abstrações para casos hipotéticos.', 'Escopo mínimo', 'configuration');
  } else {
    add(1, 'Entregue a funcionalidade completa, cobrindo estados vazio, de erro e de carregamento quando houver interface.', 'Escopo ambicioso', 'configuration');
  }
}

/** Funções que não editam arquivos. */
function readOnly(fn: WorkFunction): boolean {
  return fn === 'understand' || fn === 'review';
}

function natureOf(draft: string): WorkFunction {
  const fn = detectFunction(draft);
  return fn === 'start' ? 'implement' : fn;
}

/** Documentos de docs/codebase/ que servem à tarefa, na ordem de leitura. */
function codebaseDocs(nature: WorkFunction, draft: string): string[] {
  const docs = ['STRUCTURE.md', 'CONVENTIONS.md', 'CONCERNS.md'];
  if (nature === 'implement' || nature === 'fix') docs.push('ARCHITECTURE.md');
  if (/(depend[eê]ncia|vers[aã]o|upgrade|build|pacote|biblioteca)/i.test(draft)) docs.push('STACK.md');
  if (/(\bapi\b|banco|database|credencia|token|integra|servi[cç]o externo|webhook)/i.test(draft)) docs.push('INTEGRATIONS.md');
  if (!readOnly(nature)) docs.push('TESTING.md');
  return docs.map((d) => `docs/codebase/${d}`);
}

/** Acrescenta a consulta a docs/codebase/ depois do objetivo e o fechamento sobre documentos desatualizados. */
function withCodebaseDocs(response: EnhanceResponse, nature: WorkFunction, draft: string, diagnosing: boolean): EnhanceResponse {
  const docs = codebaseDocs(nature, draft).map((d) => `\`${d}\``).join(', ');
  const consult =
    `Antes de agir, leia nesta ordem ${docs}, gerados pela skill \`acquire-codebase-knowledge\`. ` +
    'Siga as convenções e os padrões registrados e trate com cuidado as áreas de CONCERNS.md que a tarefa tocar. ' +
    'Se documento e código divergirem, vale o código: relate a divergência. ' +
    'Se `docs/codebase/` não existir, avise, siga lendo o código e sugira rodar a skill `acquire-codebase-knowledge`.';
  const closing = diagnosing || readOnly(nature)
    ? 'Liste no final os documentos de `docs/codebase/` que ficariam desatualizados.'
    : 'Ao terminar, se a mudança deixou algum documento de `docs/codebase/` desatualizado, atualize só a seção afetada e cite no relato.';
  const prefix = response.prompt.startsWith(ANTIGRAVITY_ROUTE) ? ANTIGRAVITY_ROUTE : '';
  const [first, ...rest] = response.prompt.slice(prefix.length).split('\n\n');
  return {
    ...response,
    status: 'ENHANCED',
    reason: '',
    prompt: prefix + [first, consult, ...rest, closing].join('\n\n'),
    changes: [...response.changes, { change: 'Consulta aos documentos de docs/codebase/', basis: 'configuration' }],
  };
}

function detectFunction(draft: string): WorkFunction {
  for (const [fn, re] of SIGNALS) {
    if (re.test(draft)) {
      return fn;
    }
  }
  return 'implement';
}

function extractLiterals(draft: string): string[] {
  return unique([
    ...(draft.match(ERROR_RE) ?? []),
    ...(draft.match(CODE_RE) ?? []),
    ...(draft.match(FILE_RE) ?? []),
  ].map((s) => s.trim()));
}

function asSentence(draft: string): string {
  const t = draft.replace(/\s+/g, ' ').trim();
  const s = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.?!]$/.test(s) ? s : `${s}.`;
}

function firstSentence(draft: string): string {
  // Sem lookbehind: Safari anterior ao 16.4 não suporta.
  const match = draft.match(/^[\s\S]*?[.?!](?=\s|$)/);
  return match ? match[0] : draft;
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}
