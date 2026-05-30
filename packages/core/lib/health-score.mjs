/**
 * Health score 0–100 por categorias (heurística V1).
 */
const CATEGORIES = [
  { id: 'testes', weight: 20, ok: (p) => p.summary?.hasTestsSignal && !p.summary?.gapNoTestScript },
  { id: 'ci_cd', weight: 15, ok: (p) => p.summary?.hasCi },
  { id: 'dx', weight: 10, ok: (p) => p.summary?.hasCursorRules },
  { id: 'estrutura', weight: 15, ok: (p) => (p.signals || []).some((s) => s.id === 'structure_src' || s.id === 'structure_packages') },
  { id: 'documentacao', weight: 10, ok: (p) => (p.signals || []).some((s) => s.id === 'has_readme') },
  { id: 'stack_declarada', weight: 10, ok: (p) => (p.summary?.frameworks || []).length > 0 },
  { id: 'dependencias', weight: 10, ok: (p) => {
    const all = p.stack?.allDependencies?.length || 0
    const d = p.stack?.dependencies?.length || 0
    const dd = p.stack?.devDependencies?.length || 0
    const hasWorkspacePkgs = (p.signals || []).some((s) => s.id === 'has_workspace_packages')
    return all > 0 || d + dd > 0 || p.python || hasWorkspacePkgs
  }},
  { id: 'scripts', weight: 10, ok: (p) => Object.keys(p.stack?.scripts || {}).length >= 2 },
]

export function computeHealthScore(profile) {
  const categories = CATEGORIES.map((c) => {
    const pass = c.ok(profile)
    return {
      id: c.id,
      weight: c.weight,
      score: pass ? c.weight : 0,
      status: pass ? 'ok' : 'gap',
    }
  })
  const total = categories.reduce((s, c) => s + c.score, 0)
  const max = categories.reduce((s, c) => s + c.weight, 0)
  const overall = max > 0 ? Math.round((total / max) * 100) : 0
  let grade = 'C'
  if (overall >= 85) grade = 'A'
  else if (overall >= 70) grade = 'B'
  else if (overall >= 50) grade = 'C'
  else grade = 'D'

  return {
    overall,
    grade,
    categories,
    summary: `${overall}/100 (${grade})`,
  }
}
