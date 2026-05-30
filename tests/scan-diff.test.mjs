import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { diffAnalyses } from '../packages/core/lib/scan-diff.mjs'

describe('diffAnalyses', () => {
  it('detecta melhoria entre scans', () => {
    const prev = {
      analysisId: 1,
      generatedAt: '2026-01-01',
      health: { overall: 70, grade: 'B' },
      findings: [{ title: 'Sem CI' }, { title: 'Sem testes' }],
    }
    const cur = {
      health: { overall: 88, grade: 'A' },
      findings: [{ title: 'Sem CI' }],
    }
    const d = diffAnalyses(cur, prev)
    assert.equal(d.healthDelta, 18)
    assert.ok(d.resolvedFindings.includes('Sem testes'))
    assert.ok(d.improved)
  })

  it('primeira analise sem previous', () => {
    const d = diffAnalyses({ health: { overall: 80 }, findings: [] }, null)
    assert.equal(d.hasPrevious, false)
  })
})
