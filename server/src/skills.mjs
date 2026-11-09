// Etapa de skills do pipeline: localizar pastas, varrer SKILL.md e escolher as pertinentes.
// Nunca derruba o aprimoramento: falha vira aviso no relatório.
import { manualRoots, skillRoots } from './locate.mjs';
import { scanSkills } from './scan.mjs';
import { selectSkills } from './selector.mjs';

export async function skillsStep({ request, draft, project }, deps = {}) {
  const manual = request.skillPaths.length > 0;
  const base = {
    projectDir: project.dir,
    projectSource: project.source,
    manualPaths: manual,
    roots: [],
    totalSkills: 0,
    needsPath: false,
    problem: '',
    selector: 'none',
    selected: [],
    noneReason: '',
    warnings: [],
    error: '',
  };

  try {
    const roots = manual ? await manualRoots(request.skillPaths, project.dir) : await skillRoots(project.dir, request.ide);
    base.roots = roots;

    if (!roots.some((r) => r.exists)) {
      const rejected = roots.filter((r) => r.problem);
      base.needsPath = true;
      base.problem = rejected.length
        ? rejected.map((r) => `${r.path}: ${r.problem}`).join(' ')
        : manual
          ? `Pasta não encontrada: ${roots.map((r) => r.path).join(', ')}.`
          : `Nenhuma pasta de skills encontrada para ${request.ide}. Procurei em ${roots.map((r) => r.path).join(', ')}.`;
      return base;
    }

    const { skills, warnings } = await scanSkills(roots, deps.scanLimits);
    base.warnings = warnings;
    base.totalSkills = skills.length;
    if (skills.length === 0) {
      base.needsPath = true;
      base.problem = `Nenhum SKILL.md encontrado em ${roots.filter((r) => r.exists).map((r) => r.path).join(', ')}.`;
      return base;
    }

    const result = await selectSkills(
      { draft, ide: request.ide, fn: request.function, autonomy: request.autonomy, skills },
      deps.selector,
    );
    return { ...base, ...result };
  } catch (err) {
    return { ...base, error: `As skills não foram avaliadas: ${err.message}` };
  }
}
