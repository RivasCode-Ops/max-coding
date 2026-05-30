#!/usr/bin/env node
/**
 * Max Stack — scorecard ZIP do portfolio (Fase 25)
 * Uso: npm run portfolio-scorecard -- [root] [max_scorecards]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { closeDb, getDb, resolveProjectRoot } from '../lib/analyze.mjs'
import { discoverLocalRepos, mergePortfolio, buildPortfolioFromDb, quickScanPortfolio } from '../lib/portfolio.mjs'
import { buildPortfolioScorecardZip } from '../lib/portfolio-scorecard.mjs'

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const root = resolve(args[0] || process.env.MAX_PORTFOLIO_ROOT || 'c:\\_PROJETOS')
const maxScorecards = Number(args[1] || 10)

const db = getDb()
const items = mergePortfolio(buildPortfolioFromDb(db), quickScanPortfolio(discoverLocalRepos(root)))
const zip = buildPortfolioScorecardZip(items, db, { root, maxScorecards })

const ROOT = resolveProjectRoot()
const outDir = join(ROOT, 'reports', 'portfolio')
mkdirSync(outDir, { recursive: true })
const target = join(outDir, zip.filename)
writeFileSync(target, zip.buffer)

console.log(`Scorecard ZIP: ${target}`)
console.log(
  `${zip.manifest.repoCount} repos · média ${zip.manifest.averageHealth} · ${zip.fileCount} arquivo(s) no ZIP`,
)

closeDb()
