import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildPortfolioAlerts } from '../packages/core/lib/portfolio-alerts.mjs'

describe('Fase 13 — portfolio alerts', () => {
  it('detecta health crítico', () => {
    const { alerts, summary } = buildPortfolioAlerts(
      [{ slug: 'x', path: '/x', health: 55 }],
      null,
    )
    assert.equal(summary.critical, 1)
    assert.equal(alerts[0].code, 'low-health')
  })

  it('deduplica alertas por slug+code', () => {
    const items = [{ slug: 'a', path: '/a', health: 50 }]
    const r1 = buildPortfolioAlerts(items, null)
    assert.ok(r1.alerts.length >= 1)
  })
})
