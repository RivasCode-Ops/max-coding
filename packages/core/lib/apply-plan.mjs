/**
 * Fluxo apply plan — Fase 26
 * plan → aprovar itens → cursor-batch → verify
 */
import { applyRecommendationViaCursor, mapRecToPilotFix } from './cursor-apply.mjs'
import { buildPlanPackage } from './plan-package.mjs'
import { verifyImplementation } from './verify-apply.mjs'

export function resolveRecommendationId(backlogItem, recommendations = []) {
  const exact = recommendations.find((r) => r.id === backlogItem.id)
  if (exact) return exact.id

  const byTitle = recommendations.find((r) => r.title === backlogItem.title)
  if (byTitle) return byTitle.id

  const m = String(backlogItem.id || '').match(/^find-(\d+)$/)
  if (m) {
    const recId = `rec-${m[1].padStart(3, '0')}`
    if (recommendations.some((r) => r.id === recId)) return recId
  }

  return null
}

export function buildPlanApplyView(analysisResult) {
  const pkg = buildPlanPackage(analysisResult)
  const recommendations = analysisResult.recommendations || []
  const items = (pkg.backlog || []).map((b) => {
    const recommendationId = resolveRecommendationId(b, recommendations)
    const rec = recommendations.find((r) => r.id === recommendationId)
    const pilotFix = rec ? mapRecToPilotFix(rec) : null
    return {
      backlogId: b.id,
      recommendationId,
      title: b.title,
      priority: b.priority ?? 3,
      tasks: b.tasks || [],
      applyable: Boolean(recommendationId),
      localApplyable: Boolean(pilotFix),
      pilotFix,
      suggested: (b.priority ?? 3) <= 2,
    }
  })

  return {
    product: 'Max Stack',
    phase: 'plan-apply',
    slug: pkg.repo?.slug,
    path: pkg.repo?.path,
    analysisId: analysisResult.analysisId,
    authorization: pkg.authorization,
    verification: pkg.verification,
    items,
    applyableCount: items.filter((i) => i.applyable).length,
    suggestedIds: items.filter((i) => i.suggested && i.applyable).map((i) => i.backlogId),
  }
}

export function applyApprovedPlanItems(analysisResult, approvedIds, options = {}) {
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
      const result = applyRecommendationViaCursor(analysisResult, item.recommendationId, options)
      applied.push({ ...item, result })
    } catch (err) {
      skipped.push({ ...item, reason: err.message || String(err) })
    }
  }

  return {
    count: applied.length,
    applied,
    skipped,
    view,
  }
}

export function summarizePlanWorkflow(applyResult, verifyReport) {
  const parts = [`${applyResult.count} task(s) Cursor`]
  if (applyResult.skipped.length) parts.push(`${applyResult.skipped.length} ignorado(s)`)
  if (verifyReport?.verdict) parts.push(`verify ${verifyReport.verdict}`)
  return parts.join(' · ')
}

export async function executePlanWorkflow(analysisResult, approvedIds, options = {}) {
  const apply = applyApprovedPlanItems(analysisResult, approvedIds, {
    writeFile: options.writeFile !== false,
  })

  let verify = null
  if (options.verifyAfter && analysisResult.repo?.path) {
    verify = await verifyImplementation(analysisResult.repo.path, {
      baselineAnalysisId: options.baselineAnalysisId ?? analysisResult.analysisId,
      validateRepo: options.validateRepo !== false,
    })
  }

  return {
    phase: 'plan-apply',
    apply,
    verify,
    summary: summarizePlanWorkflow(apply, verify),
  }
}
