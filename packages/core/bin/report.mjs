#!/usr/bin/env node
/**
 * Max Stack — exportar relatório markdown (Fase 11)
 * Uso: npm run report -- <path> [analysisId]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { analyzeRepository, closeDb, getDb, getAnalysis, resolveProjectRoot } from '../lib/analyze.mjs'
import { generateExecutiveReport, writeReportFilename } from '../lib/report-export.mjs'

const repoPath = process.argv[2]
const analysisId = process.argv[3] ? Number(process.argv[3]) : undefined

if (!repoPath) {
  console.error('Uso: npm run report -- <repo-path> [analysisId]')
  process.exit(1)
}

let result = null
if (analysisId) {
  const row = getAnalysis(getDb(), analysisId)
  if (!row) {
    console.error('Análise não encontrada')
    process.exit(1)
  }
  result = row.data
} else {
  result = await analyzeRepository(repoPath, { mode: 'quick', writeReports: false, githubSearch: false })
}

const md = generateExecutiveReport(result)
const slug = result.repo?.slug || 'repo'
const filename = writeReportFilename(slug)
const ROOT = resolveProjectRoot()
const outDir = join(ROOT, 'reports', slug)
mkdirSync(outDir, { recursive: true })
const target = join(outDir, filename)
writeFileSync(target, md, 'utf8')

console.log(`Relatório: ${target}`)
console.log(`${md.split('\n').length} linhas · ${result.health?.summary}`)

closeDb()
