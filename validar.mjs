#!/usr/bin/env node
/**
 * Max Stack validar — checagem local completa (sem Cursor)
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

async function step(title, fn) {
  console.log(`\n▶ ${title}`)
  try {
    await fn()
  } catch (err) {
    fail(err.message)
  }
}

console.log('Max Stack validar — checagem local\n')

await step('Testes unitários', async () => {
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

await step('Self-scan (Quick)', async () => {
  const result = await analyzeRepository(ROOT, { mode: 'quick', writeReports: false })
  if (result.health.overall < 70) throw new Error(`health ${result.health.summary} < 70`)
  if (!result.cursorRules) throw new Error('cursorRules ausente')
  ok(`health ${result.health.summary}`)
})

await step('SQLite persistência', async () => {
  if (!existsSync(getDbPath())) throw new Error('data/max.db não criado')
  ok(getDbPath())
})

await step('Deep analysis piloto', async () => {
  const pilot = join(ROOT, '..', 'Quadro-Negro')
  if (!existsSync(pilot)) {
    ok('Quadro-Negro não encontrado — pulando')
    return
  }
  const result = await analyzeRepository(pilot, { mode: 'deep', writeReports: false, githubSearch: false })
  if (result.health.overall < 70) throw new Error(`Quadro-Negro health ${result.health.summary}`)
  ok(`${result.repo.slug} ${result.health.summary} · ${result.recommendations.length} recs · diff ${result.scanDiff?.hasPrevious ? 'sim' : 'primeira'}`)
})

closeDb()

console.log(failed ? `\n✗ ${failed} falha(s)\n` : '\n✓ Max Stack validar OK\n')
process.exit(failed ? 1 : 0)
