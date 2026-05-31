/**
 * Apply local — Fase 28
 * Correções automáticas (pilot) sem Cursor IDE
 */
import { mapRecToPilotFix, buildCursorApplyPrompt } from './cursor-apply.mjs'
import { applyPilotFixes } from './apply-pilot.mjs'
import { buildPlanApplyView } from './apply-plan.mjs'
import { verifyImplementation } from './verify-apply.mjs'

export function applyRecommendationLocally(analysisResult, recommendationId, options = {}) {
  const rec = (analysisResult.recommendations || []).find((r) => r.id === recommendationId)
  if (!rec) throw new Error(`Recomendação ${recommendationId} não encontrada`)

  const repoPath = analysisResult.repo?.path
  const pilotFix = mapRecToPilotFix(rec)

  if (pilotFix && repoPath) {
    const pilotResult = applyPilotFixes(repoPath, {
      fixes: [pilotFix],
      slug: analysisResult.repo.slug,
      dryRun: Boolean(options.dryRun),
      force: Boolean(options.force),
    })
    const fix = pilotResult.results[0]
    const written = fix?.written || fix?.path
    return {
      mode: 'local',
      recommendationId,
      title: rec.title,
      pilotFix,
      ok: Boolean(fix?.ok),
      manual: false,
      pilotResult: fix,
      files: written ? [String(written)] : [],
      summary: fix?.skipped
        ? `${pilotFix}: já existe`
        : fix?.dryRun
          ? `${pilotFix}: preview`
          : fix?.written
            ? `${pilotFix}: escrito`
            : `${pilotFix}: ok`,
    }
  }

  const guidance = buildCursorApplyPrompt(rec, {
    repo: analysisResult.repo,
    profile: analysisResult.profile,
    health: analysisResult.health,
  })

  return {
    mode: 'local',
    recommendationId,
    title: rec.title,
    pilotFix: null,
    ok: false,
    manual: true,
    reason: 'sem fix automático — edite manualmente ou use Cursor',
    guidance: guidance.slice(0, 800),
    summary: `${rec.title}: requer edição manual`,
  }
}

export function applyBatchLocally(analysisResult, options = {}) {
  const maxPriority = options.maxPriority ?? 2
  const recs = (analysisResult.recommendations || []).filter((r) => (r.priority ?? 3) <= maxPriority)
  const results = recs.map((r) =>
    applyRecommendationLocally(analysisResult, r.id, {
      dryRun: options.dryRun,
      force: options.force,
    }),
  )
  const applied = results.filter((r) => r.ok && !r.manual)
  const manual = results.filter((r) => r.manual)

  return {
    mode: 'local',
    count: applied.length,
    applied,
    manual,
    results,
  }
}

export function applyApprovedPlanItemsLocally(analysisResult, approvedIds, options = {}) {
  const view = buildPlanApplyView(analysisResult)
  const approved = new Set(approvedIds || [])
  const applied = []
  const skipped = []

  for (const item of view.items) {
    const picked =
      approved.has(item.backlogId) || (item.recommendationId && approved.has(item.recommendationId))
    if (!picked) {
      skipped.push({ ...item, reason: 'not-approved' })
      continue
    }
    if (!item.recommendationId) {
      skipped.push({ ...item, reason: 'no-recommendation' })
      continue
    }
    try {
      const result = applyRecommendationLocally(analysisResult, item.recommendationId, options)
      if (result.ok) applied.push({ ...item, result })
      else skipped.push({ ...item, reason: result.manual ? 'manual-only' : result.reason || 'failed', result })
    } catch (err) {
      skipped.push({ ...item, reason: err.message || String(err) })
    }
  }

  return {
    mode: 'local',
    count: applied.length,
    manualCount: skipped.filter((s) => s.reason === 'manual-only' || s.result?.manual).length,
    applied,
    skipped,
    view,
  }
}

export function summarizeLocalPlanWorkflow(applyResult, verifyReport) {
  const parts = [`${applyResult.count} fix(es) local`]
  if (applyResult.manualCount) parts.push(`${applyResult.manualCount} manual`)
  if (applyResult.skipped.filter((s) => s.reason === 'not-approved').length) {
    parts.push(`${applyResult.skipped.length} ignorado(s)`)
  }
  if (verifyReport?.verdict) parts.push(`verify ${verifyReport.verdict}`)
  return parts.join(' · ')
}

export async function executeLocalPlanWorkflow(analysisResult, approvedIds, options = {}) {
  const apply = applyApprovedPlanItemsLocally(analysisResult, approvedIds, {
    dryRun: Boolean(options.dryRun),
    force: Boolean(options.force),
  })

  let verify = null
  if (options.verifyAfter && analysisResult.repo?.path && !options.dryRun) {
    verify = await verifyImplementation(analysisResult.repo.path, {
      baselineAnalysisId: options.baselineAnalysisId ?? analysisResult.analysisId,
      validateRepo: options.validateRepo !== false,
    })
  }

  return {
    phase: 'plan-apply-local',
    mode: 'local',
    apply,
    verify,
    summary: summarizeLocalPlanWorkflow(apply, verify),
  }
}

export async function runLocalApply(repoPath, options = {}) {
  const { analyzeRepository } = await import('./analyze.mjs')
  const analysisResult = await analyzeRepository(repoPath, {
    mode: options.mode || 'quick',
    writeReports: false,
    persistSqlite: options.persist !== false,
  })

  if (options.recommendationId) {
    return applyRecommendationLocally(analysisResult, options.recommendationId, options)
  }

  if (options.approvedIds?.length) {
    return executeLocalPlanWorkflow(analysisResult, options.approvedIds, options)
  }

  return applyBatchLocally(analysisResult, options)
}
