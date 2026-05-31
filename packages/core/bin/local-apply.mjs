#!/usr/bin/env node
/**
 * Apply local — correções pilot sem Cursor
 * npm run local-apply -- c:\path [--dry-run] [--batch] [--approve id1,id2]
 */
import { resolve } from 'node:path'
import { runLocalApply } from '../lib/local-apply.mjs'

const args = process.argv.slice(2)
const repoPath = args.find((a) => !a.startsWith('-'))
if (!repoPath) {
  console.error('Uso: npm run local-apply -- <path> [--dry-run] [--batch] [--approve rec-001,rec-002]')
  process.exit(1)
}

const dryRun = args.includes('--dry-run')
const batch = args.includes('--batch')
const approveArg = args.find((a) => a.startsWith('--approve=')) || args[args.indexOf('--approve') + 1]
const approvedIds = approveArg && !approveArg.startsWith('--') ? approveArg.split(',').map((s) => s.trim()) : null

const result = await runLocalApply(resolve(repoPath), {
  dryRun,
  approvedIds: approvedIds || undefined,
  maxPriority: batch ? 2 : 3,
  verifyAfter: args.includes('--verify'),
})

console.log(JSON.stringify(result, null, 2))
