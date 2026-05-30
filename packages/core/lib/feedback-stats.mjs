/**
 * Estatísticas agregadas de feedback (Fase 6)
 */
export function getFeedbackSummary(db) {
  const rows = db
    .prepare(`SELECT useful, COUNT(*) AS n FROM recommendation_feedback GROUP BY useful`)
    .all()
  let useful = 0
  let notUseful = 0
  for (const r of rows) {
    if (r.useful) useful = r.n
    else notUseful = r.n
  }
  const total = useful + notUseful
  return {
    total,
    useful,
    notUseful,
    usefulPct: total ? Math.round((useful / total) * 100) : null,
  }
}

export function getFeedbackStatsForAnalysis(db, analysisId) {
  const prefix = `${analysisId}-%`
  const rows = db
    .prepare(
      `SELECT recommendation_id, useful, COUNT(*) AS n
       FROM recommendation_feedback
       WHERE recommendation_id LIKE ?
       GROUP BY recommendation_id, useful`,
    )
    .all(prefix)

  const map = {}
  for (const r of rows) {
    const shortId = r.recommendation_id.replace(`${analysisId}-`, '')
    if (!map[shortId]) map[shortId] = { useful: 0, notUseful: 0 }
    if (r.useful) map[shortId].useful = r.n
    else map[shortId].notUseful = r.n
  }
  return map
}
