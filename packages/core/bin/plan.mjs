#!/usr/bin/env node
/**
 * Max Stack — exportar pacote plan (Fase 16)
 * Uso: npm run plan -- <repo-path> [analysisId]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { analyzeRepository, closeDb, getDb, getAnalysis, resolveProjectRoot } from '../lib/analyze.mjs'
import { buildPlanPackage, formatPlanMarkdown, planPackageJson, writePlanFilename } from '../lib/plan-package.mjs'

const repoPath = process.argv[2]
const analysisId = process.argv[3] ? Number(process.argv[3]) : undefined
const jsonOnly = process.argv.includes('--json')

if (!repoPath) {
  console.error('Uso: npm run plan -- <repo-path> [analysisId] [--json]')
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
  result = await analyzeRepository(repoPath, {
    mode: 'deep',
    auditMode: 'plan',
    writeReports: true,
    githubSearch: false,
  })
}

const pkg = buildPlanPackage(result)
const slug = result.repo?.slug || 'repo'
const ROOT = resolveProjectRoot()
const outDir = join(ROOT, 'reports', slug)
mkdirSync(outDir, { recursive: true })

const mdName = writePlanFilename(slug)
const mdPath = join(outDir, mdName)
const jsonPath = join(outDir, mdName.replace(/\.md$/, '.json'))

if (jsonOnly) {
  writeFileSync(jsonPath, planPackageJson(pkg), 'utf8')
  console.log(`Plano JSON: ${jsonPath}`)
} else {
  const md = formatPlanMarkdown(result, { includeIssues: true })
  writeFileSync(mdPath, md, 'utf8')
  writeFileSync(jsonPath, planPackageJson(pkg), 'utf8')
  console.log(`Plano MD: ${mdPath}`)
  console.log(`Plano JSON: ${jsonPath}`)
}

console.log(
  `Modo plan · ${pkg.counts.backlog} backlog · ${pkg.counts.prCommits} commits · QA ${pkg.verification.ok ? 'ok' : 'review'}`,
)

closeDb()
