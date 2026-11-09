// Proteções do servidor local. Ele lê pastas do computador e gasta cota do Vertex,
// então só atende a própria máquina e páginas servidas em localhost.

export const CLIENT_HEADER = 'x-zprompt';
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;
const MAX_BODY_BYTES = 1_000_000;

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

/**
 * Recusa pedidos que não vieram da própria máquina:
 * - Host diferente de 127.0.0.1 ou localhost na porta do servidor (redirecionamento de DNS);
 * - Origin de fora de localhost (página de outro site);
 * - POST sem Content-Type JSON ou sem o cabeçalho próprio, que obriga o navegador a pedir permissão antes.
 * Devolve null quando o pedido pode seguir, ou { status, error }.
 */
export function checkRequest({ method, headers }, port) {
  const host = String(headers.host ?? '').toLowerCase();
  const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`]);
  if (!allowedHosts.has(host)) {
    return { status: 403, error: 'Host não permitido. O servidor só atende 127.0.0.1 e localhost.' };
  }
  const origin = headers.origin;
  if (origin && !LOCAL_ORIGIN.test(origin)) {
    return { status: 403, error: 'Origem não permitida. Use a tela servida em localhost.' };
  }
  if (method === 'POST') {
    const type = String(headers['content-type'] ?? '').toLowerCase();
    if (!type.startsWith('application/json')) {
      return { status: 415, error: 'Envie o corpo como application/json.' };
    }
    if (headers[CLIENT_HEADER] !== '1') {
      return { status: 403, error: `Cabeçalho ${CLIENT_HEADER} ausente.` };
    }
  }
  return null;
}

export function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && LOCAL_ORIGIN.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', `Content-Type, ${CLIENT_HEADER}`);
    res.setHeader('Vary', 'Origin');
  }
}

/** Lê o corpo JSON. Corpo grande demais: 413. JSON malformado: 400. */
export function readJson(req, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] ?? 0);
    if (declared > limit) {
      reject(new HttpError(413, 'Corpo maior que 1 MB.'));
      req.resume();
      return;
    }
    let size = 0;
    let failed = false;
    const chunks = [];
    req.on('data', (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > limit) {
        failed = true;
        reject(new HttpError(413, 'Corpo maior que 1 MB.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (failed) return;
      if (!chunks.length) {
        reject(new HttpError(400, 'Corpo JSON ausente.'));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

export function send(res, status, data) {
  if (res.headersSent) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
