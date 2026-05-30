import type { AnalysisResult, HistoryItem, Status } from './types'

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
