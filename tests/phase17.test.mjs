import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pickWatchTargets, summarizeWatchRun } from '../packages/core/lib/portfolio-watch.mjs'

describe('Fase 17 — portfolio watch', () => {
  it('pickWatchTargets prioriza alertas de scan', () => {
    const alerts = [
      { level: 'critical', action: 'evolve', slug: 'a', path: '/a', code: 'low-health' },
      { level: 'warning', action: 'scan', slug: 'b', path: '/b', code: 'health-regression' },
      { level: 'info', action: 'noop', slug: 'c', path: '/c', code: 'other' },
    ]
    const targets = pickWatchTargets(alerts, { max: 5 })
    assert.equal(targets.length, 2)
    assert.deepEqual(targets.map((t) => t.slug), ['a', 'b'])
  })

  it('pickWatchTargets filtra por slugs', () => {
    const alerts = [
      { level: 'critical', action: 'evolve', slug: 'a', path: '/a', code: 'low-health' },
      { level: 'warning', action: 'scan', slug: 'b', path: '/b', code: 'stale-scan' },
    ]
    const targets = pickWatchTargets(alerts, { slugs: ['b'] })
    assert.equal(targets.length, 1)
    assert.equal(targets[0].slug, 'b')
  })

  it('summarizeWatchRun conta regressões', () => {
    const s = summarizeWatchRun(
      [
        { ok: true, healthDelta: -6 },
        { ok: true, healthDelta: 2 },
        { ok: false },
      ],
      false,
    )
    assert.match(s, /2\/3 ok/)
    assert.match(s, /1 regressão/)
  })
})
