#!/usr/bin/env node
/**
 * Max Stack — evoluir repo (scan + pilot + verify) — Fase 12
 * Uso: npm run evolve -- <path> [--dry-run]
 */
import { evolveRepository } from '../lib/evolve-repo.mjs'
import { closeDb } from '../lib/analyze.mjs'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const repoPath = args.find((a) => !a.startsWith('--'))

if (!repoPath) {
  console.error('Uso: npm run evolve -- <repo-path> [--dry-run]')
  process.exit(1)
}

const result = await evolveRepository(repoPath, { dryRun, validateRepo: !dryRun })

console.log(`\nEvolução ${dryRun ? '(preview)' : ''}: ${result.summary}\n`)
console.log(`Baseline: ${result.baseline.health.summary}`)
if (result.pilot?.planned?.length) {
  console.log(`Pilot: ${result.pilot.planned.join(', ')}${dryRun ? ' (dry-run)' : ''}`)
}
if (result.verification) {
  console.log(`Verify: ${result.verification.verdict} — ${result.verification.summary}`)
  for (const c of result.verification.checklist) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}`)
  }
}
if (result.final?.health) {
  console.log(`\nFinal: ${result.final.health.summary}`)
}

closeDb()
process.exit(result.verification?.verdict === 'FAILED' ? 1 : 0)
