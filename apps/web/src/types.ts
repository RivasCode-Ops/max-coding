export type ActionSuggestion = {
  kind: string
  id: string
  title: string
  subtitle?: string
  score: number
  priority: number
  pilotFix?: string | null
  prompt: string
  written?: { written: string; relative: string; filename: string }
  cursorHint?: string
}

export type SuggestActionResult = {
  request: string
  suggestions: ActionSuggestion[]
  note?: string | null
  profile?: { frameworks?: string[]; signals?: string[] }
}

export type CursorApplyResult = {
  recommendationId: string
  title: string
  prompt: string
  written?: { written: string; relative: string; filename: string }
  pilotFix?: string | null
  cursorHint: string
}

export type CursorTaskFile = {
  filename: string
  relative: string
  title: string
  modifiedAt: string
  cursorHint: string
}

export type VerificationReport = {
  verdict: 'APPROVED' | 'STABLE' | 'ATTENTION' | 'FAILED'
  summary: string
  before: { health?: { summary: string; overall: number }; analysisId?: number | null }
  after: { health?: { summary: string; overall: number }; analysisId?: number }
  diff?: AnalysisResult['scanDiff']
  validation?: AnalysisResult['repoValidation']
  tasks: CursorTaskFile[]
  checklist: { id: string; label: string; ok: boolean; detail: string }[]
}

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

export type PortfolioAlert = {
  level: 'critical' | 'warning' | 'info'
  slug: string
  path: string
  code: string
  message: string
  action: string
  health?: number
}

export type PortfolioAlertsSummary = {
  critical: number
  warning: number
  info: number
  total: number
}

export type PortfolioGoals = {
  minHealth: number
  targetHealth: number
  enabled: boolean
}

export type PortfolioGoalsProgress = {
  total: number
  atTarget: number
  atMin: number
  belowMin: number
  underTarget: number
}

export type PortfolioChartBar = {
  slug: string
  health: number
  grade?: string
  color: string
}

export type PortfolioChartBuckets = {
  excellent: number
  good: number
  attention: number
}

export type PortfolioChart = {
  bars: PortfolioChartBar[]
  buckets: PortfolioChartBuckets
  averageHealth: number
  total: number
  withHealth: number
}

export type PortfolioHistoryPoint = {
  health: number
  grade?: string
  mode?: string
  at: string
}

export type PortfolioHistoryRepo = {
  slug: string
  path: string
  currentHealth: number
  trend: 'up' | 'down' | 'stable'
  delta: number
  scanCount: number
  points: PortfolioHistoryPoint[]
}

export type PortfolioHistorySummary = {
  tracked: number
  improving: number
  declining: number
  stable: number
  withHistory: number
}

export type PortfolioHistory = {
  repos: PortfolioHistoryRepo[]
  summary: PortfolioHistorySummary
}

export type PortfolioHeatmapCell = {
  slug: string
  pct: number
  status: string
  color: string
}

export type PortfolioHeatmapRow = {
  id: string
  label: string
  cells: PortfolioHeatmapCell[]
  averagePct: number
}

export type PortfolioHeatmap = {
  columns: { slug: string; path: string; health: number; grade: string }[]
  rows: PortfolioHeatmapRow[]
  summary: {
    repoCount: number
    categoryCount: number
    weakestCategories: { id: string; label: string; averagePct: number }[]
    strongestCategories: { id: string; label: string; averagePct: number }[]
  }
}

export type EvolveResult = {
  dryRun: boolean
  summary: string
  baseline: { health: { summary: string; overall: number }; analysisId?: number; recommendations: number }
  pilot?: { planned: string[]; delta?: number; dryRun?: boolean; results?: { fixId: string; written?: string; skipped?: boolean }[] } | null
  verification?: { verdict: string; summary: string; checklist: VerificationReport['checklist']; diff?: AnalysisResult['scanDiff'] } | null
  final: { health?: { summary: string; overall: number }; analysisId?: number }
  context?: RepoContext
  reportMarkdown?: string
}

export type EvolveBatchItemResult = {
  ok: boolean
  slug: string
  path: string
  summary?: string
  healthDelta?: number
  verdict?: string
  baseline?: string
  final?: string
  error?: string
}

export type EvolveBatchResult = {
  root?: string
  dryRun: boolean
  summary: string
  targets: number
  results: EvolveBatchItemResult[]
}

export type IssuesPublishResult = {
  ownerRepo: string
  dryRun: boolean
  count: number
  issues: { title: string; priority?: number; preview?: boolean; labels?: string[]; number?: number; url?: string }[]
}

export type RepoCompareResult = {
  a: { slug: string; health?: string; overall: number }
  b: { slug: string; health?: string; overall: number }
  healthDelta: number
  winner: string
  summary: string
  categoryCompare: { id: string; a: number; b: number; delta: number }[]
  recsOnlyA: string[]
  recsOnlyB: string[]
  markdown?: string
}

export type RepoContext = {
  path: string
  slug: string
  ownerRepo?: string | null
  source: string
  url?: string | null
  githubLinked: boolean
  nextActions: { id: string; kind: string; title: string; detail: string; action: string }[]
  profileSummary?: { frameworks?: string[]; hasCi?: boolean }
}

export type QualitySignalCheck = {
  id: string
  group: string
  label: string
  ok: boolean
}

export type QualitySignals = {
  checks: QualitySignalCheck[]
  groups: { id: string; label: string; passed: number; total: number; pct: number }[]
  summary: { passed: number; total: number; pct: number }
}

export type AnalysisResult = {
  analysisId?: number
  mode: string
  repo: { slug: string; path: string; source?: string; url?: string | null; ownerRepo?: string | null }
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
  qualitySignals?: QualitySignals
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

export type PlanPackage = {
  auditMode: 'plan'
  repo: { slug: string; path?: string; source?: string; ownerRepo?: string | null }
  health?: string
  backlog: { id: string; title: string; priority: number; tasks?: string[]; acceptance?: string[] }[]
  checklist: { id: string; item: string; done: boolean }[]
  prPlan: { branches: string[]; commits: { order: number; message: string; files?: string[] }[]; note?: string }
  verification: { ok: boolean; issues?: string[] }
  authorization: { applyAllowed: boolean; requiresHumanReview: boolean; notice: string }
  counts: { backlog: number; checklist: number; prCommits: number; recommendations: number }
}

export type WatchLogEntry = {
  slug: string
  path?: string
  health?: number
  health_delta?: number | null
  ok: number
  message?: string
  at: string
}

export type PortfolioWatchResult = {
  root?: string
  dryRun: boolean
  at: string
  summary: string
  targets: number
  results: {
    ok: boolean
    slug: string
    path?: string
    health?: number
    healthSummary?: string
    healthDelta?: number | null
    error?: string
    preview?: boolean
  }[]
  alertsTotal?: number
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
