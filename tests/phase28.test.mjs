import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  applyBatchLocally,
  applyRecommendationLocally,
  applyApprovedPlanItemsLocally,
  summarizeLocalPlanWorkflow,
} from '../packages/core/lib/local-apply.mjs'

const sample = {
  analysisId: 1,
  repo: { slug: 'demo', path: '' },
  profile: { signals: [] },
  health: { summary: '70/100' },
  recommendations: [
    {
      id: 'rec-001',
      title: 'Add SECURITY.md policy',
      priority: 1,
      problem: 'sem security',
      affectedAreas: ['SECURITY.md'],
    },
    {
      id: 'rec-002',
      title: 'Add complex feature',
      priority: 2,
      problem: 'feature gap',
      affectedAreas: ['src'],
    },
  ],
  backlog: [
    { id: 'rec-001', title: 'Add SECURITY.md policy', priority: 1, tasks: ['file'] },
    { id: 'rec-002', title: 'Add complex feature', priority: 2, tasks: ['code'] },
  ],
  checklist: [],
  prPlan: { branches: [], commits: [], note: '' },
  verification: { ok: true, issues: [] },
  mode: 'deep',
}

describe('Fase 28 — local apply (sem Cursor)', () => {
  it('applyRecommendationLocally escreve fix pilot', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-local-'))
    sample.repo.path = dir
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo' }) + '\n')
    const r = applyRecommendationLocally(sample, 'rec-001', { dryRun: false })
    assert.equal(r.mode, 'local')
    assert.equal(r.pilotFix, 'security-md')
    assert.ok(r.ok)
    assert.equal(r.manual, false)
  })

  it('applyRecommendationLocally marca manual sem pilot', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-local-'))
    sample.repo.path = dir
    const r = applyRecommendationLocally(sample, 'rec-002', { dryRun: true })
    assert.equal(r.manual, true)
    assert.ok(r.guidance?.includes('Max Stack'))
  })

  it('applyBatchLocally filtra por prioridade', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-local-'))
    sample.repo.path = dir
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo' }) + '\n')
    const batch = applyBatchLocally(sample, { maxPriority: 1, dryRun: true })
    assert.equal(batch.results.length, 1)
    assert.equal(batch.results[0].recommendationId, 'rec-001')
  })

  it('applyApprovedPlanItemsLocally só aplica pilot', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-local-'))
    sample.repo.path = dir
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo' }) + '\n')
    const run = applyApprovedPlanItemsLocally(sample, ['rec-001', 'rec-002'], { dryRun: true })
    assert.equal(run.count, 1)
    assert.ok(run.skipped.some((s) => s.reason === 'manual-only'))
  })

  it('summarizeLocalPlanWorkflow inclui verify', () => {
    const s = summarizeLocalPlanWorkflow({ count: 1, manualCount: 1, skipped: [] }, { verdict: 'STABLE' })
    assert.match(s, /1 fix/)
    assert.match(s, /STABLE/)
  })
})
