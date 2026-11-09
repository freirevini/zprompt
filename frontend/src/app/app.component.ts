import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { EnhanceApi, EnhanceFailure, demoResult } from './core/enhance-api';
import { Autonomy, EnhanceRequest, EnhanceResult, FunctionChoice, HealthResponse, Ide, Scope, SelectedSkill, SkillScope } from './core/models';
import {
  AUTONOMY_HINT,
  AUTONOMY_OPTIONS,
  FUNCTION_HINT,
  FUNCTION_LABEL,
  FUNCTION_OPTIONS,
  IDE_OPTIONS,
  MODE_LABEL,
  PRESERVE_HINT,
  SCOPE_HINT,
  SCOPE_OPTIONS,
} from './core/options';
import { SegmentedComponent } from './ui/segmented.component';

type ViewState = 'idle' | 'loading' | 'done' | 'error';

/** Igual a agent/config/request-schema.json. */
const MAX_DRAFT = 8000;

@Component({
  selector: 'zp-root',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, NgTemplateOutlet, FormsModule, SegmentedComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  readonly ideOptions = IDE_OPTIONS;
  readonly functionOptions = FUNCTION_OPTIONS;
  readonly scopeOptions = SCOPE_OPTIONS;
  readonly autonomyOptions = AUTONOMY_OPTIONS;
  readonly functionLabel = FUNCTION_LABEL;
  readonly modeLabel = MODE_LABEL;
  readonly maxDraft = MAX_DRAFT;
  readonly scopeLabel: Record<SkillScope, string> = { manual: 'pasta informada', project: 'projeto', user: 'usuário', extra: 'pasta extra' };
  readonly modKey = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

  draft = '';
  ide: Ide = 'cursor';
  fn: FunctionChoice = 'auto';
  scope: Scope = 'minimo';
  autonomy: Autonomy = 'perguntar';
  preserveBehavior = true;
  useSkills = false;
  /** Pasta informada pelo usuário para o IDE atual. Vive só nesta sessão da página. */
  manualPath: string | null = null;
  pathFormOpen = false;
  pathDraft = '';

  state: ViewState = 'idle';
  result: EnhanceResult | null = null;
  health: HealthResponse | null = null;
  healthChecked = false;
  sentIde: Ide = 'cursor';
  editedPrompt = '';
  /** O que foi copiado por último: 'prompt', 'skills' ou 'skill:<nome>'. */
  copiedKey: string | null = null;
  copyFailedKey: string | null = null;
  errorTitle = '';
  errorMessage = '';
  errorCode = '';
  errorIssues: string[] = [];
  loadingText = '';

  private lastRequest: EnhanceRequest | null = null;
  private request?: Subscription;
  private healthRequest?: Subscription;
  private copyTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly api: EnhanceApi) {}

  ngOnInit(): void {
    this.refreshHealth();
  }

  get topbarNote(): string {
    if (!this.healthChecked) return '';
    if (!this.health) return 'Servidor local desligado';
    return this.health.vertex.configured ? `${this.health.vertex.model} no Vertex AI` : 'Demonstração: Vertex não configurado';
  }

  get pathPlaceholder(): string {
    return this.ide === 'cursor' ? 'ex.: ~/.cursor/skills ou /caminho/do/projeto/.cursor' : 'ex.: ~/.gemini/skills ou /caminho/do/projeto/.agents';
  }

  get draftTooLong(): boolean {
    return this.draft.length > MAX_DRAFT;
  }

  get showCounter(): boolean {
    return this.draft.length > MAX_DRAFT - 1000;
  }

  get canSubmit(): boolean {
    return this.draft.trim().length > 0 && !this.draftTooLong && this.state !== 'loading';
  }

  get isEdited(): boolean {
    return this.result !== null && this.editedPrompt !== this.result.enhancement.prompt;
  }

  get isDemo(): boolean {
    return this.result?.meta.source === 'demo';
  }

  /** Descrição da função escolhida, com o modo que o IDE vai usar quando ele é fixo. */
  get functionHint(): string {
    const cursor = this.ide === 'cursor';
    const mode: Partial<Record<FunctionChoice, string>> = {
      understand: cursor ? 'Vai no modo Ask.' : '',
      review: cursor ? 'Vai no modo Ask.' : '',
      start: cursor ? 'Envie no Plan Mode.' : 'O prompt começa com /plan /grill-me.',
    };
    // Só diagnosticar troca a rota e o modo; a descrição de Dúvidas cobre isso.
    const suffix = this.autonomy === 'diagnosticar' ? '' : mode[this.fn];
    return [FUNCTION_HINT[this.fn], suffix].filter(Boolean).join(' ');
  }

  get scopeHint(): string {
    return SCOPE_HINT[this.scope];
  }

  get autonomyHint(): string {
    if (this.autonomy !== 'perguntar') return AUTONOMY_HINT[this.autonomy];
    const route = this.ide === 'cursor' ? 'No Cursor, pelo Plan Mode.' : 'No Antigravity, com /plan /grill-me.';
    return `${AUTONOMY_HINT.perguntar} ${route}`;
  }

  get preserveHint(): string {
    return this.preserveBehavior ? PRESERVE_HINT.on : PRESERVE_HINT.off;
  }

  get skillFolders(): string {
    return this.ide === 'cursor' ? '.cursor do projeto e em ~/.cursor' : '.gemini, .agents e .agent do projeto e em ~/.gemini';
  }

  /** Bloco de skills só faz sentido quando houve aprimoramento ou o rascunho já estava pronto. */
  get showSkills(): boolean {
    return this.state === 'done' && !!this.result?.skills && this.result.enhancement.status !== 'INSUFFICIENT';
  }

  get needsPath(): boolean {
    return !!this.result?.skills?.needsPath;
  }

  /** Onde mostrar o pedido da pasta: dentro do bloco de skills, quando ele existe; senão, no topo do resultado. */
  get pathFormPlacement(): 'top' | 'skills' | null {
    if (this.state === 'loading') return null;
    if (this.showSkills && (this.pathFormOpen || this.needsPath)) return 'skills';
    return this.pathFormOpen ? 'top' : null;
  }

  get readRoots(): string[] {
    return this.result?.skills ? this.result.skills.roots.filter((r) => r.exists).map((r) => r.path) : [];
  }

  get liveMessage(): string {
    switch (this.state) {
      case 'loading':
        return this.loadingText;
      case 'error':
        return `${this.errorTitle} ${this.errorMessage}`;
      case 'done': {
        const status = this.result?.enhancement.status;
        if (status === 'UNCHANGED') return 'O rascunho já está pronto para enviar.';
        if (status === 'INSUFFICIENT') return 'O rascunho não descreve uma tarefa.';
        return this.isDemo ? 'Prompt de demonstração pronto.' : 'Prompt aprimorado pronto para copiar.';
      }
      default:
        return '';
    }
  }

  onIde(value: string): void {
    if (value === this.ide) return;
    this.ide = value as Ide;
    // Pasta de skills é de um IDE; não vale para o outro.
    this.manualPath = null;
    this.pathDraft = '';
    this.pathFormOpen = false;
  }

  onFunction(value: string): void {
    this.fn = value as FunctionChoice;
  }

  onScope(value: string): void {
    this.scope = value as Scope;
  }

  onAutonomy(value: string): void {
    this.autonomy = value as Autonomy;
  }

  onDraftKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      this.enhance();
    }
  }

  enhance(): void {
    if (!this.canSubmit) {
      return;
    }
    const request: EnhanceRequest = {
      draft: this.draft,
      ide: this.ide,
      function: this.fn,
      scope: this.scope,
      autonomy: this.autonomy,
      preserveBehavior: this.preserveBehavior,
      useSkills: this.useSkills,
      skillPaths: this.useSkills && this.manualPath ? [this.manualPath] : [],
    };

    this.request?.unsubscribe();
    this.lastRequest = request;
    this.state = 'loading';
    this.loadingText = request.useSkills ? 'Escolhendo as skills e reescrevendo o rascunho.' : 'Reescrevendo o rascunho.';
    this.copiedKey = null;
    this.copyFailedKey = null;
    this.pathFormOpen = false;
    this.sentIde = request.ide;

    this.request = this.api.enhance(request).subscribe({
      next: (result) => this.show(result),
      error: (err: unknown) => {
        const failure = err instanceof EnhanceFailure ? err : null;
        this.errorCode = failure?.code ?? 'UNKNOWN';
        this.errorTitle = this.errorCode === 'LINT_FAILED' ? 'O prompt gerado não passou na validação.' : 'O prompt não foi aprimorado.';
        this.errorMessage = err instanceof Error ? err.message : 'Tente de novo.';
        this.errorIssues = failure?.issues ?? [];
        this.state = 'error';
        this.refreshHealth();
      },
    });
  }

  /** Servidor desligado: simulação local, rotulada, para não perder o teste da interface. */
  runDemo(): void {
    if (this.lastRequest) {
      this.sentIde = this.lastRequest.ide;
      this.show(demoResult(this.lastRequest, null, [], 'O servidor local está desligado.'));
    }
  }

  openPathForm(): void {
    this.pathDraft = this.manualPath ?? '';
    this.pathFormOpen = true;
    // O campo pode já estar na tela (pasta não encontrada) ou surgir agora; nos dois casos recebe o foco.
    setTimeout(() => document.getElementById('skill-path')?.focus());
  }

  closePathForm(): void {
    this.pathFormOpen = false;
  }

  submitPath(): void {
    const path = this.pathDraft.trim();
    if (!path || !this.draft.trim()) {
      return;
    }
    this.manualPath = path;
    this.useSkills = true;
    this.enhance();
  }

  useAutomaticDetection(): void {
    this.manualPath = null;
  }

  continueWithoutSkills(): void {
    this.useSkills = false;
    this.pathFormOpen = false;
    if (this.result) {
      this.result = { ...this.result, skills: null };
    }
  }

  onPromptEdit(value: string): void {
    this.editedPrompt = value;
    this.copiedKey = null;
    this.copyFailedKey = null;
  }

  restorePrompt(): void {
    if (this.result) {
      this.onPromptEdit(this.result.enhancement.prompt);
    }
  }

  copyPrompt(): Promise<void> {
    return this.copyText(this.editedPrompt, 'prompt');
  }

  /** Linha copiável de uma skill: nome, motivo e caminho do SKILL.md. */
  skillLine(skill: SelectedSkill): string {
    return `- \`${skill.name}\`: ${skill.reason} (${skill.path})`;
  }

  copySkills(skills: SelectedSkill[]): Promise<void> {
    return this.copyText(skills.map((s) => this.skillLine(s)).join('\n'), 'skills');
  }

  copySkill(skill: SelectedSkill): Promise<void> {
    return this.copyText(this.skillLine(skill), 'skill:' + skill.name);
  }

  private async copyText(text: string, key: string): Promise<void> {
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      ok = document.execCommand('copy');
      document.body.removeChild(area);
    }
    this.copiedKey = ok ? key : null;
    this.copyFailedKey = ok ? null : key;
    clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => (this.copiedKey = null), 2000);
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    this.healthRequest?.unsubscribe();
    clearTimeout(this.copyTimer);
  }

  private show(result: EnhanceResult): void {
    this.result = result;
    this.editedPrompt = result.enhancement.prompt;
    this.state = 'done';
    this.refreshHealth();
  }

  private refreshHealth(): void {
    this.healthRequest?.unsubscribe();
    this.healthRequest = this.api.health().subscribe((health) => {
      this.health = health;
      this.healthChecked = true;
    });
  }
}
