/**
 * Watch portfolio — Fase 17
 * Re-scan periódico de repos com alertas (crítico/aviso/stale)
 */
import { analyzeRepository } from './analyze.mjs'
import { appendWatchLog, listWatchLog } from './db.mjs'
import { buildPortfolioAlerts } from './portfolio-alerts.mjs'

const WATCH_CODES = new Set(['low-health', 'health-regression', 'stale-scan', 'never-scanned'])

export function pickWatchTargets(alerts, options = {}) {
  const level = options.level ?? null
  const max = options.max ?? 5
  const slugs = options.slugs?.length ? new Set(options.slugs) : null
  const seen = new Set()
  const targets = []

  for (const alert of alerts) {
    if (level && alert.level !== level) continue
    if (slugs && !slugs.has(alert.slug)) continue
    if (!WATCH_CODES.has(alert.code) && alert.action !== 'scan') continue
    if (!alert.path || seen.has(alert.slug)) continue
    seen.add(alert.slug)
    targets.push({
      slug: alert.slug,
      path: alert.path,
      code: alert.code,
      level: alert.level,
      health: alert.health,
    })
    if (targets.length >= max) break
  }

  return targets
}

export function summarizeWatchRun(results, dryRun = false) {
  const ok = results.filter((r) => r.ok).length
  const failed = results.length - ok
  const regressions = results.filter((r) => r.ok && (r.healthDelta ?? 0) <= -5).length
  const prefix = dryRun ? 'Preview watch' : 'Watch portfolio'
  return `${prefix}: ${ok}/${results.length} ok${failed ? ` · ${failed} falha(s)` : ''}${regressions ? ` · ${regressions} regressão(ões)` : ''}`
}

export async function runPortfolioWatchTick(items, db, options = {}) {
  const dryRun = Boolean(options.dryRun)
  const { alerts } = buildPortfolioAlerts(items, db, options.alertOptions)
  const targets = pickWatchTargets(alerts, options)
  const results = []
  const at = new Date().toISOString()

  for (const target of targets) {
    if (dryRun) {
      results.push({
        ok: true,
        slug: target.slug,
        path: target.path,
        code: target.code,
        level: target.level,
        health: target.health,
        preview: true,
        at,
      })
      continue
    }

    try {
      const t0 = Date.now()
      const result = await analyzeRepository(target.path, {
        mode: 'quick',
        writeReports: false,
        githubSearch: false,
      })
      const healthDelta = result.scanDiff?.hasPrevious ? result.scanDiff.healthDelta : null
      const entry = {
        ok: true,
        slug: target.slug,
        path: target.path,
        code: target.code,
        level: target.level,
        health: result.health?.overall,
        healthSummary: result.health?.summary,
        healthDelta,
        analysisId: result.analysisId,
        durationMs: Date.now() - t0,
        at,
      }
      results.push(entry)
      if (db) appendWatchLog(db, entry)
    } catch (err) {
      const entry = {
        ok: false,
        slug: target.slug,
        path: target.path,
        code: target.code,
        error: err.message || String(err),
        at,
      }
      results.push(entry)
      if (db) appendWatchLog(db, entry)
    }
  }

  return {
    dryRun,
    at,
    summary: summarizeWatchRun(results, dryRun),
    targets: targets.length,
    results,
    alertsTotal: alerts.length,
  }
}

export function getWatchLog(db, limit = 20) {
  return listWatchLog(db, limit)
}

export { buildPortfolioAlerts }
