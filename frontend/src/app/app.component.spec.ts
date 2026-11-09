import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppComponent } from './app.component';
import { EnhanceApi, EnhanceFailure } from './core/enhance-api';
import { EnhanceRequest, EnhanceResponse, EnhanceResult, HealthResponse, SkillsReport } from './core/models';

function enhanced(overrides: Partial<EnhanceResult> = {}, enhancement: Partial<EnhanceResponse> = {}): EnhanceResult {
  return {
    enhancement: {
      status: 'ENHANCED',
      reason: '',
      detectedFunction: 'fix',
      functionSource: 'detected',
      intentQuote: 'o login quebra',
      preservedLiterals: [],
      recommendedMode: 'agent',
      routedToPlanning: false,
      modeInstruction: '',
      changes: [],
      agentMustDetermine: [],
      prompt: 'Prompt aprimorado.',
      ...enhancement,
    },
    skills: null,
    warnings: [],
    notices: [],
    meta: { source: 'vertex', model: 'm', promptVersion: '1', schemaVersion: '1', latencyMs: 1 },
    ...overrides,
  };
}

function health(configured: boolean): HealthResponse {
  return {
    ok: true,
    projectDir: '/p',
    projectSource: 'teste',
    vertex: { configured, reason: '', location: 'global', model: 'gemini-x' },
    promptVersion: '1',
    schemaVersion: '1',
  };
}

const report: SkillsReport = {
  projectDir: '/p',
  projectSource: 'teste',
  manualPaths: false,
  roots: [],
  totalSkills: 0,
  needsPath: false,
  problem: '',
  selector: 'heuristic',
  selected: [],
  noneReason: 'nenhuma',
  warnings: [],
  error: '',
};

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;
  let el: HTMLElement;
  let fakeApi: {
    enhance: ReturnType<typeof vi.fn<(request: EnhanceRequest) => Observable<EnhanceResult>>>;
    health: ReturnType<typeof vi.fn<() => Observable<HealthResponse | null>>>;
  };
  let writeText: ReturnType<typeof vi.fn>;

  const render = () => fixture.detectChanges();
  const buttonByText = (text: string) => Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);

  beforeEach(() => {
    fakeApi = {
      enhance: vi.fn<(request: EnhanceRequest) => Observable<EnhanceResult>>(() => of(enhanced())),
      health: vi.fn<() => Observable<HealthResponse | null>>(() => of(null)),
    };
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    document.execCommand = vi.fn(() => true);
    TestBed.configureTestingModule({ imports: [AppComponent], providers: [{ provide: EnhanceApi, useValue: fakeApi }] });
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    render();
  });

  afterEach(() => vi.useRealTimers());

  it('inicia em idle, consulta health e mostra "Servidor local desligado" quando health é null', () => {
    expect(fakeApi.health).toHaveBeenCalledTimes(1);
    expect(app.state).toBe('idle');
    expect(app.topbarNote).toBe('Servidor local desligado');
    expect(el.querySelector('.topbar__note')?.textContent?.trim()).toBe('Servidor local desligado');
    expect(el.querySelector('.empty__lead')).not.toBeNull();
  });

  it('topbar reflete o estado do Vertex', () => {
    app.health = health(true);
    expect(app.topbarNote).toBe('gemini-x no Vertex AI');
    app.health = health(false);
    expect(app.topbarNote).toBe('Demonstração: Vertex não configurado');
  });

  it('canSubmit e contador respeitam 8000 caracteres', () => {
    app.draft = '';
    expect(app.canSubmit).toBe(false);

    app.draft = 'a'.repeat(7001);
    expect(app.showCounter).toBe(true);
    expect(app.canSubmit).toBe(true);

    app.draft = 'a'.repeat(8001);
    render();
    expect(app.draftTooLong).toBe(true);
    expect(app.canSubmit).toBe(false);
    expect(el.querySelector<HTMLButtonElement>('.submit .btn--primary')?.disabled).toBe(true);
    expect(el.querySelector('.draft--over')).not.toBeNull();
    expect(el.querySelector('#draft-count')?.textContent?.trim()).toBe('8001 de 8000 caracteres. Encurte o rascunho para aprimorar.');
    app.onDraftKeydown(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }));
    expect(fakeApi.enhance).not.toHaveBeenCalled();
  });

  it('Cmd+Enter envia e Enter simples não', () => {
    app.draft = 'arruma o login';
    app.onDraftKeydown(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }));
    expect(fakeApi.enhance).toHaveBeenCalledTimes(1);
    app.onDraftKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(fakeApi.enhance).toHaveBeenCalledTimes(1);
  });

  it('envia skillPaths só com useSkills e pasta manual', () => {
    app.draft = 'arruma o login';
    app.useSkills = true;
    app.manualPath = '~/.cursor';
    app.enhance();
    expect(fakeApi.enhance).toHaveBeenLastCalledWith(expect.objectContaining({ useSkills: true, skillPaths: ['~/.cursor'] }));

    app.useSkills = false;
    app.enhance();
    expect(fakeApi.enhance).toHaveBeenLastCalledWith(expect.objectContaining({ useSkills: false, skillPaths: [] }));
  });

  it('resultado ENHANCED preenche o editor e permite desfazer edição', () => {
    app.draft = 'arruma o login';
    app.enhance();
    render();
    expect(app.state).toBe('done');
    expect(app.editedPrompt).toBe('Prompt aprimorado.');
    expect(app.isEdited).toBe(false);

    app.onPromptEdit('x');
    render();
    expect(app.isEdited).toBe(true);
    expect(buttonByText('Desfazer edições')).toBeDefined();

    app.restorePrompt();
    render();
    expect(app.isEdited).toBe(false);
    expect(buttonByText('Desfazer edições')).toBeUndefined();
  });

  it('SERVER_OFFLINE mostra o erro, oferece a demonstração e runDemo marca a origem demo', () => {
    fakeApi.enhance.mockReturnValue(throwError(() => new EnhanceFailure('m', 'SERVER_OFFLINE')));
    app.draft = 'arruma o login';
    app.enhance();
    render();
    expect(app.state).toBe('error');
    expect(app.errorTitle).toBe('O prompt não foi aprimorado.');
    expect(app.errorMessage).toBe('m');
    expect(buttonByText('Ver demonstração sem servidor')).toBeDefined();
    expect(fakeApi.health).toHaveBeenCalledTimes(2);

    app.runDemo();
    render();
    expect(app.state).toBe('done');
    expect(app.isDemo).toBe(true);
    expect(app.result?.demoReason).toBe('O servidor local está desligado.');
  });

  it('LINT_FAILED mostra título próprio e issues', () => {
    fakeApi.enhance.mockReturnValue(throwError(() => new EnhanceFailure('m', 'LINT_FAILED', ['i1', 'i2'])));
    app.draft = 'arruma o login';
    app.enhance();
    render();
    expect(app.errorTitle).toBe('O prompt gerado não passou na validação.');
    expect(app.errorMessage).toBe('m');
    expect(el.querySelectorAll('.notice--error .issues li')).toHaveLength(2);
    expect(buttonByText('Ver demonstração sem servidor')).toBeUndefined();
  });

  it('trocar de IDE limpa pasta manual e formulário; repetir o IDE não limpa', () => {
    app.manualPath = 'p';
    app.pathDraft = 'p';
    app.pathFormOpen = true;
    app.onIde('antigravity');
    expect(app.manualPath).toBeNull();
    expect(app.pathDraft).toBe('');
    expect(app.pathFormOpen).toBe(false);

    app.manualPath = 'p';
    app.onIde('antigravity');
    expect(app.manualPath).toBe('p');
  });

  it('needsPath abre o formulário no bloco de skills e "Seguir sem skills" remove o bloco', () => {
    fakeApi.enhance.mockReturnValue(of(enhanced({ skills: { ...report, needsPath: true, problem: 'não achei' } })));
    app.draft = 'arruma o login';
    app.useSkills = true;
    app.enhance();
    render();
    expect(app.pathFormPlacement).toBe('skills');
    const form = el.querySelector('.details .path-form');
    expect(form).not.toBeNull();
    expect(form?.querySelector('.notice__title')?.textContent?.trim()).toBe('Não encontrei as skills.');
    expect(form?.textContent).toContain('não achei');

    app.continueWithoutSkills();
    render();
    expect(app.result?.skills).toBeNull();
    expect(app.useSkills).toBe(false);
    expect(app.showSkills).toBe(false);
    expect(el.querySelector('.path-form')).toBeNull();
    expect(app.editedPrompt).toBe('Prompt aprimorado.');
  });

  it('warnings e notices repetidos renderizam todos os itens', () => {
    fakeApi.enhance.mockReturnValue(of(enhanced({ warnings: ['w', 'w'], notices: ['n', 'n'] })));
    app.draft = 'arruma o login';
    app.enhance();
    expect(() => render()).not.toThrow();
    expect(el.querySelectorAll('.checks .issues li')).toHaveLength(2);
    expect(el.querySelectorAll('.notes li')).toHaveLength(2);
  });

  it('copiar usa a clipboard, mostra "Copiado" por 2 s e cai no fallback quando falha', async () => {
    vi.useFakeTimers();
    app.draft = 'arruma o login';
    app.enhance();
    render();

    await app.copyPrompt();
    render();
    expect(writeText).toHaveBeenCalledWith('Prompt aprimorado.');
    expect(app.copiedKey).toBe('prompt');
    expect(buttonByText('Copiado')).toBeDefined();
    vi.advanceTimersByTime(2000);
    expect(app.copiedKey).toBeNull();

    writeText.mockRejectedValue(new Error('negado'));
    document.execCommand = vi.fn(() => false);
    await app.copyPrompt();
    render();
    expect(app.copyFailedKey).toBe('prompt');
    expect(el.querySelector('.copy-fail')).not.toBeNull();
  });

  it('liveMessage por estado', () => {
    app.draft = 'arruma o login';
    fakeApi.enhance.mockReturnValue(of(enhanced({}, { status: 'UNCHANGED' })));
    app.enhance();
    expect(app.liveMessage).toBe('O rascunho já está pronto para enviar.');

    fakeApi.enhance.mockReturnValue(of(enhanced({}, { status: 'INSUFFICIENT' })));
    app.enhance();
    expect(app.liveMessage).toBe('O rascunho não descreve uma tarefa.');

    fakeApi.enhance.mockReturnValue(of(enhanced({ meta: { source: 'demo', model: '', promptVersion: '', schemaVersion: '', latencyMs: 0 } })));
    app.enhance();
    expect(app.liveMessage).toBe('Prompt de demonstração pronto.');

    fakeApi.enhance.mockReturnValue(of(enhanced()));
    app.enhance();
    expect(app.liveMessage).toBe('Prompt aprimorado pronto para copiar.');

    fakeApi.enhance.mockReturnValue(new Observable<EnhanceResult>());
    app.enhance();
    expect(app.state).toBe('loading');
    expect(app.liveMessage).toBe('Reescrevendo o rascunho.');
  });
});
