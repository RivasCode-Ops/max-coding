/**
 * Fluxo de evolução automática — Fase 12
 * scan → apply-pilot → verify → relatório
 */
import { analyzeRepository } from './analyze.mjs'
import { getDb, getAnalysis } from './db.mjs'
import { buildRepoContext } from './repo-context.mjs'
import { generateExecutiveReport } from './report-export.mjs'

export function buildEvolveSummary(baseline, pilot, verification, dryRun) {
  if (dryRun) {
    const planned = pilot?.applied?.planned || []
    return planned.length
      ? `Preview: ${planned.length} fix(es) — ${planned.join(', ')}`
      : 'Preview: nada a aplicar automaticamente'
  }
  const delta = verification?.diff?.healthDelta ?? pilot?.delta ?? 0
  const verdict = verification?.verdict || 'STABLE'
  return `${verdict}: health ${baseline.health?.summary} → ${verification?.after?.health?.summary || '—'} (${delta >= 0 ? '+' : ''}${delta} pts)`
}

export async function evolveRepository(repoPath, options = {}) {
  const dryRun = Boolean(options.dryRun)
  const mode = options.mode === 'deep' ? 'deep' : 'quick'

  const baseline = await analyzeRepository(repoPath, {
    mode,
    writeReports: false,
    persistSqlite: true,
    githubSearch: false,
    validateRepo: false,
  })

  let pilot = null
  if (options.applyPilot !== false) {
    const { runPilot } = await import('./apply-pilot.mjs')
    pilot = await runPilot(repoPath, { dryRun, mode, force: options.force })
  }

  let verification = null
  let finalAnalysis = baseline

  if (!dryRun) {
    const { verifyImplementation } = await import('./verify-apply.mjs')
    verification = await verifyImplementation(repoPath, {
      baselineAnalysisId: baseline.analysisId,
      validateRepo: options.validateRepo !== false,
      mode,
    })
    if (verification.afterAnalysis) {
      finalAnalysis = { ...verification.afterAnalysis, analysisId: verification.afterAnalysis.analysisId }
    } else if (verification.after?.analysisId) {
      const row = getAnalysis(getDb(), verification.after.analysisId)
      if (row) finalAnalysis = { ...row.data, analysisId: row.id }
    }
  }

  const context = buildRepoContext(repoPath, finalAnalysis)
  const reportMarkdown = generateExecutiveReport(finalAnalysis)

  return {
    dryRun,
    summary: buildEvolveSummary(baseline, pilot, verification, dryRun),
    baseline: {
      health: baseline.health,
      analysisId: baseline.analysisId,
      recommendations: baseline.recommendations?.length ?? 0,
    },
    pilot: pilot
      ? {
          planned: pilot.applied?.planned || [],
          delta: pilot.delta,
          dryRun,
          results: pilot.applied?.results?.map((r) => ({ fixId: r.fixId, written: r.written, skipped: r.skipped })),
        }
      : null,
    verification: verification
      ? {
          verdict: verification.verdict,
          summary: verification.summary,
          checklist: verification.checklist,
          diff: verification.diff,
        }
      : null,
    final: { health: finalAnalysis.health, analysisId: finalAnalysis.analysisId },
    context,
    reportMarkdown,
  }
}
