/**
 * Diff entre duas análises do mesmo repositório (Fase 2)
 */
export function diffAnalyses(current, previous) {
  if (!previous?.health) {
    return { hasPrevious: false, message: 'Primeira análise deste repositório' }
  }

  const curTitles = new Set((current.findings || []).map((f) => f.title))
  const prevTitles = new Set((previous.findings || []).map((f) => f.title))

  const newFindings = [...curTitles].filter((t) => !prevTitles.has(t))
  const resolvedFindings = [...prevTitles].filter((t) => !curTitles.has(t))
  const unchangedFindings = [...curTitles].filter((t) => prevTitles.has(t))

  const curCats = Object.fromEntries(
    (current.health?.categories || []).map((c) => [c.id, c.score]),
  )
  const prevCats = Object.fromEntries(
    (previous.health?.categories || []).map((c) => [c.id, c.score]),
  )
  const categoryDelta = Object.keys({ ...curCats, ...prevCats }).map((id) => ({
    id,
    delta: (curCats[id] ?? 0) - (prevCats[id] ?? 0),
  }))

  return {
    hasPrevious: true,
    previousAnalysisId: previous.analysisId,
    previousAt: previous.generatedAt,
    healthDelta: (current.health?.overall ?? 0) - (previous.health?.overall ?? 0),
    gradeBefore: previous.health?.grade,
    gradeAfter: current.health?.grade,
    newFindings,
    resolvedFindings,
    unchangedCount: unchangedFindings.length,
    categoryDelta: categoryDelta.filter((c) => c.delta !== 0),
    improved: (current.health?.overall ?? 0) > (previous.health?.overall ?? 0),
  }
}
