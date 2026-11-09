import { AgentMode, Autonomy, ChangeBasis, FunctionChoice, Scope, TaskFunction } from './models';

export interface Option {
  value: string;
  label: string;
}

export const IDE_OPTIONS: Option[] = [
  { value: 'cursor', label: 'Cursor' },
  { value: 'antigravity', label: 'Antigravity' },
];

export const FUNCTION_OPTIONS: Option[] = [
  { value: 'auto', label: 'Detectar' },
  { value: 'understand', label: 'Entender' },
  { value: 'start', label: 'Iniciar projeto' },
  { value: 'implement', label: 'Implementar' },
  { value: 'fix', label: 'Corrigir erro' },
  { value: 'review', label: 'Revisar' },
  { value: 'test', label: 'Testar' },
  { value: 'keep-codebase-knowledge', label: 'keep-codebase-knowledge' },
];

export const SCOPE_OPTIONS: Option[] = [
  { value: 'minimo', label: 'Mínimo' },
  { value: 'ambicioso', label: 'Completo' },
];

export const AUTONOMY_OPTIONS: Option[] = [
  { value: 'perguntar', label: 'Perguntar antes' },
  { value: 'decidir', label: 'Decidir e seguir' },
  { value: 'diagnosticar', label: 'Só diagnosticar' },
];

export const FUNCTION_LABEL: Record<TaskFunction, string> = {
  understand: 'Entender',
  start: 'Iniciar projeto',
  implement: 'Implementar',
  fix: 'Corrigir erro',
  review: 'Revisar',
  test: 'Testar',
  'keep-codebase-knowledge': 'keep-codebase-knowledge',
};

// Descrições exibidas abaixo de cada seleção. Espelham agent/prompts/system-instruction.md:
// mudou o comportamento de uma opção lá, ajuste o texto aqui.
export const FUNCTION_HINT: Record<FunctionChoice, string> = {
  auto: 'O aprimorador identifica pelo rascunho se a tarefa é entender, iniciar projeto, implementar, corrigir, revisar ou testar, e escreve o prompt no formato dessa função.',
  understand:
    'Para entender ou retomar código. O agente mapeia módulos e como se conectam, convenções e como rodar e testar, citando caminhos reais. Não edita arquivos.',
  start:
    'Para projeto do zero. O agente planeja antes de criar arquivos e levanta com você stack, hospedagem e o que entra na primeira versão, sem sugerir valores. Entrega estrutura, execução local, um teste passando e o arquivo de instruções do agente.',
  implement:
    'Para funcionalidade nova ou mudança de comportamento. O agente localiza onde a mudança entra, segue o padrão de código mais parecido, não acrescenta dependências e roda os testes, incluindo um para o novo comportamento.',
  fix: 'Para erro ou falha. O agente reproduz antes de corrigir, confirma a causa com evidência, corrige na causa e não no sintoma, e prova com um teste que falha antes e passa depois. Mensagens de erro vão exatamente como você escreveu.',
  review:
    'Para revisar mudanças antes do PR. O agente aponta corretude, regressões, segurança e testes faltando, ignora estilo e lista até 10 achados com arquivo, linha e severidade, fechando com um veredito. Não edita arquivos.',
  test: 'Para escrever ou ampliar testes. O agente segue framework, pasta e nomes já usados no projeto, testa comportamento e não implementação, roda e mostra a saída.',
  'keep-codebase-knowledge':
    'Executa a tarefa do rascunho depois de ler os documentos de docs/codebase/, gerados pela skill acquire-codebase-knowledge, seguindo as convenções e a arquitetura registradas. Se documento e código divergirem, vale o código. Ao terminar, atualiza o documento que ficou desatualizado.',
};

export const SCOPE_HINT: Record<Scope, string> = {
  minimo: 'O agente faz só o que foi pedido: nada de mudanças extras nem de abstrações para casos hipotéticos.',
  ambicioso: 'O agente entrega a solução completa, cobrindo também estados vazio, de erro e de carregamento quando houver interface.',
};

export const AUTONOMY_HINT: Record<Autonomy, string> = {
  perguntar:
    'Se faltar onde mexer ou o que não tocar, ou se houver decisão de arquitetura, o prompt abre o planejamento do IDE para o agente tirar as dúvidas com você antes de editar.',
  decidir:
    'O agente decide sozinho os detalhes técnicos e lista as suposições no relatório final. O planejamento só abre em projeto novo ou quando falta saber onde mexer.',
  diagnosticar:
    'O agente só investiga e entrega um relatório para sua aprovação: diagnóstico, ajustes passo a passo, como verificar e um prompt pronto para outro modelo implementar. Nada no projeto é alterado.',
};

export const PRESERVE_HINT = {
  on: 'Ao implementar, corrigir ou testar, o agente mantém tudo o que está fora do pedido funcionando como antes. Em Só diagnosticar, ajustes que mudam comportamento vão para sua aprovação.',
  off: 'O agente pode mudar comportamento existente quando o pedido exigir. Em Só diagnosticar, cada mudança de comportamento aparece nos riscos do relatório.',
};

export const MODE_LABEL: Record<AgentMode, string> = {
  agent: 'Agent',
  plan: 'Plan',
  ask: 'Ask',
};

export const BASIS_LABEL: Record<ChangeBasis, string> = {
  draft: 'do rascunho',
  configuration: 'da configuração',
  function_guide: 'do guia da função',
};
