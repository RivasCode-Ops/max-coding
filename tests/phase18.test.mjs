import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPortfolioHistory,
  historySparklineSvg,
  summarizePortfolioHistory,
} from '../packages/core/lib/portfolio-history.mjs'

describe('Fase 18 — portfolio history', () => {
  it('summarizePortfolioHistory conta tendências', () => {
    const s = summarizePortfolioHistory([
      { trend: 'up' },
      { trend: 'down' },
      { trend: 'stable' },
      { points: [{ health: 80 }, { health: 85 }] },
    ])
    assert.equal(s.tracked, 4)
    assert.equal(s.improving, 1)
    assert.equal(s.declining, 1)
    assert.equal(s.withHistory, 1)
  })

  it('buildPortfolioHistory ordena por maior delta', () => {
    const db = {
      prepare: () => ({
        all: (slug) => {
          if (slug === 'a') {
            return [
              { health_overall: 85, health_grade: 'B', mode: 'quick', created_at: '2026-02-01' },
              { health_overall: 70, health_grade: 'C', mode: 'quick', created_at: '2026-01-01' },
            ]
          }
          return []
        },
      }),
    }
    const { repos, summary } = buildPortfolioHistory(
      db,
      [
        { slug: 'a', path: '/a', health: 85 },
        { slug: 'b', path: '/b', health: 50 },
      ],
      { minPoints: 2 },
    )
    assert.equal(repos.length, 1)
    assert.equal(repos[0].slug, 'a')
    assert.equal(repos[0].trend, 'up')
    assert.equal(summary.improving, 1)
  })

  it('historySparklineSvg gera polyline', () => {
    const svg = historySparklineSvg(
      [{ health: 70 }, { health: 80 }, { health: 75 }],
      { trend: 'up' },
    )
    assert.match(svg, /polyline/)
    assert.match(svg, /#22c55e/)
  })
})
