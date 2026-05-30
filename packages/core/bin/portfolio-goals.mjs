#!/usr/bin/env node
/**
 * Max Stack — metas de health do portfolio (Fase 22)
 * Uso: npm run portfolio-goals
 *      npm run portfolio-goals -- set 75 90
 */
import { closeDb, getDb } from '../lib/analyze.mjs'
import { discoverLocalRepos, mergePortfolio, buildPortfolioFromDb, quickScanPortfolio } from '../lib/portfolio.mjs'
import { getPortfolioGoals, savePortfolioGoals, goalsProgress } from '../lib/portfolio-goals.mjs'

const db = getDb()
const cmd = process.argv[2]
const root = process.env.MAX_PORTFOLIO_ROOT || 'c:\\_PROJETOS'

if (cmd === 'set') {
  const min = Number(process.argv[3])
  const target = Number(process.argv[4])
  const goals = savePortfolioGoals(db, {
    minHealth: Number.isFinite(min) ? min : undefined,
    targetHealth: Number.isFinite(target) ? target : undefined,
    enabled: true,
  })
  console.log(`Metas salvas: mín ${goals.minHealth} · alvo ${goals.targetHealth}`)
} else {
  const goals = getPortfolioGoals(db)
  const items = mergePortfolio(
    buildPortfolioFromDb(db),
    quickScanPortfolio(discoverLocalRepos(root)),
  )
  const progress = goalsProgress(items, goals)
  console.log(`Metas: mín ${goals.minHealth} · alvo ${goals.targetHealth} · ${goals.enabled ? 'ativas' : 'inativas'}`)
  console.log(
    `Progresso: ${progress.atTarget}/${progress.total} na meta alvo · ${progress.belowMin} abaixo do mínimo`,
  )
}

closeDb()
