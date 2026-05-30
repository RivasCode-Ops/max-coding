#!/usr/bin/env node
/**
 * Max Stack — watch portfolio (Fase 17)
 * Uso: npm run watch-portfolio -- [root] [intervalo_segundos] [--dry-run]
 */
import { resolve } from 'node:path'
import { closeDb, getDb } from '../lib/analyze.mjs'
import { discoverLocalRepos, mergePortfolio, buildPortfolioFromDb, quickScanPortfolio } from '../lib/portfolio.mjs'
import { runPortfolioWatchTick } from '../lib/portfolio-watch.mjs'

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const dryRun = process.argv.includes('--dry-run')
const root = resolve(args[0] || process.env.MAX_PORTFOLIO_ROOT || 'c:\\_PROJETOS')
const intervalSec = Number(args[1] || 3600)

console.log(
  `Max Stack watch portfolio — ${root} a cada ${intervalSec}s${dryRun ? ' (dry-run)' : ''} (Ctrl+C para parar)\n`,
)

async function tick() {
  const db = getDb()
  const items = mergePortfolio(buildPortfolioFromDb(db), quickScanPortfolio(discoverLocalRepos(root)))
  const run = await runPortfolioWatchTick(items, db, { dryRun, max: 5 })
  console.log(`[${run.at}] ${run.summary}`)
  for (const r of run.results) {
    const delta =
      r.healthDelta != null ? ` · Δ ${r.healthDelta >= 0 ? '+' : ''}${r.healthDelta}` : ''
    if (r.ok) {
      console.log(`  · ${r.slug} ${r.healthSummary || r.health || '—'}${delta}`)
    } else {
      console.log(`  · ${r.slug} ERRO: ${r.error}`)
    }
  }
}

await tick()
if (dryRun) {
  closeDb()
  process.exit(0)
}

const timer = setInterval(tick, intervalSec * 1000)

process.on('SIGINT', () => {
  clearInterval(timer)
  closeDb()
  console.log('\nWatch portfolio encerrado.')
  process.exit(0)
})
