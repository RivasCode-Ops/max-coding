/**
 * Motor de achados — Max Stack PRD V1
 */
let seq = 0

export function resetFindingSeq(n = 0) {
  seq = n
}

export function createFinding(partial) {
  seq += 1
  const evidence = normalizeEvidence(partial.evidence)
  if (!evidence.length && partial.findingType === 'confirmed') {
    throw new Error(`Achado confirmado sem evidência: ${partial.title}`)
  }
  return {
    id: partial.id || `find-${String(seq).padStart(3, '0')}`,
    title: partial.title,
    category: partial.category,
    severity: partial.severity || 'medium',
    findingType: partial.findingType || 'suggestion',
    justification: partial.justification || '',
    evidence,
    affectedAreas: partial.affectedAreas || [],
    impact: partial.impact || 'medio',
    effort: partial.effort || 'medio',
    risk: partial.risk || 'baixo',
    priority: partial.priority ?? 2,
    sourceRole: partial.sourceRole || 'Repo Scout',
  }
}

function normalizeEvidence(evidence) {
  if (!evidence) return []
  if (Array.isArray(evidence)) {
    return evidence.map((e) =>
      typeof e === 'string' ? { kind: 'signal', ref: e } : { kind: e.kind || 'file', ref: e.ref || e.id || '' },
    )
  }
  return [{ kind: 'signal', ref: String(evidence) }]
}

export function findingsToRecommendations(findings) {
  return findings
    .filter((f) => f.findingType !== 'confirmed' || f.severity !== 'low')
    .map((f, i) => ({
      id: `rec-${String(i + 1).padStart(3, '0')}`,
      category: f.category,
      title: f.title,
      problem: f.justification,
      referencePattern: f.sourceRole,
      references: [],
      suggestedUpgrade: f.justification,
      impact: f.impact,
      effort: f.effort,
      risk: f.risk,
      priority: f.priority,
      affectedAreas: f.affectedAreas,
      executionMode: 'recommendation',
      findingId: f.id,
    }))
}

export function toBacklogFromFindings(items) {
  return (items || []).map((f) => ({
    id: f.id,
    title: f.title,
    priority: f.priority ?? 2,
    tasks: [f.justification || f.suggestedUpgrade || f.problem || f.title],
    acceptance: [
      f.evidence?.length
        ? `Evidência: ${f.evidence.map((e) => e.ref).join(', ')}`
        : 'Critério de aceite definido',
    ],
  }))
}

export function toChecklist(findings) {
  return findings.map((f) => ({
    id: f.id,
    done: false,
    item: `[${f.category}] ${f.title}`,
    evidence: f.evidence.map((e) => e.ref),
  }))
}

export function toPrPlan(findings, repo) {
  return {
    repo: repo.slug,
    branches: [`max-stack/${repo.slug}-improvements`],
    commits: findings.slice(0, 8).map((f, i) => ({
      order: i + 1,
      message: `fix(${f.category}): ${f.title}`,
      files: f.affectedAreas,
      findingId: f.id,
    })),
    note: 'Plano sugerido — não aplicar sem revisão humana',
  }
}

export function toExecutiveSummary(result) {
  const gaps = (result.findings || []).filter((f) => f.findingType !== 'confirmed' || f.severity !== 'low')
  return {
    repo: result.repo?.slug,
    health: result.health?.summary,
    stack: (result.profile?.summary?.frameworks || []).join(', ') || '—',
    topGaps: gaps.slice(0, 5).map((f) => f.title),
    recommendationCount: (result.recommendations || []).length,
    mode: result.mode,
  }
}

export function verifyFindings(findings) {
  const issues = []
  for (const f of findings) {
    if (f.findingType === 'confirmed' && !f.evidence?.length) {
      issues.push(`${f.id}: confirmado sem evidência`)
    }
    if (!f.title || !f.category) issues.push(`${f.id}: campos obrigatórios`)
  }
  return { ok: issues.length === 0, issues }
}

export function dedupeFindings(arr) {
  const seen = new Set()
  return arr.filter((f) => {
    if (seen.has(f.title)) return false
    seen.add(f.title)
    return true
  })
}
