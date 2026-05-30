#!/usr/bin/env node
/**
 * Max Stack — verificar implementação pós-apply (Fase 9)
 * Uso: npm run verify -- <path> [analysisId]
 */
import { verifyImplementation } from '../lib/verify-apply.mjs'
import { closeDb } from '../lib/analyze.mjs'

const repoPath = process.argv[2]
const analysisId = process.argv[3] ? Number(process.argv[3]) : undefined

if (!repoPath) {
  console.error('Uso: npm run verify -- <repo-path> [analysisId-baseline]')
  process.exit(1)
}

const report = await verifyImplementation(repoPath, {
  baselineAnalysisId: analysisId,
  validateRepo: true,
})

console.log(`\nVerificação: ${report.verdict}`)
console.log(`${report.summary}\n`)
console.log(`Health: ${report.before.health?.summary} → ${report.after.health?.summary}`)
if (report.diff?.hasPrevious) {
  console.log(`Delta: ${report.diff.healthDelta >= 0 ? '+' : ''}${report.diff.healthDelta} pts`)
  if (report.diff.resolvedFindings?.length) {
    console.log(`Resolvidos: ${report.diff.resolvedFindings.join(', ')}`)
  }
}
console.log('\nChecklist:')
for (const c of report.checklist) {
  console.log(`  ${c.ok ? '✓' : '✗'} ${c.label} — ${c.detail}`)
}
if (report.tasks.length) {
  console.log(`\nTasks: ${report.tasks.map((t) => t.relative).join(', ')}`)
}

closeDb()
process.exit(report.verdict === 'FAILED' ? 1 : 0)
