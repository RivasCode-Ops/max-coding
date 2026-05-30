import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildPortfolioChartData, healthBarColor, portfolioChartSvg } from '../packages/core/lib/portfolio-chart.mjs'

describe('Fase 15 — portfolio chart', () => {
  it('buildPortfolioChartData ordena por health', () => {
    const chart = buildPortfolioChartData([
      { slug: 'b', health: 70 },
      { slug: 'a', health: 95 },
    ])
    assert.equal(chart.bars[0].slug, 'a')
    assert.equal(chart.buckets.excellent, 1)
    assert.equal(chart.buckets.good, 1)
  })

  it('healthBarColor usa verde para ≥90', () => {
    assert.equal(healthBarColor(95), '#22c55e')
  })

  it('portfolioChartSvg gera svg com barras', () => {
    const chart = buildPortfolioChartData([{ slug: 'demo', health: 88 }])
    const svg = portfolioChartSvg(chart)
    assert.match(svg, /demo/)
    assert.match(svg, /rect/)
  })
})
