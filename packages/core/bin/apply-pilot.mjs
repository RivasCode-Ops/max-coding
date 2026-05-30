#!/usr/bin/env node
/**
 * Max Stack — aplicar correções P1/P2 (piloto)
 */
import { resolve } from 'node:path'
import { runPilot } from '../lib/apply-pilot.mjs'
import { closeDb } from '../lib/analyze.mjs'

const repoPath = resolve(process.argv[2] || process.cwd())
const dryRun = process.argv.includes('--dry-run')
const force = process.argv.includes('--force')

try {
  const result = await runPilot(repoPath, { dryRun, force })
  console.log(JSON.stringify(result, null, 2))
  if (!dryRun) {
    console.log(`\nHealth: ${result.before.health.summary} → ${result.after.health.summary} (${result.delta >= 0 ? '+' : ''}${result.delta})`)
  }
} catch (err) {
  console.error(err.message)
  process.exit(1)
} finally {
  closeDb()
}
