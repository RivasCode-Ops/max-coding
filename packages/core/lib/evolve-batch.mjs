/**
 * Evolução em lote — Fase 14
 * Evolve repos com alertas críticos do portfolio
 */
import { evolveRepository } from './evolve-repo.mjs'
import { buildPortfolioAlerts } from './portfolio-alerts.mjs'

export function pickEvolveTargets(alerts, options = {}) {
  const level = options.level ?? 'critical'
  const action = options.action ?? 'evolve'
  const seen = new Set()
  const targets = []

  for (const alert of alerts) {
    if (level && alert.level !== level) continue
    if (action && alert.action !== action) continue
    if (!alert.path || seen.has(alert.slug)) continue
    seen.add(alert.slug)
    targets.push({ slug: alert.slug, path: alert.path, health: alert.health, code: alert.code })
    if (targets.length >= (options.max ?? 5)) break
  }

  return targets
}

export function summarizeBatchResults(results, dryRun) {
  const ok = results.filter((r) => r.ok).length
  const failed = results.length - ok
  const improved = results.filter((r) => r.ok && (r.healthDelta ?? 0) > 0).length
  const prefix = dryRun ? 'Preview batch' : 'Batch evolve'
  return `${prefix}: ${ok}/${results.length} ok${failed ? ` · ${failed} falha(s)` : ''}${improved ? ` · ${improved} melhorou(ram)` : ''}`
}

export async function evolvePortfolioBatch(alerts, options = {}) {
  const dryRun = Boolean(options.dryRun)
  const targets = pickEvolveTargets(alerts, options)
  const results = []

  for (const target of targets) {
    try {
      const evolved = await evolveRepository(target.path, {
        dryRun,
        applyPilot: options.applyPilot !== false,
        validateRepo: !dryRun && options.validateRepo !== false,
        mode: options.mode === 'deep' ? 'deep' : 'quick',
      })
      const healthDelta = evolved.verification?.diff?.healthDelta ?? evolved.pilot?.delta ?? 0
      results.push({
        ok: true,
        slug: target.slug,
        path: target.path,
        summary: evolved.summary,
        healthDelta,
        verdict: evolved.verification?.verdict || (dryRun ? 'PREVIEW' : 'STABLE'),
        baseline: evolved.baseline?.health?.summary,
        final: evolved.final?.health?.summary,
      })
    } catch (err) {
      results.push({
        ok: false,
        slug: target.slug,
        path: target.path,
        error: err.message || String(err),
      })
    }
  }

  return {
    dryRun,
    summary: summarizeBatchResults(results, dryRun),
    targets: targets.length,
    results,
  }
}

export async function evolvePortfolioFromRoot(items, db, options = {}) {
  const { alerts } = buildPortfolioAlerts(items, db, options.alertOptions)
  return evolvePortfolioBatch(alerts, options)
}
