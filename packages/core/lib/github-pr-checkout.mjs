/**
 * Checkout de PR para análise local (Fase 5)
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { fetchPullRequest } from './github-api.mjs'

const ROOT = join(fileURLToPath(new URL('../../..', import.meta.url)))
const PR_DIR = join(ROOT, 'data', 'pr-checkouts')

export function getPrCheckoutPath(ownerRepo, pullNumber) {
  const slug = ownerRepo.replace('/', '-').toLowerCase()
  return join(PR_DIR, `${slug}-pr-${pullNumber}`)
}

export async function checkoutPullRequest(ownerRepo, pullNumber, options = {}) {
  const target = getPrCheckoutPath(ownerRepo, pullNumber)
  const pr = options.pr || (await fetchPullRequest(ownerRepo, pullNumber))
  const [owner, repo] = ownerRepo.split('/')
  const remote = `https://github.com/${owner}/${repo}.git`

  if (options.forceRefresh && existsSync(target)) {
    rmSync(target, { recursive: true, force: true })
  }

  mkdirSync(PR_DIR, { recursive: true })

  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true })
    runGit(target, ['init'])
    runGit(target, ['remote', 'add', 'origin', remote])
  }

  runGit(target, ['fetch', 'origin', pr.head.sha, '--depth', '1'])
  runGit(target, ['checkout', 'FETCH_HEAD'])

  return {
    path: target,
    slug: `${ownerRepo.replace('/', '-')}-pr-${pullNumber}`.toLowerCase(),
    sha: pr.head.sha,
    ref: pr.head.ref,
    pr,
  }
}

function runGit(cwd, args) {
  const proc = spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 120_000 })
  if (proc.status !== 0) {
    throw new Error(`git ${args.join(' ')}: ${proc.stderr || proc.stdout}`)
  }
  return proc.stdout
}
