import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildTrendChartData, trendChartSvg } from '../packages/core/lib/trend-chart.mjs'
import { getFeedbackSummary } from '../packages/core/lib/feedback-stats.mjs'
import { getDb, closeDb } from '../packages/core/lib/db.mjs'

describe('Fase 6 — trend chart', () => {
  it('gera polyline com pontos', () => {
    const chart = buildTrendChartData([
      { health_overall: 70, created_at: '2026-01-01' },
      { health_overall: 85, created_at: '2026-01-02' },
    ])
    assert.equal(chart.empty, false)
    assert.equal(chart.dots.length, 2)
    const svg = trendChartSvg([
      { health_overall: 70, created_at: '2026-01-01' },
      { health_overall: 85, created_at: '2026-01-02' },
    ])
    assert.ok(svg.includes('polyline'))
  })
})

describe('Fase 6 — feedback summary', () => {
  it('retorna totais vazios sem dados', () => {
    closeDb()
    const db = getDb()
    const s = getFeedbackSummary(db)
    assert.equal(typeof s.total, 'number')
    closeDb()
  })
})
