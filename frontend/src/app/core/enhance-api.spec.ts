import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EnhanceFailure, HttpEnhanceApi } from './enhance-api';
import { EnhanceRequest, EnhanceResult, HealthResponse, SkillsReport } from './models';

const request: EnhanceRequest = {
  draft: 'o login quebra depois de um tempo, arruma',
  ide: 'cursor',
  function: 'auto',
  scope: 'minimo',
  autonomy: 'perguntar',
  preserveBehavior: true,
  useSkills: false,
  skillPaths: [],
};

const result: EnhanceResult = {
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
    prompt: 'Prompt.',
  },
  skills: null,
  warnings: [],
  notices: [],
  meta: { source: 'vertex', model: 'm', promptVersion: '1', schemaVersion: '1', latencyMs: 1 },
};

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

async function failureOf(promise: Promise<unknown>): Promise<EnhanceFailure> {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(EnhanceFailure);
    return err as EnhanceFailure;
  }
  throw new Error('Era esperado um erro.');
}

describe('HttpEnhanceApi', () => {
  let api: HttpEnhanceApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), HttpEnhanceApi] });
    api = TestBed.inject(HttpEnhanceApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envia POST /api/enhance com Content-Type application/json e x-zprompt 1 e devolve o corpo', async () => {
    const pending = firstValueFrom(api.enhance(request));
    const req = http.expectOne('/api/enhance');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('x-zprompt')).toBe('1');
    expect(req.request.body).toEqual(request);
    req.flush(result);
    expect(await pending).toEqual(result);
  });

  it('503 VERTEX_NOT_CONFIGURED vira demonstração com as skills do servidor', async () => {
    const pending = firstValueFrom(api.enhance(request));
    http
      .expectOne('/api/enhance')
      .flush({ error: 'Vertex não configurado.', code: 'VERTEX_NOT_CONFIGURED', skills: report, notices: ['n1'] }, { status: 503, statusText: 'Service Unavailable' });
    const demo = await pending;
    expect(demo.meta.source).toBe('demo');
    expect(demo.skills).toEqual(report);
    expect(demo.notices).toEqual(['n1']);
    expect(demo.demoReason).toBe('Vertex não configurado.');
    expect(demo.enhancement.status).toBe('ENHANCED');
  });

  it('404 sem JSON vira SERVER_OFFLINE com a mensagem do proxy', async () => {
    const pending = firstValueFrom(api.enhance(request));
    http.expectOne('/api/enhance').flush('Cannot POST /api/enhance', { status: 404, statusText: 'Not Found' });
    const failure = await failureOf(pending);
    expect(failure.code).toBe('SERVER_OFFLINE');
    expect(failure.message).toBe('A tela não está ligada ao servidor local. Reinicie o ng serve na pasta frontend para carregar o proxy.');
  });

  it('status 0 ou 500 sem JSON vira SERVER_OFFLINE com a mensagem do servidor desligado', async () => {
    const message = 'O servidor local não respondeu. Inicie com npm start na pasta server.';
    const offline = firstValueFrom(api.enhance(request));
    http.expectOne('/api/enhance').error(new ProgressEvent('error'), { status: 0 });
    expect((await failureOf(offline)).message).toBe(message);

    // Proxy do dev-server do Angular 20 (Vite) responde 500 quando o servidor está desligado.
    const proxy500 = firstValueFrom(api.enhance(request));
    http.expectOne('/api/enhance').flush('', { status: 500, statusText: 'Internal Server Error' });
    const failure = await failureOf(proxy500);
    expect(failure.code).toBe('SERVER_OFFLINE');
    expect(failure.message).toBe(message);
  });

  it('502 LINT_FAILED repassa código, mensagem e issues', async () => {
    const pending = firstValueFrom(api.enhance(request));
    http.expectOne('/api/enhance').flush({ error: 'Falhou.', code: 'LINT_FAILED', issues: ['a', 'b'] }, { status: 502, statusText: 'Bad Gateway' });
    const failure = await failureOf(pending);
    expect(failure.code).toBe('LINT_FAILED');
    expect(failure.message).toBe('Falhou.');
    expect(failure.issues).toEqual(['a', 'b']);
  });

  it('health devolve o objeto em 200 e null em erro de rede ou 500', async () => {
    const health: HealthResponse = {
      ok: true,
      projectDir: '/p',
      projectSource: 'teste',
      vertex: { configured: false, reason: 'sem projeto', location: 'global', model: 'm' },
      promptVersion: '1',
      schemaVersion: '1',
    };
    const ok = firstValueFrom(api.health());
    http.expectOne('/api/health').flush(health);
    expect(await ok).toEqual(health);

    const offline = firstValueFrom(api.health());
    http.expectOne('/api/health').error(new ProgressEvent('error'), { status: 0 });
    expect(await offline).toBeNull();

    const proxy500 = firstValueFrom(api.health());
    http.expectOne('/api/health').flush('', { status: 500, statusText: 'Internal Server Error' });
    expect(await proxy500).toBeNull();
  });
});
