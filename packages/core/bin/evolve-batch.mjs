#!/usr/bin/env node
/**
 * Max Stack — evoluir repos críticos do portfolio — Fase 14
 * Uso: npm run evolve-batch -- [root] [--dry-run] [--max=3]
 */
import { resolve, join } from 'node:path'
import { closeDb, getDb } from '../lib/analyze.mjs'
import {
  buildPortfolioFromDb,
  discoverLocalRepos,
  mergePortfolio,
  quickScanPortfolio,
} from '../lib/portfolio.mjs'
import { evolvePortfolioFromRoot } from '../lib/evolve-batch.mjs'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const maxArg = args.find((a) => a.startsWith('--max='))
const max = maxArg ? Number(maxArg.split('=')[1]) : 3
const rootArg = args.find((a) => !a.startsWith('--'))
const root = resolve(rootArg || process.env.MAX_PORTFOLIO_ROOT || join(process.cwd(), '..'))

const items = mergePortfolio(buildPortfolioFromDb(getDb()), quickScanPortfolio(discoverLocalRepos(root)))
const batch = await evolvePortfolioFromRoot(items, getDb(), { dryRun, max })

console.log(`\n${batch.summary}\n`)
for (const r of batch.results) {
  if (r.ok) {
    console.log(`  ✓ ${r.slug}: ${r.summary}`)
  } else {
    console.log(`  ✗ ${r.slug}: ${r.error}`)
  }
}

closeDb()
process.exit(batch.results.some((r) => !r.ok) ? 1 : 0)
