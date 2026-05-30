export type HealthCategory = {
  id: string
  label?: string
  weight: number
  score: number
  status: 'ok' | 'gap'
}

export type Finding = {
  id: string
  title: string
  category: string
  severity: string
  findingType: 'confirmed' | 'hypothesis' | 'suggestion'
  justification: string
  evidence: { kind: string; ref: string }[]
  sourceRole: string
  priority: number
}

export type AnalysisResult = {
  analysisId?: number
  mode: string
  repo: { slug: string; path: string; source?: string; url?: string | null }
  health: { overall: number; grade: string; summary: string; categories: HealthCategory[] }
  findings: Finding[]
  recommendations: { id: string; title: string; priority: number; suggestedUpgrade?: string; problem?: string; category: string }[]
  externalPatterns: { catalogId: string; sourceRepo: string; url: string }[]
  backlog: { id: string; title: string; priority: number }[]
  checklist: { id: string; item: string; done: boolean }[]
  prPlan?: { note: string; commits: { message: string }[] }
  githubComparable?: { query: string; items: { fullName: string; url: string; stars: number }[]; note?: string }
  scanDiff?: {
    hasPrevious: boolean
    healthDelta?: number
    newFindings?: string[]
    resolvedFindings?: string[]
    improved?: boolean
    previousAnalysisId?: number
  }
  cursorRules?: string
  executiveSummary?: { topGaps: string[]; stack: string }
}

export type HistoryItem = {
  id: number
  slug: string
  path: string
  mode: string
  health_overall: number
  health_grade: string
  finding_count: number
  recommendation_count: number
  created_at: string
  source?: string
  url?: string
}

export type Status = {
  ok: boolean
  product: string
  version: string
  port: number
  db: number
}
