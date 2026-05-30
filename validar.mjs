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

closeDb()

console.log(failed ? `\n✗ ${failed} falha(s)\n` : '\n✓ Max Stack validar OK\n')
process.exit(failed ? 1 : 0)
