#!/usr/bin/env node
/**
 * Max Stack — sinais de qualidade (Fase 21)
 * Uso: npm run quality-signals -- <repo-path>
 */
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import { basename, resolve } from 'node:path'
import { buildQualitySignals, formatQualitySignalsMarkdown } from '../lib/quality-signals.mjs'

const repoPath = resolve(process.argv[2] || '.')
const slug = basename(repoPath).toLowerCase().replace(/\s+/g, '-')
const profile = scanRepo(repoPath, slug)
const quality = buildQualitySignals(profile)

console.log(formatQualitySignalsMarkdown(quality))
console.log(`\nResumo: ${quality.summary.passed}/${quality.summary.total} (${quality.summary.pct}%)`)
