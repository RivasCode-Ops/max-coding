import type { ActionSuggestion, AnalysisResult, CursorApplyResult, FeedbackRecStats, FeedbackSummary, HistoryItem, PortfolioItem, PortfolioSummary, Status, SuggestActionResult } from './types'

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
  return api<{ root: string; summary: PortfolioSummary; items: PortfolioItem[] }>(
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
