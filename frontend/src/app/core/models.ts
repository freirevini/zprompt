// Espelha agent/config/request-schema.json, agent/config/response-schema.json e as respostas de server/.

export type Ide = 'cursor' | 'antigravity';
export type TaskFunction = 'understand' | 'start' | 'implement' | 'fix' | 'review' | 'test' | 'keep-codebase-knowledge';
/** Natureza do trabalho. `keep-codebase-knowledge` executa uma delas consultando docs/codebase/. */
export type WorkFunction = Exclude<TaskFunction, 'keep-codebase-knowledge'>;
export type FunctionChoice = 'auto' | TaskFunction;
export type Scope = 'minimo' | 'ambicioso';
export type Autonomy = 'perguntar' | 'decidir' | 'diagnosticar';
export type AgentMode = 'agent' | 'plan' | 'ask';
export type EnhanceStatus = 'ENHANCED' | 'UNCHANGED' | 'INSUFFICIENT';
export type ChangeBasis = 'draft' | 'configuration' | 'function_guide';

/** POST /api/enhance. O servidor escolhe as skills e chama o aprimorador. */
export interface EnhanceRequest {
  draft: string;
  ide: Ide;
  function: FunctionChoice;
  scope: Scope;
  autonomy: Autonomy;
  preserveBehavior: boolean;
  useSkills: boolean;
  /** Pastas informadas pelo usuário quando a detecção automática falha. */
  skillPaths: string[];
}

export interface SkillForPrompt {
  name: string;
  description: string;
  reason: string;
}

/** Entrada da simulação local, usada quando o Vertex não está disponível. */
export interface MockRequest {
  draft: string;
  ide: Ide;
  function: FunctionChoice;
  scope: Scope;
  autonomy: Autonomy;
  preserveBehavior: boolean;
  skills: SkillForPrompt[];
}

export type SkillScope = 'manual' | 'project' | 'user' | 'extra';

export interface SkillRoot {
  scope: SkillScope;
  path: string;
  exists: boolean;
  /** Motivo de a pasta informada ter sido recusada. */
  problem?: string;
}

export interface SelectedSkill {
  name: string;
  description: string;
  path: string;
  scope: SkillScope;
  relevance: 'HIGH' | 'MEDIUM';
  reason: string;
}

export interface SkillsReport {
  projectDir: string;
  projectSource: string;
  manualPaths: boolean;
  roots: SkillRoot[];
  totalSkills: number;
  /** Verdadeiro quando nenhuma pasta ou nenhum SKILL.md foi encontrado: a tela pede o caminho. */
  needsPath: boolean;
  problem: string;
  selector: 'vertex' | 'heuristic' | 'none';
  model?: string;
  selected: SelectedSkill[];
  noneReason: string;
  warnings: string[];
  /** Falha ao ler ou escolher skills. O aprimoramento segue sem skills. */
  error: string;
}

export interface EnhanceChange {
  change: string;
  basis: ChangeBasis;
}

export interface EnhanceResponse {
  status: EnhanceStatus;
  reason: string;
  detectedFunction: TaskFunction;
  functionSource: 'selected' | 'detected';
  intentQuote: string;
  preservedLiterals: string[];
  recommendedMode: AgentMode;
  routedToPlanning: boolean;
  modeInstruction: string;
  changes: EnhanceChange[];
  agentMustDetermine: string[];
  prompt: string;
}

export interface EnhanceMeta {
  source: 'vertex' | 'triage' | 'demo';
  model: string;
  promptVersion: string;
  schemaVersion: string;
  latencyMs: number;
  attempts?: number;
}

/** Resposta de POST /api/enhance. */
export interface EnhanceResult {
  enhancement: EnhanceResponse;
  skills: SkillsReport | null;
  /** Verificações que continuaram falhando depois da nova tentativa. O prompt é entregue mesmo assim. */
  warnings: string[];
  /** Informações do pipeline, como segredos retirados ou skills que não foram lidas. */
  notices: string[];
  meta: EnhanceMeta;
  /** Preenchido quando o resultado veio da simulação local. */
  demoReason?: string;
}

export interface HealthResponse {
  ok: boolean;
  projectDir: string;
  projectSource: string;
  vertex: { configured: boolean; reason: string; location: string; model: string };
  promptVersion: string;
  schemaVersion: string;
}
