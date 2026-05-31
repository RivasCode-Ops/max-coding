#!/usr/bin/env node
/**
 * Max Stack — qualidade agregada do portfolio (Fase 27)
 * Uso: npm run portfolio-quality -- [root] [max_repos]
 */
import { resolve } from 'node:path'
import { closeDb, getDb } from '../lib/analyze.mjs'
import { discoverLocalRepos, mergePortfolio, buildPortfolioFromDb, quickScanPortfolio } from '../lib/portfolio.mjs'
import { buildPortfolioQuality, formatPortfolioQualityMarkdown } from '../lib/portfolio-quality.mjs'

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const root = resolve(args[0] || process.env.MAX_PORTFOLIO_ROOT || 'c:\\_PROJETOS')
const maxRepos = Number(args[1] || 15)

const db = getDb()
const items = mergePortfolio(buildPortfolioFromDb(db), quickScanPortfolio(discoverLocalRepos(root)))
const report = buildPortfolioQuality(items, { maxRepos })

console.log(formatPortfolioQualityMarkdown(report))
console.log(
  `\nResumo: ${report.summary.repoCount} repos · média ${report.summary.averagePct}% · fraco: ${report.summary.weakestChecks[0]?.label || '—'}`,
)

closeDb()
