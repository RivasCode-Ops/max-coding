import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeStructure } from '../packages/core/lib/structure-analyzer.mjs'
import { getHealthTrend } from '../packages/core/lib/health-trend.mjs'
import { getDb, closeDb, upsertRepository, saveAnalysisFull } from '../packages/core/lib/db.mjs'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))

describe('Fase 3 — structure analyzer', () => {
  it('analisa max-coding sem crash', () => {
    const s = analyzeStructure(ROOT)
    assert.ok(s.fileCount > 0)
    assert.ok(Array.isArray(s.findings))
    assert.ok(Array.isArray(s.hotspots))
  })
})

describe('Fase 3 — health trend', () => {
  it('calcula tendência com 2+ análises', () => {
    closeDb()
    const db = getDb()
    const slug = `trend-test-${Date.now()}`
    const repoId = upsertRepository(db, { slug, path: ROOT, source: 'local', url: null })
    saveAnalysisFull(db, repoId, {
      mode: 'quick',
      generatedAt: new Date().toISOString(),
      health: { overall: 70, grade: 'B', categories: [], summary: '70/100' },
      findings: [],
      recommendations: [],
      externalPatterns: [],
      backlog: [],
      checklist: [],
      runs: [],
    })
    saveAnalysisFull(db, repoId, {
      mode: 'quick',
      generatedAt: new Date().toISOString(),
      health: { overall: 80, grade: 'A', categories: [], summary: '80/100' },
      findings: [],
      recommendations: [],
      externalPatterns: [],
      backlog: [],
      checklist: [],
      runs: [],
    })
    const trend = getHealthTrend(db, slug, 10)
    assert.equal(trend.points.length, 2)
    assert.equal(trend.trend, 'up')
    assert.equal(trend.delta, 10)
    closeDb()
  })
})
