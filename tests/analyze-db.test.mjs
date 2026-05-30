import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeRepository, closeDb } from '../packages/core/lib/analyze.mjs'
import { getDbPath } from '../packages/core/lib/db.mjs'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)))

describe('analyze + sqlite', () => {
  after(() => closeDb())

  it('persiste analise quick no sqlite', async () => {
    const result = await analyzeRepository(ROOT, { mode: 'quick', writeReports: false })
    assert.ok(result.analysisId > 0)
    assert.ok(result.cursorRules?.includes('Max Stack'))
    assert.ok(existsSync(getDbPath()))
  })
})
