/**
 * Pipeline unificado MAX — quick / deep, relatórios + SQLite
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import { recommendFromProfile, toMarkdown, toBacklog } from '../../recommender/lib/recommend.mjs'
import { computeHealthScore } from './health-score.mjs'
import { closeDb, getDb, saveAnalysis, upsertRepository } from './db.mjs'

const ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)))

export function resolveProjectRoot() {
  return ROOT
}

export function analyzeRepository(targetPath, options = {}) {
  const {
    mode = 'quick',
    auditMode = 'audit',
    persistSqlite = true,
    writeReports = true,
    reportsBase = join(ROOT, 'reports'),
  } = options

  const target = resolve(targetPath)
  if (!existsSync(target)) {
    throw new Error(`Caminho não encontrado: ${target}`)
  }

  const slug = basename(target).toLowerCase().replace(/\s+/g, '-')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const generatedAt = new Date().toISOString()

  const profile = scanRepo(target, slug)
  const health = computeHealthScore(profile)

  let recommendations = []
  let references = []
  let backlog = []
  let reportMarkdown = ''

  if (mode === 'deep') {
    const rec = recommendFromProfile(profile)
    recommendations = rec.recommendations
    references = rec.references
    const reportPayload = {
      product: 'MAX',
      analysisMode: 'deep',
      generatedAt,
      mode: auditMode,
      phase: 'PLAN',
      health,
      recommendations,
    }
    reportMarkdown = toMarkdown(reportPayload, profile)
    backlog = toBacklog(recommendations)
  }

  const result = {
    product: 'MAX',
    mode,
    auditMode,
    generatedAt,
    repo: { slug, path: target },
    profile,
    health,
    signals: (profile.signals || []).map((s) => s.id),
    summary: profile.summary,
    recommendations,
    references,
    backlog,
    reportMarkdown,
  }

  if (writeReports) {
    writeReportArtifacts(result, reportsBase, slug, stamp)
  }

  if (persistSqlite) {
    const db = getDb()
    const repoId = upsertRepository(db, slug, target)
    const analysisId = saveAnalysis(db, repoId, result)
    result.analysisId = analysisId
    result.repositoryId = repoId
  }

  return result
}

function writeReportArtifacts(result, reportsBase, slug, stamp) {
  const outDir = join(reportsBase, slug)
  mkdirSync(outDir, { recursive: true })

  writeFileSync(join(outDir, `profile-${stamp}.json`), JSON.stringify(result.profile, null, 2), 'utf8')

  if (result.mode === 'quick') {
    writeFileSync(join(outDir, `quick-${stamp}.json`), JSON.stringify(result, null, 2), 'utf8')
    const md = [
      `# MAX Quick Scan — ${slug}`,
      '',
      `**Health score:** ${result.health.summary}`,
      '',
      '## Categorias',
      '',
      ...result.health.categories.map(
        (c) => `- **${c.id}** (${c.weight}pts): ${c.status === 'ok' ? 'ok' : 'gap'}`,
      ),
      '',
    ].join('\n')
    writeFileSync(join(outDir, `quick-${stamp}.md`), md, 'utf8')
    return
  }

  writeFileSync(
    join(outDir, `references-${stamp}.json`),
    JSON.stringify({ references: result.references, catalog: 'practices-vite-kanban' }, null, 2),
    'utf8',
  )
  writeFileSync(
    join(outDir, `recommendations-${stamp}.json`),
    JSON.stringify(
      {
        product: 'MAX',
        analysisMode: 'deep',
        generatedAt: result.generatedAt,
        mode: result.auditMode,
        health: result.health,
        recommendations: result.recommendations,
      },
      null,
      2,
    ),
    'utf8',
  )
  writeFileSync(join(outDir, `report-${stamp}.md`), result.reportMarkdown, 'utf8')
  writeFileSync(join(outDir, `backlog-${stamp}.json`), JSON.stringify(result.backlog, null, 2), 'utf8')

  const handoff = {
    product: 'MAX',
    analysisMode: 'deep',
    health: result.health,
    repo: result.repo,
    mode: result.auditMode,
    phase: 'VERIFY',
    analysisId: result.analysisId,
    recommendationCount: result.recommendations.length,
    completed: ['INTAKE', 'SCOUT', 'HUNT', 'AUDIT', 'PLAN'],
    nextAgent: result.recommendations.length ? 'QA Verifier' : 'done',
  }
  writeFileSync(join(outDir, 'handoff.json'), JSON.stringify(handoff, null, 2), 'utf8')
}

export { closeDb, getDb }
