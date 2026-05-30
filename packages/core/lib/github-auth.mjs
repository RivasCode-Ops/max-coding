/**
 * Autenticação GitHub — App JWT + installation token ou PAT (Fase 5)
 */
import { createSign, timingSafeEqual, createHmac } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

let cachedInstallationToken = null
let cachedInstallationExpires = 0

export function getGithubConfig() {
  return {
    token: process.env.GITHUB_TOKEN || null,
    appId: process.env.GITHUB_APP_ID || null,
    privateKey: loadPrivateKey(),
    installationId: process.env.GITHUB_INSTALLATION_ID || null,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || null,
  }
}

function loadPrivateKey() {
  const inline = process.env.GITHUB_APP_PRIVATE_KEY
  if (inline) return inline.replace(/\\n/g, '\n')
  const path = process.env.GITHUB_APP_PRIVATE_KEY_PATH
  if (path && existsSync(path)) return readFileSync(resolve(path), 'utf8')
  return null
}

export function signAppJwt(appId, privateKeyPem) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 600, iss: String(appId) }))
  const data = `${header}.${payload}`
  const sign = createSign('RSA-SHA256')
  sign.update(data)
  return `${data}.${sign.sign(privateKeyPem, 'base64url')}`
}

export async function getGithubAuthToken(options = {}) {
  const cfg = getGithubConfig()
  const installationId = options.installationId || cfg.installationId

  if (cfg.appId && cfg.privateKey && installationId) {
    if (cachedInstallationToken && Date.now() < cachedInstallationExpires - 60_000) {
      return { token: cachedInstallationToken, type: 'app' }
    }
    const jwt = signAppJwt(cfg.appId, cfg.privateKey)
    const res = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
      method: 'POST',
      headers: githubHeaders(jwt),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`GitHub App token falhou (${res.status}): ${err}`)
    }
    const data = await res.json()
    cachedInstallationToken = data.token
    cachedInstallationExpires = new Date(data.expires_at).getTime()
    return { token: data.token, type: 'app' }
  }

  if (cfg.token) return { token: cfg.token, type: 'pat' }
  return { token: null, type: 'none' }
}

export async function resolveInstallationId(ownerRepo) {
  const cfg = getGithubConfig()
  if (cfg.installationId) return cfg.installationId
  if (!cfg.appId || !cfg.privateKey) return null

  const jwt = signAppJwt(cfg.appId, cfg.privateKey)
  const [owner, repo] = ownerRepo.split('/')
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/installation`, {
    headers: githubHeaders(jwt),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Installation lookup ${res.status}`)
  const data = await res.json()
  return String(data.id)
}

export function githubHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'MaxStack/0.7',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export function verifyWebhookSignature(payload, signatureHeader, secret) {
  if (!secret || !signatureHeader) return false
  const expected = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
  } catch {
    return false
  }
}

function base64url(str) {
  return Buffer.from(str).toString('base64url')
}

export function resetAuthCache() {
  cachedInstallationToken = null
  cachedInstallationExpires = 0
}
