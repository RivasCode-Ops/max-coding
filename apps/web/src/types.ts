export type HealthTrendPoint = {
  health_overall: number
  health_grade?: string
  created_at: string
  id?: number
}

export type FeedbackSummary = {
  total: number
  useful: number
  notUseful: number
  usefulPct: number | null
}

export type FeedbackRecStats = {
  useful: number
  notUseful: number
}

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
  structure?: {
    fileCount: number
    totalLines: number
    hotspots: { file: string; lines: number; imports: number }[]
  }
  repoValidation?: {
    ok: boolean
    skipped?: boolean
    message?: string
    results: { script: string; ok: boolean; durationMs: number }[]
  }
  healthTrend?: {
    points: { id: number; health_overall: number; health_grade: string; created_at: string }[]
    trend: 'up' | 'down' | 'stable'
    delta: number
  }
  rulesApplied?: { written: string; filename: string }
  issuesMarkdown?: string
  gitHistory?: {
    available: boolean
    metrics?: {
      commitCount: number
      topFiles: { file: string; count: number }[]
      daysSinceLastCommit: number | null
    }
  }
}

export type PortfolioItem = {
  slug: string
  path: string
  health?: number
  grade?: string
  summary?: string
  source?: string
  analysisCount?: number
}

export type PortfolioSummary = {
  total: number
  withHealth: number
  averageHealth: number
  top: PortfolioItem[]
  needsAttention: PortfolioItem[]
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
  github?: { pat: boolean; app: boolean; webhook: boolean }
  feedback?: FeedbackSummary
}
