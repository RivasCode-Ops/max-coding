/**
 * Alertas de portfolio — Fase 13
 */
import { getHealthTrend } from './health-trend.mjs'
import { getRepositoryBySlug } from './db.mjs'

export function buildPortfolioAlerts(items, db, options = {}) {
  const threshold = options.threshold ?? 70
  const alerts = []

  for (const item of items) {
    const health = item.health
    const slug = item.slug
    const path = item.path

    if (typeof health === 'number' && health < threshold) {
      alerts.push({
        level: 'critical',
        slug,
        path,
        code: 'low-health',
        message: `Health ${health}/100 — abaixo de ${threshold}`,
        action: 'evolve',
        health,
      })
    }

    if (db && slug) {
      const trend = getHealthTrend(db, slug, 5)
      if (trend.trend === 'down' && trend.delta <= -5) {
        alerts.push({
          level: 'warning',
          slug,
          path,
          code: 'health-regression',
          message: `Tendência negativa (${trend.delta} pts nos últimos scans)`,
          action: 'scan',
          health,
        })
      }
    }

    const repo = db ? getRepositoryBySlug(db, slug) : null
    if (repo?.last_scanned_at) {
      const days = daysSince(repo.last_scanned_at)
      if (days > (options.staleDays ?? 30)) {
        alerts.push({
          level: 'info',
          slug,
          path,
          code: 'stale-scan',
          message: `Último scan há ${days} dias`,
          action: 'scan',
          health,
        })
      }
    } else if (!item.fromDb && typeof health === 'number') {
      alerts.push({
        level: 'info',
        slug,
        path,
        code: 'never-scanned',
        message: 'Nunca analisado no SQLite — rode Quick Scan',
        action: 'scan',
        health,
      })
    }
  }

  const deduped = dedupeAlerts(alerts)
  deduped.sort((a, b) => levelRank(a.level) - levelRank(b.level))

  return {
    alerts: deduped.slice(0, options.max ?? 20),
    summary: {
      critical: deduped.filter((a) => a.level === 'critical').length,
      warning: deduped.filter((a) => a.level === 'warning').length,
      info: deduped.filter((a) => a.level === 'info').length,
      total: deduped.length,
    },
  }
}

function levelRank(level) {
  return { critical: 0, warning: 1, info: 2 }[level] ?? 3
}

function daysSince(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function dedupeAlerts(alerts) {
  const seen = new Set()
  return alerts.filter((a) => {
    const key = `${a.slug}:${a.code}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
