// Proxy do ng serve para o servidor local. Porta: ZPROMPT_API_PORT do ambiente ou do .env da raiz.
const { existsSync, readFileSync } = require('fs');
const path = require('path');

function portFromEnvFile() {
  const file = path.join(__dirname, '..', '.env');
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^export\s+/, ''))
    .find((l) => l.startsWith('ZPROMPT_API_PORT='));
  return line ? line.slice('ZPROMPT_API_PORT='.length).replace(/["']/g, '').replace(/\s+#.*$/, '').trim() : undefined;
}

const port = process.env.ZPROMPT_API_PORT || portFromEnvFile() || '4300';

module.exports = {
  '/api': {
    target: `http://127.0.0.1:${port}`,
    secure: false,
    changeOrigin: true,
    logLevel: 'warn',
  },
};
