import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeRepository, closeDb } from '../packages/core/lib/analyze.mjs'
import { getDbPath } from '../packages/core/lib/db.mjs'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)))

describe('analyze + sqlite', () => {
  after(() => closeDb())

  it('persiste analise quick no sqlite', () => {
    const result = analyzeRepository(ROOT, { mode: 'quick', writeReports: false })
    assert.ok(result.analysisId > 0)
    assert.ok(typeof result.health.overall === 'number')
    assert.ok(existsSync(getDbPath()))
  })
})
