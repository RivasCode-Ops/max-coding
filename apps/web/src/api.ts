import type { ActionSuggestion, AnalysisResult, CursorApplyResult, EvolveBatchResult, EvolveResult, FeedbackRecStats, FeedbackSummary, HistoryItem, IssuesPublishResult, PlanPackage, PortfolioAlert, PortfolioAlertsSummary, PortfolioChart, PortfolioItem, PortfolioSummary, PortfolioWatchResult, Status, SuggestActionResult, CursorTaskFile, VerificationReport, RepoContext, RepoCompareResult, WatchLogEntry } from './types'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText)
  return data as T
}

export const getStatus = () => api<Status>('/api/status')
export const listHistory = () => api<{ items: HistoryItem[] }>('/api/analyses?limit=25')
export const getAnalysis = (id: number) => api<{ data: AnalysisResult }>(`/api/analyses/${id}`)

export function analyze(path: string, mode: 'quick' | 'deep', opts?: { validateRepo?: boolean; applyRules?: boolean }) {
  return api<{ id: number; data: AnalysisResult }>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ path, mode, ...opts }),
  })
}

export function sendFeedback(recommendationId: string, analysisId: number | undefined, useful: boolean) {
  return api<{ recommendationId: string; useful: boolean }>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ recommendationId, analysisId, useful }),
  })
}

export function validateRepo(path: string) {
  return api<{ ok: boolean; skipped?: boolean; results: { script: string; ok: boolean; durationMs: number }[] }>(
    '/api/validate-repo',
    { method: 'POST', body: JSON.stringify({ path }) },
  )
}

export function getTrend(slug: string) {
  return api<{ points: { health_overall: number; created_at: string }[]; trend: string; delta: number }>(
    `/api/repositories/${encodeURIComponent(slug)}/trend`,
  )
}

export function applyRules(analysisId: number) {
  return api<{ written: string; filename: string }>('/api/apply-rules', {
    method: 'POST',
    body: JSON.stringify({ analysisId }),
  })
}

export function getPortfolio(root = 'c:\\_PROJETOS') {
  return api<{ root: string; summary: PortfolioSummary; items: PortfolioItem[]; chart?: PortfolioChart }>(
    `/api/portfolio?root=${encodeURIComponent(root)}`,
  )
}

export function installHook(path: string) {
  return api<{ written: string }>('/api/install-hook', {
    method: 'POST',
    body: JSON.stringify({ path }),
  })
}

export function postPrComment(ownerRepo: string, pullNumber: number, mode: 'quick' | 'deep' = 'quick', dryRun = false) {
  return api<{ commentUrl?: string; preview?: string; health: { summary: string } }>('/api/github/pr-comment', {
    method: 'POST',
    body: JSON.stringify({ ownerRepo, pullNumber, mode, dryRun }),
  })
}

export function getFeedbackSummary() {
  return api<FeedbackSummary>('/api/feedback/summary')
}

export function getAnalysisFeedback(analysisId: number) {
  return api<{ stats: Record<string, FeedbackRecStats> }>(`/api/analyses/${analysisId}/feedback`)
}

export function applyPilot(path: string, dryRun = false) {
  return api<{
    before: { health: { summary: string; overall: number } }
    after: { health: { summary: string; overall: number } }
    delta: number
    applied: { planned: string[]; results: { fixId: string; written?: string; skipped?: boolean }[] }
  }>('/api/apply-pilot', {
    method: 'POST',
    body: JSON.stringify({ path, dryRun }),
  })
}

export function cursorApply(path: string, recommendationId: string, analysisId?: number, autoPilot = false) {
  return api<CursorApplyResult>('/api/cursor/apply', {
    method: 'POST',
    body: JSON.stringify({ path, recommendationId, analysisId, autoPilot }),
  })
}

export function suggestAction(path: string, request: string, analysisId?: number) {
  return api<SuggestActionResult>('/api/suggest-action', {
    method: 'POST',
    body: JSON.stringify({ path, request, analysisId }),
  })
}

export function listCursorTasks(path: string) {
  return api<{ slug: string; tasks: CursorTaskFile[]; records: unknown[] }>(
    `/api/cursor/tasks?path=${encodeURIComponent(path)}`,
  )
}

export function cursorApplyBatch(path: string, analysisId?: number, maxPriority = 2) {
  return api<{ count: number; applied: CursorApplyResult[] }>('/api/cursor/apply-batch', {
    method: 'POST',
    body: JSON.stringify({ path, analysisId, maxPriority }),
  })
}

export function verifyImplementation(path: string, analysisId?: number, validateRepo = true) {
  return api<VerificationReport>('/api/verify', {
    method: 'POST',
    body: JSON.stringify({ path, analysisId, validateRepo }),
  })
}

export function getRepoContext(path: string, analysisId?: number) {
  const q = new URLSearchParams({ path })
  if (analysisId) q.set('analysisId', String(analysisId))
  return api<RepoContext>(`/api/repo-context?${q}`)
}

export function getAnalysisReport(analysisId: number) {
  return api<{ markdown: string; slug: string }>(`/api/analyses/${analysisId}/report`)
}

export function getAnalysisPlan(analysisId: number) {
  return api<{ markdown: string; slug: string; auditMode: 'plan' }>(
    `/api/analyses/${analysisId}/plan?format=md`,
  )
}

export function exportPlan(path: string, analysisId?: number) {
  return api<{ markdown: string; slug: string; auditMode: 'plan'; package: PlanPackage }>('/api/plan', {
    method: 'POST',
    body: JSON.stringify({ path, analysisId, includeIssues: true }),
  })
}

export function compareRepos(pathA: string, pathB: string) {
  return api<RepoCompareResult>('/api/compare', {
    method: 'POST',
    body: JSON.stringify({ pathA, pathB }),
  })
}

export function evolveRepo(path: string, dryRun = false) {
  return api<EvolveResult>('/api/evolve', {
    method: 'POST',
    body: JSON.stringify({ path, dryRun, applyPilot: true, validateRepo: !dryRun }),
  })
}

export function rescanPortfolio(root: string) {
  return api<{ root: string; summary: PortfolioSummary; items: PortfolioItem[]; rescanned: number }>(
    '/api/portfolio/rescan',
    { method: 'POST', body: JSON.stringify({ root }) },
  )
}

export function getPortfolioAlerts(root: string) {
  return api<{ root: string; alerts: PortfolioAlert[]; summary: PortfolioAlertsSummary }>(
    `/api/portfolio/alerts?root=${encodeURIComponent(root)}`,
  )
}

export function evolvePortfolioBatch(root: string, dryRun = false, max = 3) {
  return api<EvolveBatchResult>('/api/portfolio/evolve-batch', {
    method: 'POST',
    body: JSON.stringify({ root, dryRun, max, level: 'critical' }),
  })
}

export function publishIssuesToGithub(analysisId: number, ownerRepo?: string, dryRun = false) {
  return api<IssuesPublishResult>('/api/github/publish-issues', {
    method: 'POST',
    body: JSON.stringify({ analysisId, ownerRepo, dryRun, max: 5 }),
  })
}

export function runPortfolioWatch(root: string, dryRun = false, max = 5) {
  return api<PortfolioWatchResult>('/api/portfolio/watch', {
    method: 'POST',
    body: JSON.stringify({ root, dryRun, max }),
  })
}

export function getPortfolioWatchLog(limit = 20) {
  return api<{ items: WatchLogEntry[] }>(`/api/portfolio/watch/log?limit=${limit}`)
}
