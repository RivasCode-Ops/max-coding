#!/usr/bin/env node
/**
 * Max Stack — histórico de health do portfolio (Fase 18)
 * Uso: npm run portfolio-history -- [root]
 */
import { resolve } from 'node:path'
import { closeDb, getDb } from '../lib/analyze.mjs'
import { discoverLocalRepos, mergePortfolio, buildPortfolioFromDb, quickScanPortfolio } from '../lib/portfolio.mjs'
import { buildPortfolioHistory } from '../lib/portfolio-history.mjs'

const root = resolve(process.argv[2] || process.env.MAX_PORTFOLIO_ROOT || 'c:\\_PROJETOS')
const db = getDb()
const items = mergePortfolio(buildPortfolioFromDb(db), quickScanPortfolio(discoverLocalRepos(root)))
const { repos, summary } = buildPortfolioHistory(db, items)

console.log(`Portfolio history — ${root}`)
console.log(
  `${summary.tracked} repos · ↑${summary.improving} ↓${summary.declining} →${summary.stable} (${summary.withHistory} com 2+ scans)\n`,
)

for (const r of repos) {
  const arrow = r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'
  console.log(
    `${arrow} ${r.slug.padEnd(20)} ${r.currentHealth}/100 · ${r.delta >= 0 ? '+' : ''}${r.delta} pts · ${r.scanCount} scan(s)`,
  )
}

closeDb()
