/**
 * Pipeline Max Stack — fases por papel (determinístico, local-first)
 */
import { recommendFromProfile } from '../../recommender/lib/recommend.mjs'
import { analyzeCategories } from './categories.mjs'
import {
  createFinding,
  findingsToRecommendations,
  resetFindingSeq,
  toBacklogFromFindings,
  toChecklist,
  toExecutiveSummary,
  toPrPlan,
  verifyFindings,
} from './findings.mjs'

export function runPipeline(profile, mode = 'quick') {
  resetFindingSeq(0)
  const runs = []
  const t0 = () => new Date().toISOString()

  runs.push({ agent: 'Repo Scout', phase: 'INTAKE', startedAt: t0(), finishedAt: t0() })

  const categoryResult = analyzeCategories(profile)
  let findings = [...categoryResult.findings]
  runs.push({ agent: 'Architecture Auditor', phase: 'AUDIT', startedAt: t0(), finishedAt: t0() })
  runs.push({ agent: 'Security Auditor', phase: 'AUDIT', startedAt: t0(), finishedAt: t0() })
  runs.push({ agent: 'Performance Reviewer', phase: 'AUDIT', startedAt: t0(), finishedAt: t0() })

  let externalPatterns = []
  let catalogRecommendations = []

  if (mode === 'deep') {
    runs.push({ agent: 'Pattern Hunter', phase: 'HUNT', startedAt: t0(), finishedAt: t0() })
    const rec = recommendFromProfile(profile)
    catalogRecommendations = rec.recommendations
    externalPatterns = (rec.references || []).map((r) => ({
      catalogId: pickCatalog(profile),
      sourceRepo: r.repo,
      url: r.url,
      patterns: r.patterns || [],
    }))

    for (const r of catalogRecommendations) {
      findings.push(
        createFinding({
          id: r.id.replace('rec', 'find'),
          category: mapRecCategory(r.category),
          title: r.title,
          findingType: 'suggestion',
          severity: r.priority === 1 ? 'high' : 'medium',
          justification: r.problem,
          evidence: r.affectedAreas,
          affectedAreas: r.affectedAreas,
          impact: r.impact,
          effort: r.effort,
          risk: r.risk,
          priority: r.priority,
          sourceRole: 'Pattern Hunter',
        }),
      )
    }
  }

  findings = dedupeFindings(findings)

  const catalogRecs = findingsToRecommendations(
    findings.filter((f) => f.sourceRole === 'Pattern Hunter'),
  )
  const allFindingsRecs = findingsToRecommendations(findings)
  const recommendations = dedupeRecommendations([...catalogRecs, ...allFindingsRecs, ...catalogRecommendations])

  runs.push({ agent: 'Patch Planner', phase: 'PLAN', startedAt: t0(), finishedAt: t0() })

  const verification = verifyFindings(findings)
  runs.push({
    agent: 'QA Verifier',
    phase: 'VERIFY',
    startedAt: t0(),
    finishedAt: t0(),
    ok: verification.ok,
    issues: verification.issues,
  })

  const health = {
    overall: categoryResult.overall,
    grade: categoryResult.grade,
    categories: categoryResult.categories,
    summary: categoryResult.summary,
  }

  return {
    health,
    findings,
    recommendations,
    externalPatterns,
    backlog: toBacklogFromFindings(recommendations.length ? recommendations : findings),
    checklist: toChecklist(findings),
    runs,
    verification,
  }
}

function pickCatalog(profile) {
  const fw = profile.summary?.frameworks || []
  if (fw.includes('vite')) return 'practices-vite-kanban'
  if (fw.includes('next')) return 'practices-next-app'
  if (fw.includes('streamlit')) return 'practices-streamlit'
  return 'practices-node-api'
}

function mapRecCategory(cat) {
  const m = {
    testes: 'testes',
    infraestrutura: 'ci_cd',
    dx: 'developer_experience',
    arquitetura: 'arquitetura_modularidade',
    observabilidade: 'maturidade_operacional',
    padronizacao: 'qualidade_codigo',
  }
  return m[cat] || 'qualidade_codigo'
}

function dedupeRecommendations(recs) {
  const seen = new Set()
  return recs.filter((r) => {
    const k = r.title
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function dedupeFindings(arr) {
  const seen = new Set()
  return arr.filter((f) => {
    if (seen.has(f.title)) return false
    seen.add(f.title)
    return true
  })
}

export { toExecutiveSummary, toPrPlan }
