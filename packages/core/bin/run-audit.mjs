#!/usr/bin/env node
import { analyzeRepository } from '../lib/analyze.mjs'

const target = process.argv[2]
const modeArg = process.argv.indexOf('--mode')
const auditMode = modeArg >= 0 ? process.argv[modeArg + 1] : 'audit'

if (!target) {
  console.error('Uso: npm run deep -- <repo-path|github-url> [--mode audit|plan]')
  process.exit(1)
}

try {
  const result = await analyzeRepository(target, { mode: 'deep', auditMode })
  console.log(`[Max Stack] Deep Analysis — ${result.repo.slug} (mode=${auditMode})`)
  console.log(`[Repo Scout] health: ${result.health.summary}`)
  console.log(`[Pattern Hunter] ${result.externalPatterns?.length || 0} referências`)
  if (result.githubComparable?.items?.length) {
    console.log(`[GitHub Search] ${result.githubComparable.items.length} repos (${result.githubComparable.query})`)
  }
  console.log(`[Patch Planner] ${result.recommendations.length} recomendações`)
  if (result.scanDiff?.hasPrevious) {
    console.log(`[Diff] ${result.scanDiff.healthDelta >= 0 ? '+' : ''}${result.scanDiff.healthDelta} pts vs #${result.scanDiff.previousAnalysisId}`)
  }
  if (result.analysisId) console.log(`SQLite: analysis #${result.analysisId}`)
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
