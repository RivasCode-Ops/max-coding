import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pickEvolveTargets, summarizeBatchResults } from '../packages/core/lib/evolve-batch.mjs'
import { formatIssueBody, issueLabelsForPriority, resolveOwnerRepoForPublish } from '../packages/core/lib/issues-publish.mjs'

describe('Fase 14 — evolve batch + issues publish', () => {
  it('pickEvolveTargets filtra críticos com action evolve', () => {
    const alerts = [
      { level: 'critical', action: 'evolve', slug: 'a', path: '/a', code: 'low-health' },
      { level: 'warning', action: 'scan', slug: 'b', path: '/b', code: 'regression' },
      { level: 'critical', action: 'evolve', slug: 'a', path: '/a', code: 'dup' },
    ]
    const targets = pickEvolveTargets(alerts, { max: 5 })
    assert.equal(targets.length, 1)
    assert.equal(targets[0].slug, 'a')
  })

  it('summarizeBatchResults conta ok e falhas', () => {
    const s = summarizeBatchResults(
      [
        { ok: true, healthDelta: 3 },
        { ok: false },
      ],
      false,
    )
    assert.match(s, /1\/2 ok/)
    assert.match(s, /1 falha/)
  })

  it('formatIssueBody inclui metadados Max Stack', () => {
    const body = formatIssueBody(
      { title: 'Test', priority: 1, body: 'Fix it', impact: 'high', effort: 'low', risk: 'low' },
      { health: '70/100', analysisId: 42 },
    )
    assert.match(body, /Max Stack/)
    assert.match(body, /70\/100/)
  })

  it('issueLabelsForPriority marca P1', () => {
    assert.deepEqual(issueLabelsForPriority(1), ['max-stack', 'priority-p1'])
  })

  it('resolveOwnerRepoForPublish usa override', () => {
    assert.equal(resolveOwnerRepoForPublish({}, null, 'org/repo'), 'org/repo')
  })
})
