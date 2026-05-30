/**
 * Gera recommendations.json a partir de profile + catálogo de práticas.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const CATALOG = join(__dir, '../../pattern-search/catalog/practices-vite-kanban.json')

export function recommendFromProfile(profile) {
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'))
  const signalIds = new Set((profile.signals || []).map((s) => s.id))
  const refs = catalog.references || []
  const out = []
  let n = 0

  for (const practice of catalog.practices || []) {
    let applies = false
    if (practice.requiredSignalAbsent && !signalIds.has(practice.requiredSignalAbsent)) {
      applies = true
    }
    if (practice.alsoIfSignal && signalIds.has(practice.alsoIfSignal)) {
      applies = true
    }
    if (!practice.requiredSignalAbsent && !practice.alsoIfSignal) {
      applies = profile.summary?.frameworks?.includes('vite')
    }
    if (!applies) continue

    n += 1
    const ref = refs[0]
    out.push({
      id: `rec-${String(n).padStart(3, '0')}`,
      category: practice.category,
      title: practice.title,
      problem: buildProblem(practice, profile, signalIds),
      referencePattern: practice.referencePattern,
      references: refs.slice(0, 2).map((r) => ({ repo: r.repo, url: r.url })),
      suggestedUpgrade: practice.suggestedUpgrade,
      impact: practice.impact,
      effort: practice.effort,
      risk: practice.risk,
      priority: scorePriority(practice),
      affectedAreas: inferAreas(practice.id),
      executionMode: 'recommendation',
    })
  }

  out.sort((a, b) => a.priority - b.priority)
  return { recommendations: out, references: refs }
}

function buildProblem(practice, profile, signalIds) {
  if (practice.id === 'test_script') {
    return `Repo ${profile.slug}: sem script test confiável (gap_no_test_script=${signalIds.has('gap_no_test_script')})`
  }
  if (practice.id === 'ci_workflow') {
    return `Repo ${profile.slug}: sem .github/workflows`
  }
  if (practice.id === 'cursor_rules') {
    return `Repo ${profile.slug}: agentes Cursor sem .cursor/rules locais`
  }
  return `Gap vs padrão OSS: ${practice.title}`
}

function scorePriority(p) {
  const w = { alto: 1, medio: 2, baixo: 3 }
  return w[p.impact] || 2
}

function inferAreas(id) {
  const map = {
    test_script: ['package.json', 'tests/'],
    ci_workflow: ['.github/workflows/'],
    cursor_rules: ['.cursor/rules/'],
    drag_drop: ['src/main.js'],
    activity_log: ['src/main.js'],
    automation_rules: ['src/'],
  }
  return map[id] || ['src/']
}

export function toMarkdown(report, profile) {
  const health = report.health
  const lines = [
    `# Relatório MAX — ${profile.slug}`,
    '',
    `**Gerado:** ${report.generatedAt}`,
    `**Análise:** ${report.analysisMode || 'deep'}`,
    `**Modo:** ${report.mode}`,
    `**Fase:** ${report.phase}`,
    '',
    '## Health score',
    '',
    health ? `- **Overall:** ${health.summary}` : '- (não calculado)',
    '',
  ]
  if (health?.categories?.length) {
    lines.push('### Por categoria', '')
    for (const c of health.categories) {
      lines.push(`- **${c.id}** (${c.weight}pts): ${c.status === 'ok' ? 'ok' : 'gap'}`)
    }
    lines.push('')
  }
  lines.push(
    '## Resumo',
    '',
    `- Frameworks: ${(profile.summary?.frameworks || []).join(', ') || '—'}`,
    `- CI: ${profile.summary?.hasCi ? 'sim' : 'não'}`,
    `- Testes (sinal): ${profile.summary?.hasTestsSignal ? 'sim' : 'não'}`,
    `- Cursor rules: ${profile.summary?.hasCursorRules ? 'sim' : 'não'}`,
    '',
    '## Recomendações priorizadas',
    '',
  )
  for (const r of report.recommendations) {
    lines.push(`### [P${r.priority}] ${r.category} — ${r.title}`)
    lines.push('')
    lines.push(`**Problema:** ${r.problem}`)
    lines.push(`**Referência:** ${r.references.map((x) => x.repo).join(', ')}`)
    lines.push(`**Upgrade:** ${r.suggestedUpgrade}`)
    lines.push(
      `**Impacto:** ${r.impact} · **Esforço:** ${r.effort} · **Risco:** ${r.risk}`,
    )
    lines.push(`**Áreas:** ${r.affectedAreas.join(', ')}`)
    lines.push('')
  }
  lines.push('## Próximo agente')
  lines.push('')
  lines.push('**QA Verifier** — validar build/test antes de apply no repo alvo.')
  return lines.join('\n')
}

export function toBacklog(recommendations) {
  return recommendations.map((r) => ({
    id: r.id,
    title: r.title,
    priority: r.priority,
    tasks: [r.suggestedUpgrade],
    acceptance: [`Evidência: ${r.problem} resolvido`, 'Build verde'],
  }))
}
