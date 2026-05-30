/**
 * Verificação pós-implementação — Fase 9 (QA Verifier loop)
 */
import { analyzeRepository } from './analyze.mjs'
import { validateFromProfile } from './repo-validator.mjs'
import { diffAnalyses } from './scan-diff.mjs'
import { listCursorTasks } from './task-registry.mjs'
import { getDb, getAnalysis } from './db.mjs'

export function buildVerificationReport(before, after, validation, tasks = []) {
  const diff = diffAnalyses(after, before)
  const healthDelta = diff.healthDelta ?? 0
  const testsOk = validation.skipped ? null : validation.ok
  const resolved = diff.resolvedFindings?.length ?? 0
  const newFindings = diff.newFindings?.length ?? 0

  let verdict = 'ATTENTION'
  let summary = 'Re-scan concluído — revise achados'

  if (testsOk === false) {
    verdict = 'FAILED'
    summary = 'Scripts de validação falharam'
  } else if (healthDelta > 0 || resolved > 0) {
    verdict = 'APPROVED'
    summary = `Health melhorou (+${healthDelta} pts) ou ${resolved} achado(s) resolvido(s)`
  } else if (healthDelta === 0 && newFindings === 0 && testsOk !== false) {
    verdict = 'STABLE'
    summary = 'Sem regressão detectada — health estável'
  } else if (healthDelta < 0 || newFindings > resolved) {
    verdict = 'ATTENTION'
    summary = 'Possível regressão — health caiu ou novos achados'
  }

  const checklist = [
    { id: 'health', label: 'Health score', ok: healthDelta >= 0, detail: `${before.health?.summary} → ${after.health?.summary}` },
    { id: 'tests', label: 'Scripts npm', ok: testsOk !== false, detail: validation.skipped ? 'sem scripts' : validation.ok ? 'OK' : 'FAIL' },
    { id: 'findings', label: 'Achados resolvidos', ok: resolved >= newFindings, detail: `${resolved} resolvidos · ${newFindings} novos` },
    { id: 'tasks', label: 'Tasks Cursor', ok: tasks.length > 0, detail: `${tasks.length} task(s) em .cursor/max-stack/tasks/` },
  ]

  return {
    verdict,
    summary,
    before: { health: before.health, analysisId: before.analysisId },
    after: { health: after.health, analysisId: after.analysisId },
    diff,
    validation,
    tasks: tasks.slice(0, 10),
    checklist,
  }
}

export async function verifyImplementation(repoPath, options = {}) {
  const { baselineAnalysisId, validateRepo = true, mode = 'quick' } = options

  let before = null
  if (baselineAnalysisId) {
    const row = getAnalysis(getDb(), Number(baselineAnalysisId))
    if (row) {
      before = { ...row.data, analysisId: row.id }
      before.repo = before.repo || { path: row.path, slug: row.slug }
    }
  }

  const after = await analyzeRepository(repoPath, {
    mode: mode === 'deep' ? 'deep' : 'quick',
    writeReports: false,
    persistSqlite: true,
    githubSearch: false,
  })

  if (!before) {
    const prevId = after.scanDiff?.previousAnalysisId
    if (prevId) {
      const row = getAnalysis(getDb(), prevId)
      if (row) {
        before = { ...row.data, analysisId: row.id }
      }
    }
  }

  if (!before) {
    before = { health: after.health, findings: [], analysisId: null }
  }

  let validation = { ok: true, skipped: true, message: 'Validação desabilitada', results: [] }
  if (validateRepo && after.profile) {
    validation = validateFromProfile(after.profile)
  }

  const tasks = listCursorTasks(after.repo?.path || repoPath)
  return buildVerificationReport(before, after, validation, tasks)
}
