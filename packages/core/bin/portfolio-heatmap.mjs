#!/usr/bin/env node
/**
 * Max Stack — heatmap de categorias do portfolio (Fase 20)
 * Uso: npm run portfolio-heatmap -- [root] [maxRepos]
 */
import { resolve } from 'node:path'
import { closeDb, getDb } from '../lib/analyze.mjs'
import { discoverLocalRepos, mergePortfolio, buildPortfolioFromDb, quickScanPortfolio } from '../lib/portfolio.mjs'
import { buildPortfolioHeatmap } from '../lib/portfolio-heatmap.mjs'

const root = resolve(process.argv[2] || process.env.MAX_PORTFOLIO_ROOT || 'c:\\_PROJETOS')
const maxRepos = Number(process.argv[3] || 8)
const db = getDb()
const items = mergePortfolio(buildPortfolioFromDb(db), quickScanPortfolio(discoverLocalRepos(root)))
const heatmap = buildPortfolioHeatmap(items, { maxRepos })

console.log(`Heatmap — ${root} · ${heatmap.summary.repoCount} repos · ${heatmap.summary.categoryCount} categorias\n`)
for (const w of heatmap.summary.weakestCategories) {
  console.log(`  Fraco: ${w.label} (média ${w.averagePct}%)`)
}
console.log('')
for (const col of heatmap.columns) {
  console.log(`  ${col.slug} — ${col.health}/100 (${col.grade})`)
}

closeDb()
