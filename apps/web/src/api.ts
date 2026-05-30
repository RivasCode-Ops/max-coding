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

export function analyze(path: string, mode: 'quick' | 'deep') {
  return api<{ id: number; data: AnalysisResult }>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ path, mode }),
  })
}
