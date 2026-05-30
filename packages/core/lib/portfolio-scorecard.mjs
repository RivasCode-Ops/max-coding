/**
 * Scorecard ZIP do portfolio — Fase 25
 * Bundle: digest + chart SVG + heatmap SVG + scorecards por repo
 */
import { buildPortfolioDigest, formatPortfolioDigestMarkdown } from './portfolio-digest.mjs'
import { buildPortfolioChartData, portfolioChartSvg } from './portfolio-chart.mjs'
import { buildPortfolioHeatmap, portfolioHeatmapSvg } from './portfolio-heatmap.mjs'
import { createZipBuffer } from './zip-store.mjs'

export function formatRepoScorecardMarkdown(item) {
  const lines = [
    `# Max Stack — Scorecard: ${item.slug}`,
    '',
    `**Health:** ${item.health}/100${item.grade ? ` (${item.grade})` : ''}`,
    `**Path:** ${item.path}`,
    `**Source:** ${item.source || 'local'}`,
  ]
  if (item.summary) lines.push(`**Resumo:** ${item.summary}`)
  if (item.frameworks?.length) lines.push(`**Stack:** ${item.frameworks.join(', ')}`)
  if (item.hasCi != null) lines.push(`**CI:** ${item.hasCi ? 'sim' : 'não'}`)
  if (item.lastScannedAt) lines.push(`**Último scan:** ${item.lastScannedAt}`)
  lines.push('', '---', '', '*Scorecard Max Stack — export ZIP*')
  return lines.join('\n')
}

export function buildScorecardReadme(manifest) {
  return [
    '# Max Stack — Portfolio scorecard bundle',
    '',
    `**Gerado:** ${manifest.generatedAt}`,
    `**Raiz:** ${manifest.root || '—'}`,
    `**Repos:** ${manifest.repoCount} · **Média:** ${manifest.averageHealth}/100`,
    '',
    '## Conteúdo',
    '',
    '- `digest.md` — relatório executivo',
    '- `chart.svg` — gráfico de health',
    '- `heatmap.svg` — matriz 12 categorias × repos',
    '- `manifest.json` — metadados do pacote',
    `- \`scorecards/\` — ${manifest.scorecardCount} scorecard(s) por repo`,
    '',
    '---',
    '',
    '*Max Stack local-first*',
  ].join('\n')
}

export function writeScorecardFilename(stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)) {
  return `max-stack-portfolio-scorecard-${stamp}.zip`
}

export function buildPortfolioScorecardBundle(items, db, options = {}) {
  const root = options.root || ''
  const maxScorecards = options.maxScorecards ?? 10
  const maxHeatmap = options.maxHeatmap ?? 8
  const digest = buildPortfolioDigest(items, db, { root, maxRepos: maxScorecards })
  const chart = buildPortfolioChartData(items)
  const heatmap = buildPortfolioHeatmap(items, { maxRepos: maxHeatmap })

  const scorecardItems = [...items]
    .filter((i) => typeof i.health === 'number')
    .sort((a, b) => b.health - a.health)
    .slice(0, maxScorecards)

  const scorecardFiles = scorecardItems.map((i) => `scorecards/${i.slug}.md`)
  const manifest = {
    product: 'Max Stack',
    phase: 'scorecard-zip',
    generatedAt: new Date().toISOString(),
    root,
    repoCount: digest.summary.total,
    averageHealth: digest.summary.averageHealth,
    scorecardCount: scorecardItems.length,
    files: ['README.md', 'digest.md', 'chart.svg', 'heatmap.svg', 'manifest.json', ...scorecardFiles],
  }

  const entries = [
    { name: 'README.md', data: buildScorecardReadme(manifest) },
    { name: 'digest.md', data: formatPortfolioDigestMarkdown(digest) },
    { name: 'chart.svg', data: portfolioChartSvg(chart) },
    { name: 'heatmap.svg', data: portfolioHeatmapSvg(heatmap) },
    { name: 'manifest.json', data: JSON.stringify(manifest, null, 2) },
  ]

  for (const item of scorecardItems) {
    entries.push({ name: `scorecards/${item.slug}.md`, data: formatRepoScorecardMarkdown(item) })
  }

  return { entries, manifest, filename: writeScorecardFilename() }
}

export function buildPortfolioScorecardZip(items, db, options = {}) {
  const bundle = buildPortfolioScorecardBundle(items, db, options)
  const buffer = createZipBuffer(bundle.entries)
  return {
    buffer,
    filename: bundle.filename,
    manifest: bundle.manifest,
    fileCount: bundle.entries.length,
  }
}
