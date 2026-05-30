import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildGoalAlerts,
  goalsProgress,
  normalizePortfolioGoals,
} from '../packages/core/lib/portfolio-goals.mjs'

describe('Fase 22 — portfolio goals', () => {
  it('normalizePortfolioGoals ajusta target >= min', () => {
    const g = normalizePortfolioGoals({ minHealth: 80, targetHealth: 60 })
    assert.equal(g.minHealth, 80)
    assert.equal(g.targetHealth, 80)
  })

  it('buildGoalAlerts distingue mínimo e alvo', () => {
    const goals = { minHealth: 70, targetHealth: 85, enabled: true }
    const alerts = buildGoalAlerts(
      [
        { slug: 'a', path: '/a', health: 60 },
        { slug: 'b', path: '/b', health: 75 },
        { slug: 'c', path: '/c', health: 90 },
      ],
      goals,
    )
    assert.equal(alerts.filter((a) => a.code === 'below-goal').length, 1)
    assert.equal(alerts.filter((a) => a.code === 'under-target').length, 1)
  })

  it('goalsProgress conta repos na meta', () => {
    const p = goalsProgress(
      [
        { slug: 'a', health: 90 },
        { slug: 'b', health: 65 },
      ],
      { minHealth: 70, targetHealth: 85, enabled: true },
    )
    assert.equal(p.atTarget, 1)
    assert.equal(p.belowMin, 1)
  })
})
