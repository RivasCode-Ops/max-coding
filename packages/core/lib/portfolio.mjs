/**
 * Portfolio multi-repo — visão agregada (Fase 4)
 */
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import { analyzeCategories } from './categories.mjs'
import { listRepositories } from './db.mjs'

const SKIP = new Set(['node_modules', '.git', 'max-coding', 'data'])

export function discoverLocalRepos(rootDir) {
  const root = resolve(rootDir)
  if (!existsSync(root)) return []

  const out = []
  for (const name of readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory() || SKIP.has(name.name) || name.name.startsWith('.')) continue
    const full = join(root, name.name)
    if (isRepoRoot(full)) {
      out.push({ slug: name.name.toLowerCase().replace(/\s+/g, '-'), path: full, source: 'local' })
    }
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug))
}

function isRepoRoot(dir) {
  return (
    existsSync(join(dir, 'package.json')) ||
    existsSync(join(dir, '.git')) ||
    existsSync(join(dir, 'requirements.txt')) ||
    existsSync(join(dir, 'pyproject.toml'))
  )
}

export function quickScanPortfolio(repos) {
  return repos.map((r) => {
    const profile = scanRepo(r.path, r.slug)
    const health = analyzeCategories(profile)
    return {
      slug: r.slug,
      path: r.path,
      source: r.source || 'local',
      health: health.overall,
      grade: health.grade,
      summary: health.summary,
      frameworks: profile.summary?.frameworks || [],
      hasCi: profile.summary?.hasCi,
      scannedAt: profile.scannedAt,
    }
  })
}

export function buildPortfolioFromDb(db, options = {}) {
  const limit = options.limit ?? 50
  const rows = listRepositories(db).slice(0, limit)
  return rows.map((r) => ({
    slug: r.slug,
    path: r.path,
    source: r.source,
    url: r.url,
    health: r.last_health,
    analysisCount: r.analysis_count,
    lastScannedAt: r.last_scanned_at,
  }))
}

export function mergePortfolio(dbRepos, localRepos) {
  const bySlug = new Map()
  for (const r of dbRepos) bySlug.set(r.slug, { ...r, fromDb: true })
  for (const r of localRepos) {
    const existing = bySlug.get(r.slug)
    if (existing) {
      bySlug.set(r.slug, { ...existing, ...r, fromDb: true, fromDisk: true })
    } else {
      bySlug.set(r.slug, { ...r, fromDisk: true })
    }
  }
  return [...bySlug.values()].sort((a, b) => (b.health ?? 0) - (a.health ?? 0))
}

export function portfolioSummary(items) {
  const withHealth = items.filter((i) => typeof i.health === 'number')
  const avg = withHealth.length ? Math.round(withHealth.reduce((s, i) => s + i.health, 0) / withHealth.length) : 0
  return {
    total: items.length,
    withHealth: withHealth.length,
    averageHealth: avg,
    top: [...withHealth].sort((a, b) => b.health - a.health).slice(0, 5),
    needsAttention: withHealth.filter((i) => i.health < 70).slice(0, 5),
  }
}
