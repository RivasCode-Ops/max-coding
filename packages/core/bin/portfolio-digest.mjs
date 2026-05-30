#!/usr/bin/env node
/**
 * Max Stack — digest executivo do portfolio (Fase 19)
 * Uso: npm run portfolio-digest -- [root]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { closeDb, getDb, resolveProjectRoot } from '../lib/analyze.mjs'
import { discoverLocalRepos, mergePortfolio, buildPortfolioFromDb, quickScanPortfolio } from '../lib/portfolio.mjs'
import { buildPortfolioDigest, formatPortfolioDigestMarkdown, writeDigestFilename } from '../lib/portfolio-digest.mjs'

const root = resolve(process.argv[2] || process.env.MAX_PORTFOLIO_ROOT || 'c:\\_PROJETOS')
const db = getDb()
const items = mergePortfolio(buildPortfolioFromDb(db), quickScanPortfolio(discoverLocalRepos(root)))
const digest = buildPortfolioDigest(items, db, { root })
const md = formatPortfolioDigestMarkdown(digest)

const ROOT = resolveProjectRoot()
const outDir = join(ROOT, 'reports', 'portfolio')
mkdirSync(outDir, { recursive: true })
const target = join(outDir, writeDigestFilename())
writeFileSync(target, md, 'utf8')

console.log(`Digest: ${target}`)
console.log(`${digest.summary.total} repos · média ${digest.summary.averageHealth} · ${digest.alerts.summary.total} alertas`)

closeDb()
