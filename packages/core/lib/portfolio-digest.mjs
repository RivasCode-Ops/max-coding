/**
 * Digest executivo do portfolio — Fase 19
 */
import { buildPortfolioChartData } from './portfolio-chart.mjs'
import { buildPortfolioAlerts } from './portfolio-alerts.mjs'
import { buildPortfolioHistory } from './portfolio-history.mjs'
import { portfolioSummary } from './portfolio.mjs'
import { getFeedbackSummary } from './feedback-stats.mjs'

export function buildPortfolioDigest(items, db, options = {}) {
  const root = options.root || ''
  const summary = portfolioSummary(items)
  const chart = buildPortfolioChartData(items)
  const { alerts, summary: alertsSummary } = buildPortfolioAlerts(items, db, options.alertOptions)
  const history = db
    ? buildPortfolioHistory(db, items, { includeSingle: true })
    : { repos: [], summary: { tracked: 0, improving: 0, declining: 0, stable: 0, withHistory: 0 } }
  const feedback = db ? getFeedbackSummary(db) : null

  const declining = history.repos.filter((r) => r.trend === 'down').slice(0, 5)
  const improving = history.repos.filter((r) => r.trend === 'up').slice(0, 5)

  return {
    product: 'Max Stack',
    phase: 'digest',
    generatedAt: new Date().toISOString(),
    root,
    summary,
    chart: {
      averageHealth: chart.averageHealth,
      buckets: chart.buckets,
      barCount: chart.bars.length,
    },
    alerts: { items: alerts.slice(0, 10), summary: alertsSummary },
    history: { summary: history.summary, improving, declining },
    feedback,
    repos: items
      .filter((i) => typeof i.health === 'number')
      .sort((a, b) => b.health - a.health)
      .slice(0, options.maxRepos ?? 15)
      .map((i) => ({
        slug: i.slug,
        path: i.path,
        health: i.health,
        grade: i.grade,
        source: i.source,
      })),
  }
}

export function formatPortfolioDigestMarkdown(digest) {
  const lines = [
    `# Max Stack — Digest do portfolio`,
    '',
    `**Raiz:** ${digest.root || '—'} · **Gerado:** ${digest.generatedAt}`,
    '',
    '## Resumo',
    '',
    `- **Repos:** ${digest.summary.total} (${digest.summary.withHealth} com health)`,
    `- **Média:** ${digest.summary.averageHealth}/100`,
    `- **Excelentes (≥90):** ${digest.chart.buckets.excellent}`,
    `- **Ok (70–89):** ${digest.chart.buckets.good}`,
    `- **Atenção (<70):** ${digest.chart.buckets.attention}`,
    '',
  ]

  if (digest.alerts?.summary?.total) {
    lines.push('## Alertas', '')
    lines.push(
      `- **Críticos:** ${digest.alerts.summary.critical} · **Avisos:** ${digest.alerts.summary.warning} · **Info:** ${digest.alerts.summary.info}`,
      '',
    )
    for (const a of digest.alerts.items) {
      lines.push(`- [${a.level}] **${a.slug}** — ${a.message} (\`${a.code}\`)`)
    }
    lines.push('')
  }

  if (digest.history?.summary?.tracked) {
    const h = digest.history.summary
    lines.push('## Evolução (SQLite)', '')
    lines.push(`- **Com histórico:** ${h.withHistory} · ↑${h.improving} · ↓${h.declining} · →${h.stable}`, '')
    if (digest.history.declining?.length) {
      lines.push('### Regressões recentes', '')
      for (const r of digest.history.declining) {
        lines.push(`- **${r.slug}** ${r.currentHealth}/100 (${r.delta >= 0 ? '+' : ''}${r.delta} pts)`)
      }
      lines.push('')
    }
    if (digest.history.improving?.length) {
      lines.push('### Melhorias recentes', '')
      for (const r of digest.history.improving) {
        lines.push(`- **${r.slug}** ${r.currentHealth}/100 (+${r.delta} pts)`)
      }
      lines.push('')
    }
  }

  if (digest.feedback?.total) {
    lines.push('## Feedback de recomendações', '')
    lines.push(
      `- ${digest.feedback.useful} úteis · ${digest.feedback.notUseful} não úteis${digest.feedback.usefulPct != null ? ` (${digest.feedback.usefulPct}% úteis)` : ''}`,
      '',
    )
  }

  if (digest.summary.needsAttention?.length) {
    lines.push('## Precisam atenção (<70)', '')
    for (const r of digest.summary.needsAttention) {
      lines.push(`- **${r.slug}** — ${r.health}/100`)
    }
    lines.push('')
  }

  lines.push('## Ranking de health', '')
  for (const r of digest.repos) {
    lines.push(`- **${r.slug}** — ${r.health}/100${r.grade ? ` (${r.grade})` : ''}`)
  }
  lines.push('', '---', '', '*Digest Max Stack — local-first*')
  return lines.join('\n')
}

export function writeDigestFilename(stamp = new Date().toISOString().slice(0, 10)) {
  return `max-stack-portfolio-digest-${stamp}.md`
}
