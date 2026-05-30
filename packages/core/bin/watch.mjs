#!/usr/bin/env node
/**
 * Max Stack — re-scan periódico (watch mode)
 * Uso: npm run watch -- <path> [intervalo_segundos]
 */
import { analyzeRepository, closeDb } from '../lib/analyze.mjs'

const repoPath = process.argv[2]
const intervalSec = Number(process.argv[3] || 3600)

if (!repoPath) {
  console.error('Uso: npm run watch -- <repo-path> [intervalo_segundos]')
  console.error('Exemplo: npm run watch -- c:\\_PROJETOS\\Quadro-Negro 1800')
  process.exit(1)
}

console.log(`Max Stack watch — ${repoPath} a cada ${intervalSec}s (Ctrl+C para parar)\n`)

async function tick() {
  const t0 = Date.now()
  try {
    const result = await analyzeRepository(repoPath, { mode: 'quick', writeReports: false, githubSearch: false })
    const diff = result.scanDiff?.hasPrevious
      ? ` · Δ ${result.scanDiff.healthDelta >= 0 ? '+' : ''}${result.scanDiff.healthDelta}`
      : ''
    console.log(`[${new Date().toISOString()}] ${result.repo.slug} ${result.health.summary}${diff} (${Date.now() - t0}ms)`)
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERRO: ${err.message}`)
  }
}

await tick()
const timer = setInterval(tick, intervalSec * 1000)

process.on('SIGINT', () => {
  clearInterval(timer)
  closeDb()
  console.log('\nWatch encerrado.')
  process.exit(0)
})
