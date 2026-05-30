#!/usr/bin/env node
/**
 * MAX validar — checagem local completa (sem Cursor)
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeRepository, closeDb } from './packages/core/lib/analyze.mjs'
import { getDbPath } from './packages/core/lib/db.mjs'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)))
let failed = 0

function ok(msg) {
  console.log(`  OK  ${msg}`)
}

function fail(msg) {
  console.log(`  FAIL ${msg}`)
  failed += 1
}

function step(title, fn) {
  console.log(`\n▶ ${title}`)
  try {
    fn()
  } catch (err) {
    fail(err.message)
  }
}

console.log('MAX validar — checagem local\n')

step('Testes unitários', () => {
  const r = spawnSync(process.execPath, ['--test', 'tests/**/*.test.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (r.status !== 0) {
    console.log(r.stdout || r.stderr)
    throw new Error('testes falharam')
  }
  ok('node --test')
})

step('Self-scan (Quick)', () => {
  const result = analyzeRepository(ROOT, { mode: 'quick', writeReports: false })
  if (result.health.overall < 85) throw new Error(`health ${result.health.summary} < 85`)
  ok(`health ${result.health.summary}`)
})

step('SQLite persistência', () => {
  if (!existsSync(getDbPath())) throw new Error('data/max.db não criado')
  ok(getDbPath())
})

step('Deep analysis piloto', () => {
  const pilot = join(ROOT, '..', 'Quadro-Negro')
  if (!existsSync(pilot)) {
    ok('Quadro-Negro não encontrado — pulando')
    return
  }
  const result = analyzeRepository(pilot, { mode: 'deep', writeReports: false })
  if (result.health.overall < 85) throw new Error(`Quadro-Negro health ${result.health.summary}`)
  ok(`${result.repo.slug} ${result.health.summary} · ${result.recommendations.length} recs`)
})

closeDb()

console.log(failed ? `\n✗ ${failed} falha(s)\n` : '\n✓ MAX validar OK\n')
process.exit(failed ? 1 : 0)
