import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPortfolioHeatmap,
  categoryPct,
  heatmapCellColor,
  portfolioHeatmapSvg,
} from '../packages/core/lib/portfolio-heatmap.mjs'
import { CATEGORY_DEFS } from '../packages/core/lib/categories.mjs'

describe('Fase 20 — portfolio heatmap', () => {
  it('categoryPct calcula percentual', () => {
    assert.equal(categoryPct({ score: 8, weight: 10 }), 80)
  })

  it('heatmapCellColor usa verde para alto', () => {
    assert.equal(heatmapCellColor(90), '#22c55e')
    assert.equal(heatmapCellColor(30), '#ef4444')
  })

  it('buildPortfolioHeatmap gera 12 linhas de categoria', () => {
    const heatmap = buildPortfolioHeatmap(
      [{ slug: 'demo', path: process.cwd(), health: 80 }],
      { maxRepos: 1 },
    )
    assert.equal(heatmap.rows.length, CATEGORY_DEFS.length)
    assert.equal(heatmap.columns.length, 1)
    assert.ok(heatmap.summary.weakestCategories.length <= 3)
  })

  it('portfolioHeatmapSvg inclui rects', () => {
    const heatmap = buildPortfolioHeatmap(
      [{ slug: 'x', path: process.cwd(), health: 70 }],
      { maxRepos: 1 },
    )
    const svg = portfolioHeatmapSvg(heatmap)
    assert.match(svg, /rect/)
  })
})
