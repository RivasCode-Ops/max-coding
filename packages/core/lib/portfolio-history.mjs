/**
 * Histórico de health multi-repo — Fase 18
 */
import { getHealthTrend } from './health-trend.mjs'

export function buildRepoHistoryEntry(db, item, options = {}) {
  const limit = options.pointsPerRepo ?? 8
  const trend = getHealthTrend(db, item.slug, limit)
  if (!trend.points.length) return null

  const last = trend.points[trend.points.length - 1]
  return {
    slug: item.slug,
    path: item.path,
    currentHealth: typeof item.health === 'number' ? item.health : last.health_overall,
    trend: trend.trend,
    delta: trend.delta,
    scanCount: trend.points.length,
    points: trend.points.map((p) => ({
      health: p.health_overall,
      grade: p.health_grade,
      mode: p.mode,
      at: p.created_at,
    })),
  }
}

export function buildPortfolioHistory(db, items, options = {}) {
  const maxRepos = options.maxRepos ?? 16
  const minPoints = options.minPoints ?? 2
  const repos = []

  const sorted = [...items].sort((a, b) => {
    const ha = a.health ?? 0
    const hb = b.health ?? 0
    return ha - hb
  })

  for (const item of sorted) {
    const entry = buildRepoHistoryEntry(db, item, options)
    if (!entry) continue
    if (entry.points.length < minPoints && !options.includeSingle) continue
    repos.push(entry)
    if (repos.length >= maxRepos) break
  }

  repos.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  return {
    repos,
    summary: summarizePortfolioHistory(repos),
  }
}

export function summarizePortfolioHistory(repos) {
  return {
    tracked: repos.length,
    improving: repos.filter((r) => r.trend === 'up').length,
    declining: repos.filter((r) => r.trend === 'down').length,
    stable: repos.filter((r) => r.trend === 'stable').length,
    withHistory: repos.filter((r) => (r.points?.length ?? 0) >= 2).length,
  }
}

export function historySparklineSvg(points, options = {}) {
  const width = options.width ?? 100
  const height = options.height ?? 28
  if (!points?.length) {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"></svg>`
  }
  const values = points.map((p) => p.health)
  const min = Math.max(0, Math.min(...values) - 3)
  const max = Math.min(100, Math.max(...values) + 3)
  const range = max - min || 1
  const pad = 2
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  const coords = points.map((p, i) => {
    const x = pad + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
    const y = pad + innerH - ((p.health - min) / range) * innerH
    return `${x},${y}`
  })

  const stroke = options.trend === 'down' ? '#ef4444' : options.trend === 'up' ? '#22c55e' : '#38bdf8'
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img">
    <polyline points="${coords.join(' ')}" fill="none" stroke="${stroke}" stroke-width="1.5"/>
  </svg>`
}
