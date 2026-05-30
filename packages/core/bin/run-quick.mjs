#!/usr/bin/env node
import { analyzeRepository } from '../lib/analyze.mjs'

const target = process.argv[2]
if (!target) {
  console.error('Uso: npm run quick -- <repo-path>')
  process.exit(1)
}

try {
  const result = analyzeRepository(target, { mode: 'quick' })
  console.log(`[Max Stack] Quick Scan — ${result.repo.slug}`)
  console.log(`Health: ${result.health.summary}`)
  if (result.analysisId) console.log(`SQLite: analysis #${result.analysisId}`)
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
