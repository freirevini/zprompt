import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';

import { buildMockResponse } from './mock-enhancer';
import { EnhanceRequest, EnhanceResult, HealthResponse, SkillsReport } from './models';

/** Porta de saída do frontend: o servidor local faz todo o pipeline. */
export abstract class EnhanceApi {
  abstract enhance(request: EnhanceRequest): Observable<EnhanceResult>;
  abstract health(): Observable<HealthResponse | null>;
}

/** Erro com código estável do servidor, para a tela escolher a mensagem e a ação. */
export class EnhanceFailure extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly issues: string[] = [],
  ) {
    super(message);
  }
}

interface ServerError {
  error?: string;
  code?: string;
  skills?: SkillsReport | null;
  notices?: string[];
  issues?: string[];
}

// Cabeçalho próprio: obriga o navegador a pedir permissão antes, o que barra páginas de outros sites.
const HEADERS = new HttpHeaders({ 'Content-Type': 'application/json', 'x-zprompt': '1' });

@Injectable()
export class HttpEnhanceApi extends EnhanceApi {
  private readonly http = inject(HttpClient);

  override enhance(request: EnhanceRequest): Observable<EnhanceResult> {
    return this.http.post<EnhanceResult>('/api/enhance', request, { headers: HEADERS }).pipe(
      catchError((err: unknown) => {
        const body = err instanceof HttpErrorResponse && err.error && typeof err.error === 'object' ? (err.error as ServerError) : null;
        // Vertex não configurado: o servidor já leu as skills; a simulação local completa o resultado.
        if (body?.code === 'VERTEX_NOT_CONFIGURED') {
          return of(demoResult(request, body.skills ?? null, body.notices ?? [], body.error ?? ''));
        }
        return throwError(() => failureFrom(err, body));
      }),
    );
  }

  override health(): Observable<HealthResponse | null> {
    return this.http.get<HealthResponse>('/api/health').pipe(catchError(() => of(null)));
  }
}

/** Resultado da simulação local, rotulado como demonstração. */
export function demoResult(request: EnhanceRequest, skills: SkillsReport | null, notices: string[], reason: string): EnhanceResult {
  const selected = skills?.selected ?? [];
  const enhancement = buildMockResponse({
    draft: request.draft,
    ide: request.ide,
    function: request.function,
    scope: request.scope,
    autonomy: request.autonomy,
    preserveBehavior: request.preserveBehavior,
    skills: selected.map((s) => ({ name: s.name, description: s.description, reason: s.reason })),
  });
  return {
    enhancement,
    skills,
    warnings: [],
    notices,
    meta: { source: 'demo', model: '', promptVersion: '', schemaVersion: '', latencyMs: 0 },
    demoReason: reason,
  };
}

function failureFrom(err: unknown, body: ServerError | null): EnhanceFailure {
  // Sem corpo JSON do nosso servidor: a resposta veio do ng serve, não do servidor local.
  if (err instanceof HttpErrorResponse && !body?.code) {
    if (err.status === 404) {
      return new EnhanceFailure('A tela não está ligada ao servidor local. Reinicie o ng serve na pasta frontend para carregar o proxy.', 'SERVER_OFFLINE');
    }
    if (err.status === 0 || err.status >= 500) {
      return new EnhanceFailure('O servidor local não respondeu. Inicie com npm start na pasta server.', 'SERVER_OFFLINE');
    }
  }
  const code = body?.code ?? 'UNKNOWN';
  const message = body?.error ?? 'Tente de novo.';
  return new EnhanceFailure(message, code, body?.issues ?? []);
}
