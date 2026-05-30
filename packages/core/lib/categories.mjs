/**
 * 12 categorias PRD Max Stack + analisadores por papel
 */
import { createFinding, resetFindingSeq } from './findings.mjs'

const signalSet = (profile) => new Set((profile.signals || []).map((s) => s.id))

export const CATEGORY_DEFS = [
  { id: 'documentacao_onboarding', weight: 8, label: 'Documentação e onboarding' },
  { id: 'estrutura_projeto', weight: 9, label: 'Estrutura do projeto' },
  { id: 'arquitetura_modularidade', weight: 9, label: 'Arquitetura e modularidade' },
  { id: 'qualidade_codigo', weight: 8, label: 'Qualidade de código' },
  { id: 'testes', weight: 10, label: 'Testes' },
  { id: 'ci_cd', weight: 9, label: 'CI/CD' },
  { id: 'seguranca', weight: 9, label: 'Segurança' },
  { id: 'dependencias', weight: 8, label: 'Dependências' },
  { id: 'performance', weight: 7, label: 'Performance' },
  { id: 'developer_experience', weight: 8, label: 'Developer experience' },
  { id: 'governanca_repositorio', weight: 7, label: 'Governança do repositório' },
  { id: 'maturidade_operacional', weight: 8, label: 'Maturidade operacional' },
]

export function analyzeCategories(profile) {
  resetFindingSeq(0)
  const signals = signalSet(profile)
  const findings = []

  findings.push(...runRepoScout(profile, signals))
  findings.push(...runArchitectureAuditor(profile, signals))
  findings.push(...runSecurityAuditor(profile, signals))
  findings.push(...runPerformanceReviewer(profile, signals))

  const categories = CATEGORY_DEFS.map((def) => {
    const catFindings = findings.filter((f) => f.category === def.id)
    const gaps = catFindings.filter((f) => f.findingType !== 'confirmed' || f.severity !== 'low')
    const pass = gaps.length === 0 && categoryHasBaseline(def.id, profile, signals)
    return {
      id: def.id,
      label: def.label,
      weight: def.weight,
      score: pass ? def.weight : Math.max(0, def.weight - Math.min(def.weight, gaps.length * 3)),
      status: pass ? 'ok' : 'gap',
      findingCount: catFindings.length,
    }
  })

  const total = categories.reduce((s, c) => s + c.score, 0)
  const max = categories.reduce((s, c) => s + c.weight, 0)
  const overall = max > 0 ? Math.round((total / max) * 100) : 0
  let grade = 'D'
  if (overall >= 85) grade = 'A'
  else if (overall >= 70) grade = 'B'
  else if (overall >= 50) grade = 'C'

  return {
    overall,
    grade,
    categories,
    summary: `${overall}/100 (${grade})`,
    findings,
  }
}

function categoryHasBaseline(id, profile, signals) {
  const map = {
    documentacao_onboarding: () => signals.has('has_readme'),
    estrutura_projeto: () => signals.has('structure_src') || signals.has('structure_packages'),
    arquitetura_modularidade: () => signals.has('structure_src') || signals.has('structure_packages'),
    qualidade_codigo: () => signals.has('has_eslint') || signals.has('has_typescript'),
    testes: () => signals.has('has_tests_or_validar') && !signals.has('gap_no_test_script'),
    ci_cd: () => signals.has('has_ci'),
    seguranca: () => signals.has('has_security_md') || signals.has('has_dependabot'),
    dependencias: () =>
      (profile.stack?.allDependencies?.length || 0) > 0 ||
      signals.has('has_workspace_packages') ||
      Boolean(profile.python),
    performance: () => signals.has('has_build_script'),
    developer_experience: () => signals.has('has_cursor_rules') || signals.has('has_editorconfig'),
    governanca_repositorio: () => signals.has('has_license') || signals.has('has_contributing'),
    maturidade_operacional: () => signals.has('has_docker') || signals.has('has_ci'),
  }
  return map[id]?.() ?? false
}

function runRepoScout(profile, signals) {
  const out = []
  if (!signals.has('has_readme')) {
    out.push(
      createFinding({
        category: 'documentacao_onboarding',
        title: 'README ausente',
        findingType: 'confirmed',
        severity: 'high',
        justification: 'Repositório sem README.md na raiz',
        evidence: ['missing:README.md'],
        affectedAreas: ['README.md'],
        impact: 'alto',
        effort: 'baixo',
        priority: 1,
        sourceRole: 'Repo Scout',
      }),
    )
  }
  if (!signals.has('structure_src') && !signals.has('structure_packages')) {
    out.push(
      createFinding({
        category: 'estrutura_projeto',
        title: 'Estrutura src/ ou packages/ não detectada',
        findingType: 'hypothesis',
        severity: 'medium',
        justification: 'Layout não segue convenção comum de pastas',
        evidence: profile.samplePaths?.slice(0, 3) || [],
        affectedAreas: ['/'],
        priority: 2,
        sourceRole: 'Repo Scout',
      }),
    )
  }
  return out
}

function runArchitectureAuditor(profile, signals) {
  const out = []
  const scripts = Object.keys(profile.stack?.scripts || {})
  if (scripts.length >= 6 && !signals.has('structure_packages')) {
    out.push(
      createFinding({
        category: 'arquitetura_modularidade',
        title: 'Muitos scripts npm sem monorepo/packages',
        findingType: 'hypothesis',
        severity: 'medium',
        justification: `${scripts.length} scripts — possível acoplamento em package único`,
        evidence: scripts.slice(0, 5),
        affectedAreas: ['package.json'],
        priority: 2,
        sourceRole: 'Architecture Auditor',
      }),
    )
  }
  if (!signals.has('has_typescript') && (signals.has('stack_react') || signals.has('stack_next'))) {
    out.push(
      createFinding({
        category: 'arquitetura_modularidade',
        title: 'React/Next sem TypeScript detectado',
        findingType: 'suggestion',
        severity: 'low',
        justification: 'Projetos maduros React costumam usar TS para modularidade',
        evidence: ['stack_react|stack_next', 'missing:typescript'],
        priority: 3,
        sourceRole: 'Architecture Auditor',
      }),
    )
  }
  return out
}

function runSecurityAuditor(profile, signals) {
  const out = []
  if (!signals.has('has_security_md')) {
    out.push(
      createFinding({
        category: 'seguranca',
        title: 'SECURITY.md ausente',
        findingType: 'suggestion',
        severity: 'medium',
        justification: 'Política de divulgação responsável não documentada',
        evidence: ['missing:SECURITY.md'],
        affectedAreas: ['SECURITY.md'],
        impact: 'medio',
        effort: 'baixo',
        priority: 2,
        sourceRole: 'Security Auditor',
      }),
    )
  }
  if (!signals.has('has_dependabot') && signals.has('has_ci')) {
    out.push(
      createFinding({
        category: 'seguranca',
        title: 'Dependabot/renovate não detectado',
        findingType: 'suggestion',
        severity: 'medium',
        justification: 'CI presente mas sem automação de atualização de deps',
        evidence: ['has_ci', 'missing:dependabot'],
        priority: 2,
        sourceRole: 'Security Auditor',
      }),
    )
  }
  if (signals.has('gap_no_test_script')) {
    out.push(
      createFinding({
        category: 'testes',
        title: 'Script test ausente no package.json',
        findingType: 'confirmed',
        severity: 'high',
        justification: 'Sem npm test — regressões não detectadas automaticamente',
        evidence: ['gap_no_test_script'],
        affectedAreas: ['package.json'],
        impact: 'alto',
        effort: 'medio',
        priority: 1,
        sourceRole: 'Security Auditor',
      }),
    )
  }
  if (!signals.has('has_tests_or_validar')) {
    out.push(
      createFinding({
        category: 'testes',
        title: 'Nenhum arquivo de teste detectado',
        findingType: 'confirmed',
        severity: 'high',
        justification: 'Ausência de test/, spec ou validar',
        evidence: ['missing:tests'],
        affectedAreas: ['tests/'],
        priority: 1,
        sourceRole: 'QA Verifier',
      }),
    )
  }
  if (!signals.has('has_ci')) {
    out.push(
      createFinding({
        category: 'ci_cd',
        title: 'Pipeline CI não detectada',
        findingType: 'confirmed',
        severity: 'high',
        justification: 'Sem .github/workflows',
        evidence: ['missing:.github/workflows'],
        affectedAreas: ['.github/workflows/'],
        priority: 1,
        sourceRole: 'Security Auditor',
      }),
    )
  }
  return out
}

function runPerformanceReviewer(profile, signals) {
  const out = []
  if (!signals.has('has_build_script') && (signals.has('stack_vite') || signals.has('stack_react'))) {
    out.push(
      createFinding({
        category: 'performance',
        title: 'Script build não detectado',
        findingType: 'hypothesis',
        severity: 'medium',
        justification: 'Frontend sem build script — difícil validar bundle',
        evidence: ['missing:scripts.build'],
        affectedAreas: ['package.json'],
        priority: 2,
        sourceRole: 'Performance Reviewer',
      }),
    )
  }
  if (!signals.has('has_eslint')) {
    out.push(
      createFinding({
        category: 'qualidade_codigo',
        title: 'Linter (ESLint) não detectado',
        findingType: 'suggestion',
        severity: 'low',
        justification: 'Sem eslint.config ou .eslintrc',
        evidence: ['missing:eslint'],
        priority: 3,
        sourceRole: 'Performance Reviewer',
      }),
    )
  }
  if (!signals.has('has_cursor_rules')) {
    out.push(
      createFinding({
        category: 'developer_experience',
        title: 'Regras Cursor (.cursor/rules) ausentes',
        findingType: 'suggestion',
        severity: 'medium',
        justification: 'Agentes sem contexto persistente do projeto',
        evidence: ['missing:.cursor/rules'],
        affectedAreas: ['.cursor/rules/'],
        priority: 2,
        sourceRole: 'Patch Planner',
      }),
    )
  }
  if (!signals.has('has_license')) {
    out.push(
      createFinding({
        category: 'governanca_repositorio',
        title: 'LICENSE não detectada',
        findingType: 'suggestion',
        severity: 'low',
        justification: 'Governança legal do código não declarada',
        evidence: ['missing:LICENSE'],
        priority: 3,
        sourceRole: 'Repo Scout',
      }),
    )
  }
  if (!signals.has('has_docker') && !signals.has('has_ci')) {
    out.push(
      createFinding({
        category: 'maturidade_operacional',
        title: 'Baixa maturidade operacional',
        findingType: 'hypothesis',
        severity: 'medium',
        justification: 'Sem Docker nem CI — deploy/ops manual',
        evidence: ['missing:Dockerfile', 'missing:ci'],
        priority: 2,
        sourceRole: 'Performance Reviewer',
      }),
    )
  }
  return out
}

export function computeHealthScore(profile) {
  return analyzeCategories(profile)
}
