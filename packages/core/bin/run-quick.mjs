#!/usr/bin/env node
import { analyzeRepository } from '../lib/analyze.mjs'

const target = process.argv[2]
if (!target) {
  console.error('Uso: npm run quick -- <repo-path|github-url>')
  process.exit(1)
}

try {
  const result = await analyzeRepository(target, { mode: 'quick' })
  console.log(`[Max Stack] Quick Scan — ${result.repo.slug}`)
  console.log(`Health: ${result.health.summary}`)
  if (result.scanDiff?.hasPrevious) {
    console.log(`Delta: ${result.scanDiff.healthDelta >= 0 ? '+' : ''}${result.scanDiff.healthDelta} pts`)
  }
  if (result.analysisId) console.log(`SQLite: analysis #${result.analysisId}`)
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
