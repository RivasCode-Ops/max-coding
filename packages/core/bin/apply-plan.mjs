#!/usr/bin/env node
/**
 * Max Stack — aplicar plano aprovado (Fase 26)
 * Uso: npm run apply-plan -- <path> --approve rec-001,rec-002 [--verify] [--analysis-id N]
 */
import { resolve } from 'node:path'
import { analyzeRepository, closeDb, getDb } from '../lib/analyze.mjs'
import { getAnalysis } from '../lib/db.mjs'
import { buildPlanApplyView, executePlanWorkflow } from '../lib/apply-plan.mjs'

const args = process.argv.slice(2)
const pathArg = args.find((a) => !a.startsWith('--'))
const approveFlag = args.find((a) => a.startsWith('--approve=')) || args.includes('--approve')
const verifyAfter = args.includes('--verify')
const dryRun = args.includes('--dry-run')

let approvedIds = []
if (typeof approveFlag === 'string') {
  approvedIds = approveFlag.replace('--approve=', '').split(',').map((s) => s.trim()).filter(Boolean)
} else {
  const i = args.indexOf('--approve')
  if (i >= 0 && args[i + 1]) approvedIds = args[i + 1].split(',').map((s) => s.trim()).filter(Boolean)
}

const analysisIdArg = args.find((a) => a.startsWith('--analysis-id='))
const analysisId = analysisIdArg
  ? Number(analysisIdArg.replace('--analysis-id=', ''))
  : args.includes('--analysis-id')
    ? Number(args[args.indexOf('--analysis-id') + 1])
    : null

let analysisResult = null
if (analysisId) {
  const row = getAnalysis(getDb(), analysisId)
  if (!row) {
    console.error('Análise não encontrada')
    process.exit(1)
  }
  analysisResult = { ...row.data, analysisId: row.id, repo: row.data.repo || { path: row.path, slug: row.slug } }
} else if (pathArg) {
  analysisResult = await analyzeRepository(resolve(pathArg), {
    mode: 'deep',
    auditMode: 'plan',
    writeReports: false,
    githubSearch: false,
  })
} else {
  console.error('Uso: npm run apply-plan -- <path> --approve id1,id2 [--verify] [--dry-run]')
  process.exit(1)
}

const view = buildPlanApplyView(analysisResult)
if (!approvedIds.length) {
  approvedIds = view.suggestedIds
  console.log(`Nenhum --approve: usando sugeridos (${approvedIds.length})`)
}

const run = await executePlanWorkflow(analysisResult, approvedIds, {
  verifyAfter,
  writeFile: !dryRun,
  baselineAnalysisId: analysisResult.analysisId,
})

console.log(run.summary)
for (const a of run.apply.applied) {
  console.log(`  ✓ ${a.title}${a.result?.written ? ` → ${a.result.written.relative}` : ''}`)
}
for (const s of run.apply.skipped.filter((x) => x.reason !== 'not-approved')) {
  console.log(`  ○ ${s.title}: ${s.reason}`)
}
if (run.verify) {
  console.log(`Verify: ${run.verify.verdict} — ${run.verify.summary}`)
}

closeDb()
