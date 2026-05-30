/**
 * Metas de health do portfolio — Fase 22
 */
import { getAppSetting, setAppSetting } from './db.mjs'

export const GOALS_SETTINGS_KEY = 'portfolio_goals'

export const DEFAULT_PORTFOLIO_GOALS = {
  minHealth: 70,
  targetHealth: 85,
  enabled: true,
}

export function normalizePortfolioGoals(raw) {
  const merged = { ...DEFAULT_PORTFOLIO_GOALS, ...(raw || {}) }
  merged.minHealth = clamp(Number(merged.minHealth) || DEFAULT_PORTFOLIO_GOALS.minHealth, 0, 100)
  merged.targetHealth = clamp(Number(merged.targetHealth) || DEFAULT_PORTFOLIO_GOALS.targetHealth, 0, 100)
  if (merged.targetHealth < merged.minHealth) {
    merged.targetHealth = merged.minHealth
  }
  merged.enabled = Boolean(merged.enabled)
  return merged
}

export function getPortfolioGoals(db) {
  if (!db) return { ...DEFAULT_PORTFOLIO_GOALS }
  const raw = getAppSetting(db, GOALS_SETTINGS_KEY)
  if (!raw) return { ...DEFAULT_PORTFOLIO_GOALS }
  try {
    return normalizePortfolioGoals(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_PORTFOLIO_GOALS }
  }
}

export function savePortfolioGoals(db, goals) {
  const normalized = normalizePortfolioGoals(goals)
  setAppSetting(db, GOALS_SETTINGS_KEY, JSON.stringify(normalized))
  return normalized
}

export function buildGoalAlerts(items, goals) {
  if (!goals.enabled) return []
  const alerts = []

  for (const item of items) {
    const health = item.health
    if (typeof health !== 'number') continue

    if (health < goals.minHealth) {
      alerts.push({
        level: 'critical',
        slug: item.slug,
        path: item.path,
        code: 'below-goal',
        message: `Health ${health}/100 — abaixo da meta mínima (${goals.minHealth})`,
        action: 'evolve',
        health,
        goal: goals.minHealth,
      })
    } else if (health < goals.targetHealth) {
      alerts.push({
        level: 'warning',
        slug: item.slug,
        path: item.path,
        code: 'under-target',
        message: `Health ${health}/100 — abaixo da meta alvo (${goals.targetHealth})`,
        action: 'scan',
        health,
        goal: goals.targetHealth,
      })
    }
  }

  return alerts
}

export function goalsProgress(items, goals) {
  const withHealth = items.filter((i) => typeof i.health === 'number')
  const atTarget = withHealth.filter((i) => i.health >= goals.targetHealth).length
  const atMin = withHealth.filter((i) => i.health >= goals.minHealth).length
  return {
    total: withHealth.length,
    atTarget,
    atMin,
    belowMin: withHealth.filter((i) => i.health < goals.minHealth).length,
    underTarget: withHealth.filter(
      (i) => i.health >= goals.minHealth && i.health < goals.targetHealth,
    ).length,
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}
