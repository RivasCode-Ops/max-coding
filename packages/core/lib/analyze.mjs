/**
 * Pipeline Max Stack — entrada unificada (local | GitHub)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import { toMarkdown } from '../../recommender/lib/recommend.mjs'
import { resolveRepositoryInput } from './intake.mjs'
import { runPipeline, toExecutiveSummary, toPrPlan } from './pipeline.mjs'
import { closeDb, getDb, getLatestAnalysisForRepo, saveAnalysisFull, upsertRepository } from './db.mjs'
import { mergeGithubSearchIntoPatterns, searchComparableRepos } from './github-search.mjs'
import { diffAnalyses } from './scan-diff.mjs'
import { cursorRulesFilename, generateCursorRules } from './rules-generator.mjs'
import { analyzeStructure } from './structure-analyzer.mjs'
import { validateFromProfile } from './repo-validator.mjs'
import { getHealthTrend } from './health-trend.mjs'
import { applyCursorRules } from './apply-rules.mjs'
import { dedupeFindings, findingsToRecommendations } from './findings.mjs'
import { analyzeGitHistory } from './git-analyzer.mjs'
import { generateIssuesMarkdown } from './issues-export.mjs'

const ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)))

export function resolveProjectRoot() {
  return ROOT
}

export async function analyzeRepository(input, options = {}) {
  const {
    mode = 'quick',
    auditMode = 'audit',
    persistSqlite = true,
    writeReports = true,
    reportsBase = join(ROOT, 'reports'),
    forceRefresh = false,
    githubSearch = mode === 'deep',
    validateRepo = false,
    applyRules = false,
  } = options

  const intake = resolveRepositoryInput(input, { forceRefresh })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const generatedAt = new Date().toISOString()

  const profile = scanRepo(intake.path, intake.slug)
  profile.intake = { source: intake.source, url: intake.url, ownerRepo: intake.ownerRepo }

  const db = persistSqlite ? getDb() : null
  const repoId = db ? upsertRepository(db, intake) : null
  const previousSnapshot = db && repoId ? getLatestAnalysisForRepo(db, repoId) : null

  const pipeline = runPipeline(profile, mode)

  let structure = null
  let gitHistory = null
  if (mode === 'deep') {
    structure = analyzeStructure(intake.path)
    mergeDeepFindings(pipeline, structure.findings, generatedAt, 'Structure Analyzer', {
      fileCount: structure.fileCount,
    })

    gitHistory = analyzeGitHistory(intake.path)
    if (gitHistory.available) {
      mergeDeepFindings(pipeline, gitHistory.findings, generatedAt, 'Git Analyzer', {
        commits: gitHistory.metrics?.commitCount,
      })
    }
  }

  let repoValidation = null
  if (validateRepo && mode === 'deep') {
    repoValidation = validateFromProfile(profile)
    pipeline.runs.push({
      agent: 'Repo Validator',
      phase: 'VERIFY',
      startedAt: generatedAt,
      finishedAt: generatedAt,
      ok: repoValidation.ok,
    })
  }

  let githubComparable = null
  let externalPatterns = pipeline.externalPatterns
  if (githubSearch && mode === 'deep') {
    githubComparable = await searchComparableRepos(profile)
    externalPatterns = mergeGithubSearchIntoPatterns(externalPatterns, githubComparable)
  }

  const result = {
    product: 'Max Stack',
    mode,
    auditMode,
    analysisMode: mode,
    generatedAt,
    repo: { slug: intake.slug, path: intake.path, source: intake.source, url: intake.url },
    profile,
    health: pipeline.health,
    findings: pipeline.findings,
    recommendations: pipeline.recommendations,
    externalPatterns,
    githubComparable,
    backlog: pipeline.backlog,
    checklist: pipeline.checklist,
    prPlan: toPrPlan(pipeline.findings, { slug: intake.slug }),
    executiveSummary: null,
    scanDiff: null,
    cursorRules: null,
    structure,
    gitHistory,
    repoValidation,
    healthTrend: null,
    rulesApplied: null,
    issuesMarkdown: null,
    runs: pipeline.runs,
    verification: pipeline.verification,
    signals: (profile.signals || []).map((s) => s.id),
    summary: profile.summary,
    reportMarkdown: '',
  }

  result.executiveSummary = toExecutiveSummary(result)
  result.cursorRules = generateCursorRules(result)
  result.scanDiff = diffAnalyses(result, previousSnapshot)

  if (mode === 'deep') {
    result.reportMarkdown = toMarkdown({ ...result, phase: 'PLAN', mode: auditMode }, profile)
    result.issuesMarkdown = generateIssuesMarkdown(result)
  }

  if (writeReports) writeReportArtifacts(result, reportsBase, intake.slug, stamp)
  if (persistSqlite && db && repoId) {
    result.analysisId = saveAnalysisFull(db, repoId, result)
    result.repositoryId = repoId
    if (previousSnapshot && result.scanDiff) {
      result.scanDiff.previousAnalysisId = previousSnapshot.analysisId
    }
    result.healthTrend = getHealthTrend(db, intake.slug)
  }

  if (applyRules && result.cursorRules) {
    result.rulesApplied = applyCursorRules(intake.path, result.cursorRules, intake.slug)
  }

  return result
}

function writeReportArtifacts(result, reportsBase, slug, stamp) {
  const outDir = join(reportsBase, slug)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, `profile-${stamp}.json`), JSON.stringify(result.profile, null, 2), 'utf8')
  writeFileSync(join(outDir, `${result.mode}-${stamp}.json`), JSON.stringify(result, null, 2), 'utf8')

  if (result.cursorRules) {
    writeFileSync(
      join(outDir, `cursor-rules-${stamp}.mdc`),
      result.cursorRules,
      'utf8',
    )
  }
  if (result.scanDiff) {
    writeFileSync(join(outDir, `scan-diff-${stamp}.json`), JSON.stringify(result.scanDiff, null, 2), 'utf8')
  }

  if (result.mode === 'quick') {
    writeFileSync(
      join(outDir, `quick-${stamp}.md`),
      `# Max Stack Quick — ${slug}\n\n**Health:** ${result.health.summary}\n`,
      'utf8',
    )
    return
  }

  writeFileSync(join(outDir, `report-${stamp}.md`), result.reportMarkdown, 'utf8')
  writeFileSync(join(outDir, `backlog-${stamp}.json`), JSON.stringify(result.backlog, null, 2), 'utf8')
  writeFileSync(join(outDir, `checklist-${stamp}.json`), JSON.stringify(result.checklist, null, 2), 'utf8')
  writeFileSync(join(outDir, `pr-plan-${stamp}.json`), JSON.stringify(result.prPlan, null, 2), 'utf8')
  if (result.issuesMarkdown) {
    writeFileSync(join(outDir, `issues-${stamp}.md`), result.issuesMarkdown, 'utf8')
  }
  writeFileSync(
    join(outDir, 'handoff.json'),
    JSON.stringify(
      {
        product: 'Max Stack',
        analysisId: result.analysisId,
        health: result.health,
        findingCount: result.findings.length,
        recommendationCount: result.recommendations.length,
        scanDiff: result.scanDiff,
        phase: 'VERIFY',
      },
      null,
      2,
    ),
    'utf8',
  )
}

function mergeDeepFindings(pipeline, newFindings, generatedAt, agent, meta = {}) {
  pipeline.findings = dedupeFindings([...pipeline.findings, ...newFindings])
  const extraRecs = findingsToRecommendations(newFindings)
  const seen = new Set(pipeline.recommendations.map((r) => r.title))
  let idx = 0
  for (const r of extraRecs) {
    if (seen.has(r.title)) continue
    idx += 1
    r.id = `rec-${agent.toLowerCase().replace(/\s+/g, '-')}-${String(idx).padStart(3, '0')}`
    pipeline.recommendations.push(r)
    seen.add(r.title)
  }
  pipeline.runs.push({
    agent,
    phase: 'AUDIT',
    startedAt: generatedAt,
    finishedAt: generatedAt,
    ...meta,
  })
}

export { closeDb, getDb, generateCursorRules, cursorRulesFilename, diffAnalyses, getHealthTrend, applyCursorRules, validateFromProfile, generateIssuesMarkdown }
