/**
 * Webhook GitHub — pull_request → análise + comentário (Fase 5)
 */
import { verifyWebhookSignature } from './github-auth.mjs'
import { analyzeRepository } from './analyze.mjs'
import { checkoutPullRequest } from './github-pr-checkout.mjs'
import { commentOnPullRequest } from './pr-comment.mjs'
import { resolveInstallationId } from './github-auth.mjs'

export function parseWebhookEvent(headers, rawBody) {
  const event = headers['x-github-event'] || headers['X-GitHub-Event']
  const delivery = headers['x-github-delivery'] || headers['X-GitHub-Delivery']
  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    throw new Error('Payload JSON inválido')
  }
  return { event, delivery, payload }
}

export async function handleGithubWebhook(rawBody, headers, options = {}) {
  const secret = options.webhookSecret || process.env.GITHUB_WEBHOOK_SECRET
  const signature = headers['x-hub-signature-256'] || headers['X-Hub-Signature-256']

  if (secret && !verifyWebhookSignature(rawBody, signature, secret)) {
    return { ok: false, status: 401, error: 'Assinatura inválida' }
  }

  const { event, delivery, payload } = parseWebhookEvent(headers, rawBody)

  if (event === 'ping') {
    return { ok: true, status: 200, message: 'pong', delivery }
  }

  if (event !== 'pull_request') {
    return { ok: true, status: 200, skipped: true, event }
  }

  const action = payload.action
  if (!['opened', 'synchronize', 'reopened'].includes(action)) {
    return { ok: true, status: 200, skipped: true, action }
  }

  const pr = payload.pull_request
  const repo = payload.repository
  const ownerRepo = repo.full_name
  const pullNumber = pr.number

  if (options.installationId) {
    process.env.GITHUB_INSTALLATION_ID = String(options.installationId)
  } else if (payload.installation?.id) {
    process.env.GITHUB_INSTALLATION_ID = String(payload.installation.id)
  } else {
    const id = await resolveInstallationId(ownerRepo)
    if (id) process.env.GITHUB_INSTALLATION_ID = id
  }

  const checkout = await checkoutPullRequest(ownerRepo, pullNumber, { pr, forceRefresh: true })
  const result = await analyzeRepository(checkout.path, {
    mode: options.mode || 'quick',
    writeReports: false,
    githubSearch: false,
    persistSqlite: true,
  })

  const posted = await commentOnPullRequest(ownerRepo, pullNumber, result, { pr })
  return {
    ok: true,
    status: 200,
    delivery,
    ownerRepo,
    pullNumber,
    health: result.health?.summary,
    commentUrl: posted.comment?.html_url,
  }
}
