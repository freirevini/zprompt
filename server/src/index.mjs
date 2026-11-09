import { createServer } from 'node:http';

import { loadEnv } from './env.mjs';

loadEnv();

const { HttpError, checkRequest, cors, readJson, send } = await import('./http.mjs');
const { resolveProjectDir, skillRoots } = await import('./locate.mjs');
const { scanSkills } = await import('./scan.mjs');
const { validateEnhanceRequest } = await import('./request.mjs');
const { EnhanceError, enhance, enhancerConfig, enhancerModelId } = await import('./enhancer.mjs');
const { VertexError, vertexStatus } = await import('./vertex.mjs');

const HOST = '127.0.0.1'; // só local: o servidor lê pastas do seu computador
const PORT = Number(process.env.ZPROMPT_API_PORT || 4300);

const project = await resolveProjectDir();

// Código do Vertex → status HTTP e código estável para a tela.
const VERTEX_STATUS = {
  NOT_CONFIGURED: [503, 'VERTEX_NOT_CONFIGURED'],
  AUTH: [503, 'VERTEX_AUTH'],
  MODEL_NOT_FOUND: [502, 'VERTEX_MODEL_NOT_FOUND'],
  BAD_REQUEST: [502, 'VERTEX_BAD_REQUEST'],
  BLOCKED: [422, 'VERTEX_BLOCKED'],
  RATE_LIMIT: [429, 'VERTEX_RATE_LIMIT'],
  TIMEOUT: [504, 'VERTEX_TIMEOUT'],
};

const server = createServer(async (req, res) => {
  cors(req, res);
  const rejected = checkRequest(req, PORT);
  if (rejected) {
    req.resume();
    return send(res, rejected.status, { error: rejected.error, code: 'FORBIDDEN' });
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  try {
    const url = new URL(req.url ?? '/', `http://${HOST}:${PORT}`);

    if (req.method === 'GET' && url.pathname === '/api/health') {
      const vertex = await vertexStatus({ refresh: url.searchParams.has('refresh') });
      return send(res, 200, {
        ok: true,
        projectDir: project.dir,
        projectSource: project.source,
        vertex: { configured: vertex.configured, reason: vertex.reason, location: vertex.location, model: enhancerModelId() },
        promptVersion: enhancerConfig.promptVersion,
        schemaVersion: enhancerConfig.schemaVersion,
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/skills') {
      const ide = url.searchParams.get('ide') ?? 'cursor';
      if (ide !== 'cursor' && ide !== 'antigravity') return send(res, 400, { error: 'ide deve ser cursor ou antigravity.' });
      const roots = await skillRoots(project.dir, ide);
      const { skills, warnings, truncated } = await scanSkills(roots);
      return send(res, 200, { projectDir: project.dir, projectSource: project.source, roots, totalSkills: skills.length, skills, warnings, truncated });
    }

    if (req.method === 'POST' && url.pathname === '/api/enhance') {
      const body = await readJson(req);
      const { value, problem } = validateEnhanceRequest(body);
      if (problem) return send(res, 400, { error: problem, code: 'INVALID_REQUEST' });
      const result = await enhance(value, { project });
      return send(res, 200, result);
    }

    send(res, 404, { error: 'Rota não encontrada.', code: 'NOT_FOUND' });
  } catch (err) {
    if (err instanceof HttpError) {
      return send(res, err.status, { error: err.message, code: 'INVALID_REQUEST' });
    }
    if (err instanceof EnhanceError) {
      return send(res, err.status, { error: err.message, code: err.code, skills: err.skills ?? null, notices: err.notices ?? [], issues: err.issues ?? [] });
    }
    if (err instanceof VertexError) {
      const [status, code] = VERTEX_STATUS[err.code] ?? [502, 'VERTEX_ERROR'];
      return send(res, status, { error: err.message, code });
    }
    console.error(err);
    send(res, 500, { error: err instanceof Error ? err.message : 'Erro interno.', code: 'INTERNAL' });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`A porta ${PORT} já está em uso. Feche o outro processo ou defina ZPROMPT_API_PORT no .env da raiz.`);
  } else {
    console.error(`O servidor não iniciou: ${err.message}`);
  }
  process.exit(1);
});

server.listen(PORT, HOST, async () => {
  const vertex = await vertexStatus();
  console.log(`zprompt server em http://${HOST}:${PORT}`);
  console.log(`Projeto: ${project.dir} (${project.source})`);
  console.log(
    vertex.configured
      ? `Vertex AI: ${enhancerModelId()} em ${vertex.location}`
      : `Vertex AI indisponível: ${vertex.reason} A tela usa o modo de demonstração.`,
  );
});
