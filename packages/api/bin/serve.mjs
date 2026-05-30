#!/usr/bin/env node
/**
 * MAX — servidor local (UI + API)
 * Uso: npm start  →  http://localhost:3847
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeRepository, resolveProjectRoot } from '../../core/lib/analyze.mjs'
import { closeDb, getDb, getAnalysis, listAnalyses, listRepositories } from '../../core/lib/db.mjs'

const ROOT = resolveProjectRoot()
const WEB = join(ROOT, 'apps', 'web')
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
  console.log(`MAX local: http://${HOST}:${PORT}`)
  console.log('Ctrl+C para parar')
})

async function handle(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const path = url.pathname

  if (path === '/api/status') {
    return sendJson(res, 200, {
      ok: true,
      product: 'MAX',
      version: '0.2.0',
      port: PORT,
      db: getDb().prepare('SELECT COUNT(*) AS n FROM analyses').get().n,
    })
  }

  if (path === '/api/analyses' && req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || 30)
    return sendJson(res, 200, { items: listAnalyses(getDb(), limit) })
  }

  if (path === '/api/repositories' && req.method === 'GET') {
    return sendJson(res, 200, { items: listRepositories(getDb()) })
  }

  if (path.startsWith('/api/analyses/') && req.method === 'GET') {
    const id = Number(path.split('/').pop())
    const row = getAnalysis(getDb(), id)
    if (!row) return sendJson(res, 404, { error: 'Análise não encontrada' })
    return sendJson(res, 200, row)
  }

  if (path === '/api/analyze' && req.method === 'POST') {
    const body = await readBody(req)
    const { path: repoPath, mode = 'quick' } = JSON.parse(body || '{}')
    if (!repoPath) return sendJson(res, 400, { error: 'Campo path obrigatório' })
    const result = analyzeRepository(repoPath, { mode: mode === 'deep' ? 'deep' : 'quick' })
    return sendJson(res, 200, {
      id: result.analysisId,
      slug: result.repo.slug,
      mode: result.mode,
      health: result.health,
      recommendationCount: result.recommendations.length,
      data: result,
    })
  }

  return serveStatic(res, path === '/' ? '/index.html' : path)
}

function serveStatic(res, urlPath) {
  const safe = urlPath.replace(/\.\./g, '')
  const file = join(WEB, safe)
  if (!file.startsWith(WEB) || !existsSync(file)) {
    res.writeHead(404)
    res.end('Not found')
    return
  }
  const ext = extname(file)
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  res.end(readFileSync(file))
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data, null, 2))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 1_000_000) reject(new Error('Payload grande demais'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

process.on('SIGINT', () => {
  closeDb()
  process.exit(0)
})
