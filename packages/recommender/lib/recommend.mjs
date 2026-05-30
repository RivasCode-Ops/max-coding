/**
 * Gera recommendations.json a partir de profile + catálogo de práticas.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const CATALOG_DIR = join(__dir, '../../pattern-search/catalog')

export function pickCatalogFile(profile) {
  const fw = profile.summary?.frameworks || []
  if (fw.includes('vite')) return join(CATALOG_DIR, 'practices-vite-kanban.json')
  if (fw.includes('next')) return join(CATALOG_DIR, 'practices-next-app.json')
  if (fw.includes('streamlit')) return join(CATALOG_DIR, 'practices-streamlit.json')
  return join(CATALOG_DIR, 'practices-node-api.json')
}

export function recommendFromProfile(profile) {
  const catalogPath = pickCatalogFile(profile)
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
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
    if (!practice.requiredSignalAbsent && !practice.alsoIfSignal && practice.stackMatch) {
      applies = (profile.summary?.frameworks || []).includes(practice.stackMatch)
    }
    if (!applies) continue

    n += 1
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
      catalogId: catalog.stack || 'generic',
    })
  }

  out.sort((a, b) => a.priority - b.priority)
  return { recommendations: out, references: refs, catalogId: catalog.stack || 'generic' }
}

function buildProblem(practice, profile, signalIds) {
  if (practice.id === 'test_script') {
    return `Repo ${profile.slug}: sem script test (gap_no_test_script=${signalIds.has('gap_no_test_script')})`
  }
  if (practice.id === 'ci_workflow') {
    return `Repo ${profile.slug}: sem .github/workflows`
  }
  if (practice.id === 'cursor_rules') {
    return `Repo ${profile.slug}: sem .cursor/rules`
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
    app_router: ['app/'],
    streamlit_tests: ['tests/'],
  }
  return map[id] || ['src/']
}

export function toMarkdown(report, profile) {
  const health = report.health
  const lines = [
    `# Relatório Max Stack — ${profile.slug}`,
    '',
    `**Gerado:** ${report.generatedAt}`,
    `**Análise:** ${report.analysisMode || report.mode || 'deep'}`,
    '',
    '## Health score',
    '',
    health ? `- **Overall:** ${health.summary}` : '- (não calculado)',
    '',
  ]
  if (health?.categories?.length) {
    lines.push('### Por categoria (12)', '')
    for (const c of health.categories) {
      lines.push(`- **${c.label || c.id}** (${c.weight}pts): ${c.status === 'ok' ? 'ok' : 'gap'}`)
    }
    lines.push('')
  }
  if (report.findings?.length) {
    lines.push('## Achados', '')
    for (const f of report.findings.slice(0, 15)) {
      lines.push(`- [${f.findingType}] **${f.title}** (${f.sourceRole}) — ${f.justification}`)
    }
    lines.push('')
  }
  lines.push('## Recomendações priorizadas', '')
  for (const r of report.recommendations || []) {
    lines.push(`### [P${r.priority}] ${r.category} — ${r.title}`)
    lines.push(`**Upgrade:** ${r.suggestedUpgrade || r.problem}`)
    lines.push('')
  }
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

export function listCatalogs() {
  return readdirSync(CATALOG_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
}
