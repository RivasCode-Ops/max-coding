#!/usr/bin/env node
/**
 * Max Stack — comentário de auditoria em PR
 * Uso: npm run pr-comment -- owner/repo 123 [--mode quick|deep]
 */
import { analyzeRepository, closeDb } from '../lib/analyze.mjs'
import { checkoutPullRequest } from '../lib/github-pr-checkout.mjs'
import { commentOnPullRequest, formatPrComment } from '../lib/pr-comment.mjs'
import { getGithubConfig } from '../lib/github-auth.mjs'

const args = process.argv.slice(2)
const ownerRepo = args[0]
const pullNumber = Number(args[1])
const mode = args.includes('--deep') ? 'deep' : 'quick'
const dryRun = args.includes('--dry-run')

if (!ownerRepo || !pullNumber) {
  console.error('Uso: npm run pr-comment -- owner/repo <pr-number> [--deep] [--dry-run]')
  process.exit(1)
}

const cfg = getGithubConfig()
if (!cfg.token && !cfg.appId) {
  console.error('Configure GITHUB_TOKEN ou GitHub App (GITHUB_APP_ID + chave)')
  process.exit(1)
}

try {
  console.log(`Checkout PR #${pullNumber} em ${ownerRepo}…`)
  const checkout = await checkoutPullRequest(ownerRepo, pullNumber, { forceRefresh: true })
  console.log(`Analisando ${checkout.path} (${mode})…`)
  const result = await analyzeRepository(checkout.path, { mode, writeReports: false, githubSearch: mode === 'deep' })

  const body = formatPrComment(result, { ownerRepo, pullNumber })
  if (dryRun) {
    console.log(body)
    process.exit(0)
  }

  const posted = await commentOnPullRequest(ownerRepo, pullNumber, result)
  console.log(`Comentário publicado: ${posted.comment.html_url}`)
  console.log(`Health: ${result.health.summary}`)
} catch (err) {
  console.error(err.message)
  process.exit(1)
} finally {
  closeDb()
}
