#!/usr/bin/env node
import { analyzeRepository } from '../lib/analyze.mjs'

const target = process.argv[2]
const modeArg = process.argv.indexOf('--mode')
const auditMode = modeArg >= 0 ? process.argv[modeArg + 1] : 'audit'

if (!target) {
  console.error('Uso: npm run deep -- <repo-path> [--mode audit|plan]')
  process.exit(1)
}

try {
  const result = analyzeRepository(target, { mode: 'deep', auditMode })
  console.log(`[MAX Orchestrator] Deep Analysis — ${result.repo.slug} (mode=${auditMode})`)
  console.log(`[Repo Scout] health score: ${result.health.summary}`)
  console.log(`[Patch Planner] ${result.recommendations.length} recomendações`)
  if (result.analysisId) console.log(`SQLite: analysis #${result.analysisId}`)
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
