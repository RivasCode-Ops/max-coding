#!/usr/bin/env node
/**
 * Max Stack — scan portfolio de diretório (ex: c:\_PROJETOS)
 */
import { resolve } from 'node:path'
import { getDb, closeDb } from '../lib/db.mjs'
import {
  buildPortfolioFromDb,
  discoverLocalRepos,
  mergePortfolio,
  portfolioSummary,
  quickScanPortfolio,
} from '../lib/portfolio.mjs'

const root = resolve(process.argv[2] || process.env.MAX_PORTFOLIO_ROOT || 'c:\\_PROJETOS')
const local = discoverLocalRepos(root)
const scanned = quickScanPortfolio(local)
const db = getDb()
const fromDb = buildPortfolioFromDb(db)
const merged = mergePortfolio(fromDb, scanned)
const summary = portfolioSummary(merged)

console.log(JSON.stringify({ root, summary, items: merged }, null, 2))
closeDb()
process.exit(0)
