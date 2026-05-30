/**
 * Cliente GitHub REST API (Fase 5)
 */
import { getGithubAuthToken, githubHeaders, resolveInstallationId } from './github-auth.mjs'

export async function githubRequest(path, options = {}) {
  const ownerRepo = options.ownerRepo
  let auth = await getGithubAuthToken({ installationId: options.installationId })
  if (auth.type === 'none' && ownerRepo) {
    const installationId = await resolveInstallationId(ownerRepo)
    if (installationId) auth = await getGithubAuthToken({ installationId })
  }
  if (auth.type === 'none' && !options.allowAnonymous) {
    throw new Error('Configure GITHUB_TOKEN ou GitHub App (GITHUB_APP_ID + chave + installation)')
  }

  const url = path.startsWith('http') ? path : `https://api.github.com${path}`
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: { ...githubHeaders(auth.token), ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub API ${res.status} ${path}: ${text.slice(0, 300)}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function fetchPullRequest(ownerRepo, pullNumber) {
  const [owner, repo] = ownerRepo.split('/')
  return githubRequest(`/repos/${owner}/${repo}/pulls/${pullNumber}`, { ownerRepo })
}

export async function postIssueComment(ownerRepo, issueNumber, body) {
  const [owner, repo] = ownerRepo.split('/')
  return githubRequest(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
    method: 'POST',
    ownerRepo,
    body: { body },
  })
}

export async function listPullRequestFiles(ownerRepo, pullNumber) {
  const [owner, repo] = ownerRepo.split('/')
  return githubRequest(`/repos/${owner}/${repo}/pulls/${pullNumber}/files`, { ownerRepo })
}
