/**
 * Qualidade agregada no portfolio — Fase 27
 */
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import { buildQualitySignals } from './quality-signals.mjs'

export function buildPortfolioQuality(items, options = {}) {
  const maxRepos = options.maxRepos ?? 20
  const candidates = [...items]
    .filter((i) => i.path)
    .sort((a, b) => (a.health ?? 0) - (b.health ?? 0))
    .slice(0, maxRepos)

  const repos = []
  const checkTotals = new Map()

  for (const item of candidates) {
    const profile = scanRepo(item.path, item.slug)
    const quality = buildQualitySignals(profile)
    repos.push({
      slug: item.slug,
      path: item.path,
      health: item.health,
      passed: quality.summary.passed,
      total: quality.summary.total,
      pct: quality.summary.pct,
      groups: quality.groups,
    })

    for (const check of quality.checks) {
      if (!checkTotals.has(check.id)) {
        checkTotals.set(check.id, {
          id: check.id,
          label: check.label,
          group: check.group,
          passed: 0,
          total: 0,
        })
      }
      const row = checkTotals.get(check.id)
      row.total++
      if (check.ok) row.passed++
    }
  }

  const checks = [...checkTotals.values()]
    .map((c) => ({
      ...c,
      pct: c.total ? Math.round((c.passed / c.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct)

  const groupTotals = aggregateGroups(repos)
  const withPct = repos.filter((r) => r.total > 0)
  const averagePct = withPct.length
    ? Math.round(withPct.reduce((s, r) => s + r.pct, 0) / withPct.length)
    : 0

  return {
    product: 'Max Stack',
    phase: 'portfolio-quality',
    generatedAt: new Date().toISOString(),
    summary: {
      repoCount: repos.length,
      averagePct,
      weakestChecks: checks.slice(0, 5),
      strongestChecks: [...checks].sort((a, b) => b.pct - a.pct).slice(0, 5),
      weakestGroups: [...groupTotals].sort((a, b) => a.pct - b.pct).slice(0, 3),
    },
    checks,
    groups: groupTotals,
    repos: repos.sort((a, b) => a.pct - b.pct),
  }
}

function aggregateGroups(repos) {
  const byGroup = new Map()
  for (const repo of repos) {
    for (const g of repo.groups || []) {
      if (!byGroup.has(g.id)) {
        byGroup.set(g.id, { id: g.id, label: g.label, passed: 0, total: 0 })
      }
      const row = byGroup.get(g.id)
      row.passed += g.passed
      row.total += g.total
    }
  }
  return [...byGroup.values()].map((g) => ({
    ...g,
    pct: g.total ? Math.round((g.passed / g.total) * 100) : 0,
  }))
}

export function formatPortfolioQualityMarkdown(report) {
  const lines = [
    '# Max Stack — Qualidade do portfolio',
    '',
    `**Repos:** ${report.summary.repoCount} · **Média:** ${report.summary.averagePct}%`,
    '',
    '## Sinais mais fracos (adoption %)',
    '',
  ]
  for (const c of report.summary.weakestChecks) {
    lines.push(`- ${c.label}: ${c.passed}/${c.total} repos (${c.pct}%)`)
  }
  lines.push('', '## Repos', '')
  for (const r of report.repos.slice(0, 15)) {
    lines.push(`- **${r.slug}** — ${r.passed}/${r.total} (${r.pct}%)`)
  }
  lines.push('', '---', '', '*Portfolio quality Max Stack*')
  return lines.join('\n')
}
