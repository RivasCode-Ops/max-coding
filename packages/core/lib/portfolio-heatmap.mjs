/**
 * Heatmap de categorias no portfolio — Fase 20
 */
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import { analyzeCategories, CATEGORY_DEFS } from './categories.mjs'

export function categoryPct(cat) {
  if (!cat?.weight) return 0
  return Math.round((cat.score / cat.weight) * 100)
}

export function heatmapCellColor(pct) {
  if (pct >= 85) return '#22c55e'
  if (pct >= 60) return '#38bdf8'
  if (pct >= 40) return '#f59e0b'
  return '#ef4444'
}

export function scanRepoCategoryScores(item) {
  const profile = scanRepo(item.path, item.slug)
  const health = analyzeCategories(profile)
  const byId = {}
  for (const c of health.categories) {
    byId[c.id] = {
      score: c.score,
      weight: c.weight,
      pct: categoryPct(c),
      status: c.status,
    }
  }
  return { slug: item.slug, path: item.path, health: health.overall, grade: health.grade, categories: byId }
}

export function buildPortfolioHeatmap(items, options = {}) {
  const maxRepos = options.maxRepos ?? 10
  const candidates = [...items]
    .filter((i) => i.path)
    .sort((a, b) => (a.health ?? 0) - (b.health ?? 0))
    .slice(0, maxRepos)

  const columns = candidates.map((item) => scanRepoCategoryScores(item))

  const rows = CATEGORY_DEFS.map((def) => {
    const cells = columns.map((col) => {
      const c = col.categories[def.id]
      return {
        slug: col.slug,
        pct: c?.pct ?? 0,
        status: c?.status ?? 'gap',
        color: heatmapCellColor(c?.pct ?? 0),
      }
    })
    const avg = cells.length ? Math.round(cells.reduce((s, x) => s + x.pct, 0) / cells.length) : 0
    return {
      id: def.id,
      label: def.label,
      cells,
      averagePct: avg,
    }
  })

  const weakest = [...rows].sort((a, b) => a.averagePct - b.averagePct).slice(0, 3)
  const strongest = [...rows].sort((a, b) => b.averagePct - a.averagePct).slice(0, 3)

  return {
    columns: columns.map((c) => ({ slug: c.slug, path: c.path, health: c.health, grade: c.grade })),
    rows,
    summary: {
      repoCount: columns.length,
      categoryCount: CATEGORY_DEFS.length,
      weakestCategories: weakest.map((r) => ({ id: r.id, label: r.label, averagePct: r.averagePct })),
      strongestCategories: strongest.map((r) => ({ id: r.id, label: r.label, averagePct: r.averagePct })),
    },
  }
}

export function portfolioHeatmapSvg(heatmap, options = {}) {
  const width = options.width ?? 480
  const colW = 44
  const rowH = 16
  const labelW = 120
  const cols = heatmap.columns.length
  if (!cols) {
    return `<svg width="${width}" height="60" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" fill="#94a3b8" font-size="12" text-anchor="middle">Sem repos</text>
    </svg>`
  }
  const height = 24 + heatmap.rows.length * rowH
  const header = heatmap.columns
    .map(
      (c, i) =>
        `<text x="${labelW + i * colW + colW / 2}" y="14" fill="#94a3b8" font-size="8" text-anchor="middle">${c.slug.slice(0, 6)}</text>`,
    )
    .join('')
  const body = heatmap.rows
    .map((row, ri) => {
      const y = 24 + ri * rowH
      const label = `<text x="${labelW - 4}" y="${y}" fill="#94a3b8" font-size="9" text-anchor="end">${row.label.slice(0, 16)}</text>`
      const cells = row.cells
        .map((cell, ci) => {
          const x = labelW + ci * colW
          return `<rect x="${x}" y="${y - 10}" width="${colW - 4}" height="12" rx="2" fill="${cell.color}"/>
            <title>${row.label} · ${cell.slug} · ${cell.pct}%</title>`
        })
        .join('')
      return label + cells
    })
    .join('')
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img">${header}${body}</svg>`
}
