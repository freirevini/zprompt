// Diagnóstico: mostra a pasta de projeto detectada e todas as skills encontradas.
// Uso: npm run skills -- cursor   |   npm run skills -- antigravity
import { loadEnv } from './env.mjs';

loadEnv();

const { resolveProjectDir, skillRoots } = await import('./locate.mjs');
const { scanSkills } = await import('./scan.mjs');

const ide = process.argv[2] ?? 'cursor';
const project = await resolveProjectDir();
const roots = await skillRoots(project.dir, ide);
const { skills, warnings: errors } = await scanSkills(roots);

console.log(`Projeto: ${project.dir} (${project.source})`);
for (const root of roots) {
  console.log(`  ${root.exists ? 'lida   ' : 'ausente'} ${root.scope.padEnd(7)} ${root.path}`);
}
console.log(`\n${skills.length} skills para ${ide}:`);
for (const skill of skills) {
  console.log(`  [${skill.scope}] ${skill.name}  ${skill.path}`);
}
if (errors.length) {
  console.log(`\n${errors.length} avisos de leitura:`);
  for (const e of errors) console.log(`  ${e}`);
}
