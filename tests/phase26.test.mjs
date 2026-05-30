import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyApprovedPlanItems,
  buildPlanApplyView,
  resolveRecommendationId,
  summarizePlanWorkflow,
} from '../packages/core/lib/apply-plan.mjs'

const sample = {
  analysisId: 1,
  repo: { slug: 'demo', path: '/tmp/demo' },
  recommendations: [
    { id: 'rec-001', title: 'Add CI', priority: 1, problem: 'sem CI', affectedAreas: ['.github'] },
    { id: 'rec-002', title: 'Tests', priority: 2, problem: 'sem testes', affectedAreas: ['package.json'] },
  ],
  backlog: [
    { id: 'rec-001', title: 'Add CI', priority: 1, tasks: ['workflow'] },
    { id: 'find-002', title: 'Tests', priority: 2, tasks: ['npm test'] },
  ],
  checklist: [],
  prPlan: { branches: [], commits: [], note: '' },
  verification: { ok: true, issues: [] },
  health: { summary: '80/100' },
  mode: 'deep',
}

describe('Fase 26 — apply plan workflow', () => {
  it('resolveRecommendationId mapeia find para rec', () => {
    assert.equal(resolveRecommendationId({ id: 'find-002', title: 'x' }, sample.recommendations), 'rec-002')
    assert.equal(resolveRecommendationId({ id: 'rec-001', title: 'Add CI' }, sample.recommendations), 'rec-001')
  })

  it('buildPlanApplyView marca applyable e suggested', () => {
    const view = buildPlanApplyView(sample)
    assert.equal(view.items.length, 2)
    assert.equal(view.applyableCount, 2)
    assert.ok(view.suggestedIds.includes('rec-001'))
  })

  it('applyApprovedPlanItems só aplica aprovados', () => {
    const run = applyApprovedPlanItems(sample, ['rec-001'], { writeFile: false })
    assert.equal(run.count, 1)
    assert.equal(run.applied[0].title, 'Add CI')
    assert.ok(run.skipped.some((s) => s.reason === 'not-approved'))
  })

  it('summarizePlanWorkflow inclui verify', () => {
    const s = summarizePlanWorkflow({ count: 2, skipped: [] }, { verdict: 'STABLE', summary: 'ok' })
    assert.match(s, /2 task/)
    assert.match(s, /STABLE/)
  })
})
