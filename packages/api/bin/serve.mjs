#!/usr/bin/env node
/**
 * Max Stack — servidor local (API + UI React)
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { analyzeRepository, resolveProjectRoot, generateIssuesMarkdown } from '../../core/lib/analyze.mjs'
import { closeDb, getDb, getAnalysis, listAnalyses, listRepositories, saveFeedback, getRepositoryBySlug } from '../../core/lib/db.mjs'
import { getHealthTrend } from '../../core/lib/health-trend.mjs'
import { applyCursorRules } from '../../core/lib/apply-rules.mjs'
import { validateFromProfile } from '../../core/lib/repo-validator.mjs'
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import {
  buildPortfolioFromDb,
  discoverLocalRepos,
  mergePortfolio,
  portfolioSummary,
  quickScanPortfolio,
} from '../../core/lib/portfolio.mjs'
import { installPreCommitHook } from '../../core/lib/hook-generator.mjs'
import { checkoutPullRequest } from '../../core/lib/github-pr-checkout.mjs'
import { commentOnPullRequest, formatPrComment } from '../../core/lib/pr-comment.mjs'
import { handleGithubWebhook } from '../../core/lib/github-webhook.mjs'
import { getGithubConfig } from '../../core/lib/github-auth.mjs'
import { getFeedbackSummary, getFeedbackStatsForAnalysis } from '../../core/lib/feedback-stats.mjs'
import { trendChartSvg } from '../../core/lib/trend-chart.mjs'
import { basename, resolve } from 'node:path'

const ROOT = resolveProjectRoot()
const WEB_DIST = join(ROOT, 'apps', 'web', 'dist')
const WEB_SRC = join(ROOT, 'apps', 'web')
const PORT = Number(process.env.MAX_PORT || 3847)
const HOST = process.env.MAX_HOST || '127.0.0.1'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
}

const server = createServer(async (req, res) => {
  try {
    await handle(req, res)
  } catch (err) {
    sendJson(res, 500, { error: err.message || 'Erro interno' })
  }
})

server.listen(PORT, HOST, () => {
  const ui = existsSync(join(WEB_DIST, 'index.html')) ? 'React build' : 'fallback'
  console.log(`Max Stack: http://${HOST}:${PORT} (${ui})`)
})

async function handle(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const path = url.pathname

  if (path === '/api/status') {
    return sendJson(res, 200, {
      ok: true,
      product: 'Max Stack',
      version: '0.11.0',
      port: PORT,
      db: getDb().prepare('SELECT COUNT(*) AS n FROM analyses').get().n,
      github: {
        pat: Boolean(getGithubConfig().token),
        app: Boolean(getGithubConfig().appId && getGithubConfig().privateKey),
        webhook: Boolean(getGithubConfig().webhookSecret),
      },
      feedback: getFeedbackSummary(getDb()),
    })
  }

  if (path === '/api/analyses' && req.method === 'GET') {
    return sendJson(res, 200, { items: listAnalyses(getDb(), Number(url.searchParams.get('limit') || 30)) })
  }

  if (path === '/api/repositories' && req.method === 'GET') {
    return sendJson(res, 200, { items: listRepositories(getDb()) })
  }

  const analysisMatch = path.match(/^\/api\/analyses\/(\d+)(?:\/([\w-]+))?$/)
  if (analysisMatch && req.method === 'GET') {
    const id = Number(analysisMatch[1])
    const sub = analysisMatch[2]
    const row = getAnalysis(getDb(), id)
    if (!row) return sendJson(res, 404, { error: 'Análise não encontrada' })
    if (sub === 'issues') {
      const md = row.data?.issuesMarkdown || generateIssuesMarkdown(row.data)
      return sendJson(res, 200, { content: md })
    }
    if (sub === 'cursor-rules') {
      return sendJson(res, 200, { content: row.data?.cursorRules || '' })
    }
    if (sub === 'diff') {
      return sendJson(res, 200, row.data?.scanDiff || { hasPrevious: false })
    }
    return sendJson(res, 200, row)
  }

  const repoTrendMatch = path.match(/^\/api\/repositories\/([^/]+)\/trend$/)
  if (repoTrendMatch && req.method === 'GET') {
    const slug = decodeURIComponent(repoTrendMatch[1])
    const repo = getRepositoryBySlug(getDb(), slug)
    if (!repo) return sendJson(res, 404, { error: 'Repositório não encontrado' })
    return sendJson(res, 200, getHealthTrend(getDb(), slug))
  }

  if (path === '/api/apply-pilot' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)) || '{}')
    const { path: repoPath, dryRun = false, force = false } = body
    if (!repoPath) return sendJson(res, 400, { error: 'Campo path obrigatório' })
    const { runPilot } = await import('../../core/lib/apply-pilot.mjs')
    const result = await runPilot(resolve(repoPath), { dryRun, force })
    return sendJson(res, 200, result)
  }

  if (path === '/api/feedback/summary' && req.method === 'GET') {
    return sendJson(res, 200, getFeedbackSummary(getDb()))
  }

  const analysisFeedbackMatch = path.match(/^\/api\/analyses\/(\d+)\/feedback$/)
  if (analysisFeedbackMatch && req.method === 'GET') {
    const id = Number(analysisFeedbackMatch[1])
    return sendJson(res, 200, { stats: getFeedbackStatsForAnalysis(getDb(), id) })
  }

  const trendChartMatch = path.match(/^\/api\/repositories\/([^/]+)\/trend\/chart$/)
  if (trendChartMatch && req.method === 'GET') {
    const slug = decodeURIComponent(trendChartMatch[1])
    const trend = getHealthTrend(getDb(), slug)
    res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8' })
    res.end(trendChartSvg(trend.points))
    return
  }

  if (path === '/api/github/webhook' && req.method === 'POST') {
    const raw = await readBody(req)
    const result = await handleGithubWebhook(raw, req.headers)
    return sendJson(res, result.status || 200, result)
  }

  if (path === '/api/github/pr-comment' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)) || '{}')
    const { ownerRepo, pullNumber, mode = 'quick', dryRun = false } = body
    if (!ownerRepo || !pullNumber) {
      return sendJson(res, 400, { error: 'ownerRepo e pullNumber obrigatórios' })
    }
    const checkout = await checkoutPullRequest(ownerRepo, Number(pullNumber), { forceRefresh: true })
    const result = await analyzeRepository(checkout.path, {
      mode: mode === 'deep' ? 'deep' : 'quick',
      writeReports: false,
      githubSearch: mode === 'deep',
    })
    if (dryRun) {
      return sendJson(res, 200, {
        preview: formatPrComment(result, { ownerRepo, pullNumber }),
        health: result.health,
      })
    }
    const posted = await commentOnPullRequest(ownerRepo, Number(pullNumber), result)
    return sendJson(res, 200, {
      commentUrl: posted.comment?.html_url,
      health: result.health,
      body: posted.body,
    })
  }

  if (path === '/api/portfolio' && req.method === 'GET') {
    const root = resolve(url.searchParams.get('root') || process.env.MAX_PORTFOLIO_ROOT || 'c:\\_PROJETOS')
    const local = discoverLocalRepos(root)
    const scanned = quickScanPortfolio(local)
    const fromDb = buildPortfolioFromDb(getDb())
    const items = mergePortfolio(fromDb, scanned)
    return sendJson(res, 200, { root, summary: portfolioSummary(items), items })
  }

  if (path === '/api/install-hook' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)) || '{}')
    let targetPath = body.path
    if (body.analysisId) {
      const row = getAnalysis(getDb(), Number(body.analysisId))
      if (!row) return sendJson(res, 404, { error: 'Análise não encontrada' })
      targetPath = row.path || row.data?.repo?.path
    }
    if (!targetPath) return sendJson(res, 400, { error: 'Informe path ou analysisId' })
    const applied = installPreCommitHook(resolve(targetPath), ROOT, { minHealth: body.minHealth ?? 70 })
    return sendJson(res, 200, applied)
  }

  if (path === '/api/feedback' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)) || '{}')
    const { recommendationId, analysisId, useful } = body
    if (!recommendationId || typeof useful !== 'boolean') {
      return sendJson(res, 400, { error: 'recommendationId e useful (boolean) obrigatórios' })
    }
    const saved = saveFeedback(getDb(), { recommendationId, analysisId, useful })
    return sendJson(res, 200, saved)
  }

  if (path === '/api/validate-repo' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)) || '{}')
    const { path: repoPath } = body
    if (!repoPath) return sendJson(res, 400, { error: 'Campo path obrigatório' })
    const abs = resolve(repoPath)
    const slug = basename(abs)
    const profile = scanRepo(abs, slug)
    const result = validateFromProfile(profile)
    return sendJson(res, 200, result)
  }

  if (path === '/api/apply-rules' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)) || '{}')
    const { analysisId, path: repoPath } = body
    let rules = body.content
    let targetPath = repoPath
    let slug = body.slug

    if (analysisId) {
      const row = getAnalysis(getDb(), Number(analysisId))
      if (!row) return sendJson(res, 404, { error: 'Análise não encontrada' })
      rules = row.data?.cursorRules
      targetPath = row.path || row.data?.repo?.path
      slug = row.slug || row.data?.repo?.slug
    }

    if (!targetPath || !rules) {
      return sendJson(res, 400, { error: 'Informe analysisId ou path+content' })
    }

    const applied = applyCursorRules(targetPath, rules, slug)
    return sendJson(res, 200, applied)
  }

  if (path === '/api/cursor/apply' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)) || '{}')
    const { path: repoPath, analysisId, recommendationId, autoPilot = false } = body
    if (!recommendationId) return sendJson(res, 400, { error: 'recommendationId obrigatório' })

    let analysisResult = null
    if (analysisId) {
      const row = getAnalysis(getDb(), Number(analysisId))
      if (!row) return sendJson(res, 404, { error: 'Análise não encontrada' })
      analysisResult = row.data
      analysisResult.repo = analysisResult.repo || { path: row.path, slug: row.slug }
    } else if (repoPath) {
      analysisResult = await analyzeRepository(resolve(repoPath), {
        mode: 'quick',
        writeReports: false,
        persistSqlite: false,
      })
    } else {
      return sendJson(res, 400, { error: 'Informe path ou analysisId' })
    }

    const { applyRecommendationViaCursor } = await import('../../core/lib/cursor-apply.mjs')
    const { saveCursorTaskRecord } = await import('../../core/lib/task-registry.mjs')
    const applied = applyRecommendationViaCursor(analysisResult, recommendationId)

    if (applied.written && analysisResult.repo?.slug) {
      saveCursorTaskRecord(getDb(), {
        repoSlug: analysisResult.repo.slug,
        repoPath: analysisResult.repo.path,
        taskId: recommendationId,
        recommendationId,
        title: applied.title,
        relativePath: applied.written.relative,
        pilotFix: applied.pilotFix,
        status: 'pending',
      })
    }

    let pilotResult = null
    if (autoPilot && applied.pilotFix && analysisResult.repo?.path) {
      const { applyPilotFixes } = await import('../../core/lib/apply-pilot.mjs')
      pilotResult = applyPilotFixes(analysisResult.repo.path, {
        fixes: [applied.pilotFix],
        slug: analysisResult.repo.slug,
      })
    }

    return sendJson(res, 200, { ...applied, pilotResult })
  }

  if (path === '/api/suggest-action' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)) || '{}')
    const { path: repoPath, request, analysisId } = body
    if (!repoPath || !request) return sendJson(res, 400, { error: 'path e request obrigatórios' })

    const abs = resolve(repoPath)
    const slug = basename(abs)
    let analysisResult = null
    if (analysisId) {
      const row = getAnalysis(getDb(), Number(analysisId))
      if (row) {
        analysisResult = row.data
        analysisResult.repo = analysisResult.repo || { path: row.path, slug: row.slug }
      }
    }
    if (!analysisResult) {
      analysisResult = await analyzeRepository(abs, { mode: 'quick', writeReports: false, persistSqlite: false })
    }

    const { suggestActions } = await import('../../core/lib/action-suggester.mjs')
    const { writeCursorTask } = await import('../../core/lib/cursor-apply.mjs')
    const result = suggestActions(request, { repoPath: abs, slug, analysisResult })

    for (const s of result.suggestions.slice(0, 3)) {
      if (analysisResult.repo?.path) {
        s.written = writeCursorTask(analysisResult.repo.path, slug, s.id, s.prompt)
        s.cursorHint = `@${s.written.relative}`
      }
    }

    return sendJson(res, 200, result)
  }

  if (path === '/api/cursor/tasks' && req.method === 'GET') {
    const repoPath = url.searchParams.get('path')
    if (!repoPath) return sendJson(res, 400, { error: 'path obrigatório' })
    const abs = resolve(repoPath)
    const slug = basename(abs)
    const { listCursorTasks, listCursorTaskRecords } = await import('../../core/lib/task-registry.mjs')
    const files = listCursorTasks(abs)
    const records = listCursorTaskRecords(getDb(), slug)
    return sendJson(res, 200, { slug, tasks: files, records })
  }

  if (path === '/api/cursor/apply-batch' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)) || '{}')
    const { path: repoPath, analysisId, maxPriority = 2 } = body
    let analysisResult = null
    if (analysisId) {
      const row = getAnalysis(getDb(), Number(analysisId))
      if (!row) return sendJson(res, 404, { error: 'Análise não encontrada' })
      analysisResult = row.data
      analysisResult.repo = analysisResult.repo || { path: row.path, slug: row.slug }
    } else if (repoPath) {
      analysisResult = await analyzeRepository(resolve(repoPath), {
        mode: 'quick',
        writeReports: false,
        persistSqlite: false,
      })
    } else {
      return sendJson(res, 400, { error: 'Informe path ou analysisId' })
    }

    const { applyBatchRecommendations } = await import('../../core/lib/cursor-apply.mjs')
    const { saveCursorTaskRecord } = await import('../../core/lib/task-registry.mjs')
    const applied = applyBatchRecommendations(analysisResult, { maxPriority })
    for (const a of applied) {
      if (a.written && analysisResult.repo?.slug) {
        saveCursorTaskRecord(getDb(), {
          repoSlug: analysisResult.repo.slug,
          repoPath: analysisResult.repo.path,
          taskId: a.recommendationId,
          recommendationId: a.recommendationId,
          title: a.title,
          relativePath: a.written.relative,
          pilotFix: a.pilotFix,
          status: 'pending',
        })
      }
    }
    return sendJson(res, 200, { count: applied.length, applied })
  }

  if (path === '/api/verify' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)) || '{}')
    const { path: repoPath, analysisId, validateRepo = true } = body
    if (!repoPath) return sendJson(res, 400, { error: 'path obrigatório' })
    const { verifyImplementation } = await import('../../core/lib/verify-apply.mjs')
    const report = await verifyImplementation(resolve(repoPath), {
      baselineAnalysisId: analysisId,
      validateRepo: Boolean(validateRepo),
    })
    return sendJson(res, 200, report)
  }

  if (path === '/api/analyze' && req.method === 'POST') {
    const body = await readBody(req)
    const { path: repoPath, mode = 'quick', validateRepo = false, applyRules = false } = JSON.parse(body || '{}')
    if (!repoPath) return sendJson(res, 400, { error: 'Campo path obrigatório' })
    const result = await analyzeRepository(repoPath, {
      mode: mode === 'deep' ? 'deep' : 'quick',
      validateRepo: Boolean(validateRepo),
      applyRules: Boolean(applyRules),
    })
    return sendJson(res, 200, {
      id: result.analysisId,
      slug: result.repo.slug,
      mode: result.mode,
      health: result.health,
      data: result,
    })
  }

  return serveStatic(res, path)
}

function serveStatic(res, urlPath) {
  const base = existsSync(join(WEB_DIST, 'index.html')) ? WEB_DIST : WEB_SRC
  const safe = urlPath === '/' ? '/index.html' : urlPath
  const file = join(base, safe.replace(/\.\./g, ''))
  if (!file.startsWith(base) || !existsSync(file)) {
    if (existsSync(join(WEB_DIST, 'index.html'))) {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(readFileSync(join(WEB_DIST, 'index.html')))
      return
    }
    res.writeHead(404)
    res.end('UI não encontrada — rode npm run build:web')
    return
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' })
  res.end(readFileSync(file))
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data, null, 2))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => {
      data += c
      if (data.length > 2_000_000) reject(new Error('Payload grande'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

process.on('SIGINT', () => {
  closeDb()
  process.exit(0)
})
