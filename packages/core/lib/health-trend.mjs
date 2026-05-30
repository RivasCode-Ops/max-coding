/**
 * Tendência de health por repositório (Fase 3)
 */
export function getHealthTrend(db, repoSlug, limit = 20) {
  const rows = db
    .prepare(
      `SELECT a.id, a.health_overall, a.health_grade, a.mode, a.created_at
       FROM analyses a
       JOIN repositories r ON r.id = a.repository_id
       WHERE r.slug = ?
       ORDER BY a.created_at DESC
       LIMIT ?`,
    )
    .all(repoSlug, limit)
    .reverse()

  if (rows.length < 2) {
    return { points: rows, trend: 'stable', delta: 0 }
  }

  const first = rows[0].health_overall
  const last = rows[rows.length - 1].health_overall
  const delta = last - first
  let trend = 'stable'
  if (delta > 5) trend = 'up'
  if (delta < -5) trend = 'down'

  return { points: rows, trend, delta, first, last }
}

export function listHealthTrendByRepoId(db, repoId, limit = 20) {
  return db
    .prepare(
      `SELECT id, health_overall, health_grade, mode, created_at
       FROM analyses WHERE repository_id = ? ORDER BY created_at ASC LIMIT ?`,
    )
    .all(repoId, limit)
}
