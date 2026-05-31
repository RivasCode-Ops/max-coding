#!/usr/bin/env node
/**
 * Max Stack validar — checagem local completa (sem Cursor)
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeRepository, closeDb } from './packages/core/lib/analyze.mjs'
import { getDbPath, getDb } from './packages/core/lib/db.mjs'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)))
let failed = 0

function ok(msg) {
  console.log(`  OK  ${msg}`)
}

function fail(msg) {
  console.log(`  FAIL ${msg}`)
  failed += 1
}

async function step(title, fn) {
  console.log(`\n▶ ${title}`)
  try {
    await fn()
  } catch (err) {
    fail(err.message)
  }
}

console.log('Max Stack validar — checagem local\n')

await step('Testes unitários', async () => {
  const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', 'tests/**/*.test.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (r.status !== 0) {
    console.log(r.stdout || r.stderr)
    throw new Error('testes falharam')
  }
  ok('node --test')
})

await step('Self-scan (Quick)', async () => {
  const result = await analyzeRepository(ROOT, { mode: 'quick', writeReports: false })
  if (result.health.overall < 70) throw new Error(`health ${result.health.summary} < 70`)
  if (!result.cursorRules) throw new Error('cursorRules ausente')
  ok(`health ${result.health.summary}`)
})

await step('SQLite persistência', async () => {
  if (!existsSync(getDbPath())) throw new Error('data/max.db não criado')
  ok(getDbPath())
})

await step('Deep analysis piloto', async () => {
  const pilot = join(ROOT, '..', 'Quadro-Negro')
  if (!existsSync(pilot)) {
    ok('Quadro-Negro não encontrado — pulando')
    return
  }
  const result = await analyzeRepository(pilot, { mode: 'deep', writeReports: false, githubSearch: false })
  if (result.health.overall < 70) throw new Error(`Quadro-Negro health ${result.health.summary}`)
  if (!result.structure) throw new Error('structure analyzer não integrado')
  ok(`${result.repo.slug} ${result.health.summary} · ${result.recommendations.length} recs · structure ${result.structure.fileCount} files · diff ${result.scanDiff?.hasPrevious ? 'sim' : 'primeira'}`)
})

await step('Structure analyzer (self)', async () => {
  const { analyzeStructure } = await import('./packages/core/lib/structure-analyzer.mjs')
  const s = analyzeStructure(ROOT)
  if (s.fileCount < 5) throw new Error('structure fileCount baixo')
  ok(`${s.fileCount} arquivos · ${s.findings.length} achados estruturais`)
})

await step('Portfolio _PROJETOS', async () => {
  const { discoverLocalRepos, quickScanPortfolio, portfolioSummary } = await import('./packages/core/lib/portfolio.mjs')
  const root = join(ROOT, '..')
  const repos = discoverLocalRepos(root)
  if (repos.length < 1) throw new Error('nenhum repo no portfolio')
  const items = quickScanPortfolio(repos)
  const summary = portfolioSummary(items)
  ok(`${summary.total} repos · média ${summary.averageHealth}/100`)
})

await step('Git analyzer + issues export', async () => {
  const { analyzeGitHistory } = await import('./packages/core/lib/git-analyzer.mjs')
  const { generateIssuesMarkdown } = await import('./packages/core/lib/issues-export.mjs')
  const git = analyzeGitHistory(ROOT)
  if (!git.available) throw new Error('git não disponível em max-coding')
  const result = await analyzeRepository(ROOT, { mode: 'deep', writeReports: false, githubSearch: false })
  if (!result.issuesMarkdown && !result.gitHistory) throw new Error('Fase 4 não integrada')
  ok(`git ${git.metrics?.commitCount} commits · issues ${generateIssuesMarkdown(result).length} chars`)
})

await step('PR comment format (Fase 5)', async () => {
  const { formatPrComment } = await import('./packages/core/lib/pr-comment.mjs')
  const { verifyWebhookSignature } = await import('./packages/core/lib/github-auth.mjs')
  const { createHmac } = await import('node:crypto')
  const md = formatPrComment({ mode: 'quick', health: { summary: '80/100' }, findings: [], recommendations: [] })
  if (!md.includes('Max Stack')) throw new Error('format PR inválido')
  const payload = '{}'
  const sig = `sha256=${createHmac('sha256', 'test').update(payload).digest('hex')}`
  if (!verifyWebhookSignature(payload, sig, 'test')) throw new Error('webhook signature')
  ok('PR comment + webhook signature')
})

await step('Trend chart + feedback stats (Fase 6)', async () => {
  const { buildTrendChartData } = await import('./packages/core/lib/trend-chart.mjs')
  const { getFeedbackSummary } = await import('./packages/core/lib/feedback-stats.mjs')
  const chart = buildTrendChartData([{ health_overall: 80, created_at: 'x' }])
  if (chart.empty) throw new Error('chart vazio')
  getFeedbackSummary(getDb())
  ok('trend chart + feedback summary')
})

await step('Piloto Quadro-Negro (Fase 7)', async () => {
  const pilot = join(ROOT, '..', 'Quadro-Negro')
  if (!existsSync(pilot)) {
    ok('Quadro-Negro não encontrado — pulando')
    return
  }
  const { runPilot } = await import('./packages/core/lib/apply-pilot.mjs')
  const preview = await runPilot(pilot, { dryRun: true })
  if (!preview.applied.planned.length) ok('nada a aplicar (já corrigido)')
  else ok(`plano: ${preview.applied.planned.join(', ')} · health atual ${preview.before.health.summary}`)
  const after = await analyzeRepository(pilot, { mode: 'quick', writeReports: false, githubSearch: false })
  if (after.health.overall < 95) throw new Error(`health ${after.health.summary} < 95`)
  ok(`Quadro-Negro ${after.health.summary}`)
})

await step('Cursor apply + suggest action (Fase 8)', async () => {
  const { buildCursorApplyPrompt, applyRecommendationViaCursor } = await import('./packages/core/lib/cursor-apply.mjs')
  const { suggestActions } = await import('./packages/core/lib/action-suggester.mjs')
  const md = buildCursorApplyPrompt({ title: 'Test', problem: 'x' }, {})
  if (!md.includes('Max Stack')) throw new Error('prompt inválido')
  const result = await analyzeRepository(ROOT, { mode: 'quick', writeReports: false })
  if (!result.recommendations?.length) throw new Error('sem recomendações')
  const applied = applyRecommendationViaCursor(result, result.recommendations[0].id, { writeFile: false })
  if (!applied.prompt) throw new Error('apply cursor falhou')
  const sug = suggestActions('eslint lint qualidade', {
    repoPath: ROOT,
    slug: 'max-coding',
    analysisResult: result,
    profile: result.profile,
  })
  if (!sug.suggestions.length) throw new Error('suggest-action vazio')
  ok(`cursor apply + ${sug.suggestions.length} sugestões`)
})

await step('Verify loop + tasks (Fase 9)', async () => {
  const { buildVerificationReport } = await import('./packages/core/lib/verify-apply.mjs')
  const { listCursorTasks } = await import('./packages/core/lib/task-registry.mjs')
  const report = buildVerificationReport(
    { health: { overall: 88, summary: '88/100' }, findings: [] },
    { health: { overall: 88, summary: '88/100' }, findings: [] },
    { ok: true, skipped: true, results: [] },
    [],
  )
  if (!report.verdict) throw new Error('verdict ausente')
  const tasks = listCursorTasks(ROOT)
  ok(`verify ${report.verdict} · ${tasks.length} tasks no self-scan`)
})

await step('Repo context + next actions (Fase 10)', async () => {
  const { buildRepoContext, suggestNextActions } = await import('./packages/core/lib/repo-context.mjs')
  const result = await analyzeRepository(ROOT, { mode: 'quick', writeReports: false })
  const ctx = buildRepoContext(ROOT, result)
  if (!ctx.slug) throw new Error('contexto sem slug')
  const actions = suggestNextActions(result)
  ok(`${ctx.slug} · ${actions.length} ações sugeridas · github=${ctx.githubLinked}`)
})

await step('Report export + compare (Fase 11)', async () => {
  const { generateExecutiveReport } = await import('./packages/core/lib/report-export.mjs')
  const { compareAnalyses } = await import('./packages/core/lib/repo-compare.mjs')
  const result = await analyzeRepository(ROOT, { mode: 'quick', writeReports: false })
  const md = generateExecutiveReport(result)
  if (!md.includes('Health score')) throw new Error('report inválido')
  const pilot = join(ROOT, '..', 'Quadro-Negro')
  if (existsSync(pilot)) {
    const other = await analyzeRepository(pilot, { mode: 'quick', writeReports: false, githubSearch: false })
    const cmp = compareAnalyses(result, other)
    ok(`report ${md.length} chars · compare ${cmp.winner}`)
  } else ok(`report ${md.length} chars`)
})

await step('Evolve workflow (Fase 12)', async () => {
  const { evolveRepository } = await import('./packages/core/lib/evolve-repo.mjs')
  const preview = await evolveRepository(ROOT, { dryRun: true, applyPilot: true, validateRepo: false })
  if (!preview.summary) throw new Error('evolve preview falhou')
  ok(`evolve preview: ${preview.summary}`)
})

await step('Portfolio alerts (Fase 13)', async () => {
  const { buildPortfolioAlerts } = await import('./packages/core/lib/portfolio-alerts.mjs')
  const { discoverLocalRepos, quickScanPortfolio, mergePortfolio, buildPortfolioFromDb } = await import('./packages/core/lib/portfolio.mjs')
  const root = join(ROOT, '..')
  const items = mergePortfolio(buildPortfolioFromDb(getDb()), quickScanPortfolio(discoverLocalRepos(root)))
  const { summary } = buildPortfolioAlerts(items, getDb())
  ok(`${summary.total} alertas · ${summary.critical} críticos`)
})

await step('Evolve batch + issues publish (Fase 14)', async () => {
  const { pickEvolveTargets } = await import('./packages/core/lib/evolve-batch.mjs')
  const { publishIssuesToGithub } = await import('./packages/core/lib/issues-publish.mjs')
  const result = await analyzeRepository(ROOT, { mode: 'quick', writeReports: false })
  const preview = await publishIssuesToGithub(result, { ownerRepo: 'org/demo', dryRun: true, max: 2 })
  const targets = pickEvolveTargets([{ level: 'critical', action: 'evolve', slug: 'x', path: ROOT, code: 'low-health' }])
  if (!preview.count || !targets.length) throw new Error('fase 14 preview falhou')
  ok(`issues preview ${preview.count} · ${targets.length} alvo(s) batch`)
})

await step('Portfolio chart (Fase 15)', async () => {
  const { buildPortfolioChartData } = await import('./packages/core/lib/portfolio-chart.mjs')
  const { discoverLocalRepos, quickScanPortfolio, mergePortfolio, buildPortfolioFromDb } = await import('./packages/core/lib/portfolio.mjs')
  const root = join(ROOT, '..')
  const items = mergePortfolio(buildPortfolioFromDb(getDb()), quickScanPortfolio(discoverLocalRepos(root)))
  const chart = buildPortfolioChartData(items)
  if (!chart.bars.length) throw new Error('chart vazio')
  ok(`${chart.bars.length} barras · média ${chart.averageHealth}`)
})

await step('Plan package (Fase 16)', async () => {
  const { buildPlanPackage, formatPlanMarkdown } = await import('./packages/core/lib/plan-package.mjs')
  const result = await analyzeRepository(ROOT, { mode: 'deep', auditMode: 'plan', writeReports: false, githubSearch: false })
  const pkg = buildPlanPackage(result)
  const md = formatPlanMarkdown(result)
  if (pkg.authorization.applyAllowed || !md.includes('Modo plan')) throw new Error('plan package inválido')
  ok(`plan ${pkg.counts.backlog} backlog · ${pkg.counts.prCommits} commits PR`)
})

await step('Portfolio watch (Fase 17)', async () => {
  const { runPortfolioWatchTick } = await import('./packages/core/lib/portfolio-watch.mjs')
  const { discoverLocalRepos, quickScanPortfolio, mergePortfolio, buildPortfolioFromDb } = await import('./packages/core/lib/portfolio.mjs')
  const root = join(ROOT, '..')
  const items = mergePortfolio(buildPortfolioFromDb(getDb()), quickScanPortfolio(discoverLocalRepos(root)))
  const run = await runPortfolioWatchTick(items, getDb(), { dryRun: true, max: 3 })
  if (run.targets < 0) throw new Error('watch preview falhou')
  ok(`${run.summary} · ${run.targets} alvo(s)`)
})

await step('Portfolio history (Fase 18)', async () => {
  const { buildPortfolioHistory } = await import('./packages/core/lib/portfolio-history.mjs')
  const { discoverLocalRepos, quickScanPortfolio, mergePortfolio, buildPortfolioFromDb } = await import('./packages/core/lib/portfolio.mjs')
  const root = join(ROOT, '..')
  const items = mergePortfolio(buildPortfolioFromDb(getDb()), quickScanPortfolio(discoverLocalRepos(root)))
  const { summary } = buildPortfolioHistory(getDb(), items, { includeSingle: true })
  ok(`${summary.tracked} repos no histórico · ${summary.withHistory} com evolução`)
})

await step('Portfolio digest (Fase 19)', async () => {
  const { buildPortfolioDigest, formatPortfolioDigestMarkdown } = await import('./packages/core/lib/portfolio-digest.mjs')
  const { discoverLocalRepos, quickScanPortfolio, mergePortfolio, buildPortfolioFromDb } = await import('./packages/core/lib/portfolio.mjs')
  const root = join(ROOT, '..')
  const items = mergePortfolio(buildPortfolioFromDb(getDb()), quickScanPortfolio(discoverLocalRepos(root)))
  const digest = buildPortfolioDigest(items, getDb(), { root })
  const md = formatPortfolioDigestMarkdown(digest)
  if (!md.includes('Digest do portfolio')) throw new Error('digest inválido')
  ok(`digest ${digest.summary.total} repos · média ${digest.summary.averageHealth}`)
})

await step('Portfolio heatmap (Fase 20)', async () => {
  const { buildPortfolioHeatmap } = await import('./packages/core/lib/portfolio-heatmap.mjs')
  const { discoverLocalRepos, quickScanPortfolio, mergePortfolio, buildPortfolioFromDb } = await import('./packages/core/lib/portfolio.mjs')
  const root = join(ROOT, '..')
  const items = mergePortfolio(buildPortfolioFromDb(getDb()), quickScanPortfolio(discoverLocalRepos(root)))
  const heatmap = buildPortfolioHeatmap(items, { maxRepos: 3 })
  if (heatmap.rows.length !== 12) throw new Error('heatmap deve ter 12 categorias')
  ok(`${heatmap.summary.repoCount} repos · fraco: ${heatmap.summary.weakestCategories[0]?.label || '—'}`)
})

await step('Quality signals (Fase 21)', async () => {
  const { buildQualitySignals } = await import('./packages/core/lib/quality-signals.mjs')
  const { scanRepo } = await import('./packages/repo-scanner/lib/scan-repo.mjs')
  const profile = scanRepo(ROOT, 'max-coding')
  const q = buildQualitySignals(profile)
  if (!q.checks.length || q.summary.total < 10) throw new Error('quality signals incompleto')
  ok(`${q.summary.passed}/${q.summary.total} sinais (${q.summary.pct}%)`)
})

await step('Portfolio goals (Fase 22)', async () => {
  const { savePortfolioGoals, goalsProgress } = await import('./packages/core/lib/portfolio-goals.mjs')
  const { discoverLocalRepos, quickScanPortfolio, mergePortfolio, buildPortfolioFromDb } = await import('./packages/core/lib/portfolio.mjs')
  const goals = savePortfolioGoals(getDb(), { minHealth: 70, targetHealth: 85 })
  const items = mergePortfolio(buildPortfolioFromDb(getDb()), quickScanPortfolio(discoverLocalRepos(join(ROOT, '..'))))
  const p = goalsProgress(items, goals)
  if (goals.minHealth !== 70) throw new Error('goals não salvos')
  ok(`metas ${goals.minHealth}/${goals.targetHealth} · ${p.atTarget}/${p.total} no alvo`)
})

await step('Notifications (Fase 23)', async () => {
  const { saveNotificationConfig, dispatchWatchNotifications } = await import('./packages/core/lib/notifications.mjs')
  const file = join(ROOT, 'data', 'notify-validar.log')
  saveNotificationConfig(getDb(), { enabled: true, filePath: file, webhookUrl: '', onRegression: true })
  const run = {
    dryRun: false,
    at: new Date().toISOString(),
    summary: 'validar notify',
    results: [{ ok: true, slug: 'max-coding', path: ROOT, healthDelta: -6, level: 'warning', health: 82 }],
  }
  const out = await dispatchWatchNotifications(getDb(), run)
  if (!out.dispatched) throw new Error('notify não despachou')
  ok(`${out.dispatched} evento(s) · ${file.split(/[/\\]/).pop()}`)
})

await step('Watch schedule (Fase 24)', async () => {
  const { getWatchScheduleStatus, buildWatchTaskAction, schtasksScheduleArgs } = await import(
    './packages/core/lib/watch-scheduler.mjs'
  )
  const status = getWatchScheduleStatus(getDb())
  const cmd = buildWatchTaskAction({ root: ROOT, repoRoot: ROOT })
  const sched = schtasksScheduleArgs(60)
  if (!cmd.includes('--once') || sched.sc !== 'HOURLY') throw new Error('watch schedule inválido')
  ok(`${status.platform} · suportado=${status.supported} · task=${status.task.installed ? 'sim' : 'não'}`)
})

await step('Portfolio scorecard ZIP (Fase 25)', async () => {
  const { buildPortfolioScorecardZip } = await import('./packages/core/lib/portfolio-scorecard.mjs')
  const { discoverLocalRepos, quickScanPortfolio, mergePortfolio, buildPortfolioFromDb } = await import(
    './packages/core/lib/portfolio.mjs',
  )
  const root = join(ROOT, '..')
  const items = mergePortfolio(buildPortfolioFromDb(getDb()), quickScanPortfolio(discoverLocalRepos(root)))
  const zip = buildPortfolioScorecardZip(items, getDb(), { root, maxScorecards: 3 })
  if (zip.buffer.readUInt32LE(0) !== 0x04034b50) throw new Error('ZIP inválido')
  if (zip.fileCount < 6) throw new Error('ZIP com poucos arquivos')
  ok(`${zip.fileCount} arquivos · ${zip.manifest.scorecardCount} scorecards`)
})

await step('Apply plan workflow (Fase 26)', async () => {
  const { buildPlanApplyView, applyApprovedPlanItems } = await import('./packages/core/lib/apply-plan.mjs')
  const result = await analyzeRepository(ROOT, { mode: 'deep', auditMode: 'plan', writeReports: false, githubSearch: false })
  const view = buildPlanApplyView(result)
  if (!view.items.length) throw new Error('plan apply view vazio')
  const approved = view.items.filter((i) => i.suggested && i.applyable).slice(0, 2).map((i) => i.backlogId)
  const run = applyApprovedPlanItems(result, approved, { writeFile: false })
  if (approved.length && !run.count) throw new Error('apply plan não gerou tasks')
  ok(`${view.applyableCount} applyable · ${run.count} task(s) preview`)
})

await step('Portfolio quality (Fase 27)', async () => {
  const { buildPortfolioQuality } = await import('./packages/core/lib/portfolio-quality.mjs')
  const { discoverLocalRepos, quickScanPortfolio, mergePortfolio, buildPortfolioFromDb } = await import(
    './packages/core/lib/portfolio.mjs',
  )
  const root = join(ROOT, '..')
  const items = mergePortfolio(buildPortfolioFromDb(getDb()), quickScanPortfolio(discoverLocalRepos(root)))
  const report = buildPortfolioQuality(items, { maxRepos: 3 })
  if (!report.checks.length || report.summary.repoCount < 1) throw new Error('portfolio quality vazio')
  ok(`${report.summary.repoCount} repos · média ${report.summary.averagePct}% · fraco: ${report.summary.weakestChecks[0]?.label || '—'}`)
})

await step('Local apply app (Fase 28)', async () => {
  const { applyBatchLocally, applyApprovedPlanItemsLocally } = await import('./packages/core/lib/local-apply.mjs')
  const { buildPlanApplyView } = await import('./packages/core/lib/apply-plan.mjs')
  const result = await analyzeRepository(ROOT, { mode: 'deep', auditMode: 'plan', writeReports: false, githubSearch: false })
  const view = buildPlanApplyView(result)
  const batch = applyBatchLocally(result, { dryRun: true, maxPriority: 2 })
  const approved = view.items.filter((i) => i.localApplyable).slice(0, 1).map((i) => i.backlogId)
  const run = applyApprovedPlanItemsLocally(result, approved, { dryRun: true })
  if (batch.results.length < 1) throw new Error('local batch vazio')
  ok(`${batch.results.length} recs · ${run.count} fix local preview · standalone ok`)
})

closeDb()

console.log(failed ? `\n✗ ${failed} falha(s)\n` : '\n✓ Max Stack validar OK\n')
process.exit(failed ? 1 : 0)
