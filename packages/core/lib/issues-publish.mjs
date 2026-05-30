/**
 * Publicar issues no GitHub via API — Fase 14
 */
import { createGithubIssue } from './github-api.mjs'
import { pickIssueItems } from './issues-export.mjs'
import { parseGitRemoteOwnerRepo } from './repo-context.mjs'

export function formatIssueBody(item, meta = {}) {
  const lines = [
    `**Prioridade:** P${item.priority}`,
    item.impact ? `**Impacto:** ${item.impact}` : null,
    item.effort ? `**Esforço:** ${item.effort}` : null,
    item.risk ? `**Risco:** ${item.risk}` : null,
    '',
    item.body,
    '',
    '---',
    '*Gerado por Max Stack*',
  ]
  if (meta.health) lines.push(`Health no scan: ${meta.health}`)
  if (meta.analysisId) lines.push(`Análise #${meta.analysisId}`)
  return lines.filter(Boolean).join('\n')
}

export function issueLabelsForPriority(priority) {
  const labels = ['max-stack']
  if (priority <= 1) labels.push('priority-p1')
  else if (priority === 2) labels.push('priority-p2')
  return labels
}

export function resolveOwnerRepoForPublish(analysisResult, repoPath, override) {
  if (override) return override
  return (
    analysisResult?.repo?.ownerRepo ||
    analysisResult?.profile?.intake?.ownerRepo ||
    (repoPath ? parseGitRemoteOwnerRepo(repoPath) : null)
  )
}

export async function publishIssuesToGithub(analysisResult, options = {}) {
  const ownerRepo = resolveOwnerRepoForPublish(analysisResult, options.repoPath, options.ownerRepo)
  if (!ownerRepo) {
    throw new Error('Repo sem owner/repo — configure remote GitHub ou informe ownerRepo')
  }

  const max = options.max ?? 5
  const dryRun = Boolean(options.dryRun)
  const items = pickIssueItems(analysisResult, max)
  const meta = {
    health: analysisResult?.health?.summary,
    analysisId: options.analysisId,
  }

  const issues = []
  for (const item of items) {
    const body = formatIssueBody(item, meta)
    const labels = issueLabelsForPriority(item.priority)
    if (dryRun) {
      issues.push({ title: item.title, priority: item.priority, preview: true, labels })
      continue
    }
    const created = await createGithubIssue(ownerRepo, { title: item.title, body, labels })
    issues.push({
      title: item.title,
      number: created.number,
      url: created.html_url,
      priority: item.priority,
    })
  }

  return {
    ownerRepo,
    dryRun,
    count: issues.length,
    issues,
  }
}
