/**
 * Formata e publica comentário de auditoria em PR (Fase 5)
 */
import { fetchPullRequest, listPullRequestFiles, postIssueComment } from './github-api.mjs'

const MAX_FINDINGS = 6
const MAX_RECS = 4

export function formatPrComment(result, context = {}) {
  const { ownerRepo, pullNumber, prFiles } = context
  const lines = [
    '## Max Stack — Auditoria',
    '',
    `**Health:** ${result.health?.summary || '—'} · **Modo:** ${result.mode}`,
  ]
  if (pullNumber) lines.push(`**PR:** #${pullNumber}`)
  if (ownerRepo) lines.push(`**Repo:** \`${ownerRepo}\``)
  if (result.scanDiff?.hasPrevious) {
    const d = result.scanDiff.healthDelta ?? 0
    lines.push(`**Δ vs scan anterior:** ${d >= 0 ? '+' : ''}${d} pts`)
  }

  lines.push('')
  if (result.executiveSummary) {
    lines.push('### Resumo')
    lines.push(`- Stack: ${result.executiveSummary.stack}`)
    for (const g of result.executiveSummary.topGaps || []) {
      lines.push(`- Gap: ${g}`)
    }
    lines.push('')
  }

  const findings = (result.findings || []).slice(0, MAX_FINDINGS)
  if (findings.length) {
    lines.push(`### Achados (${result.findings.length})`)
    for (const f of findings) {
      lines.push(`- **[${f.findingType}]** ${f.title}`)
    }
    if (result.findings.length > MAX_FINDINGS) {
      lines.push(`- _… e mais ${result.findings.length - MAX_FINDINGS}_`)
    }
    lines.push('')
  }

  const recs = (result.recommendations || []).filter((r) => r.priority <= 2).slice(0, MAX_RECS)
  if (recs.length) {
    lines.push('### Recomendações prioritárias')
    for (const r of recs) {
      lines.push(`- **[P${r.priority}]** ${r.title}`)
    }
    lines.push('')
  }

  if (prFiles?.length) {
    lines.push(`### Arquivos alterados (${prFiles.length})`)
    for (const f of prFiles.slice(0, 8)) {
      lines.push(`- \`${f.filename}\` (+${f.additions}/-${f.deletions})`)
    }
    if (prFiles.length > 8) lines.push(`- _… e mais ${prFiles.length - 8}_`)
    lines.push('')
  }

  if (result.checklist?.length) {
    lines.push('### Checklist')
    for (const c of result.checklist.slice(0, 5)) {
      lines.push(`- [ ] ${c.item}`)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('*Gerado por Max Stack — auditoria local-first*')
  return lines.join('\n')
}

export async function commentOnPullRequest(ownerRepo, pullNumber, result, options = {}) {
  const pr = options.pr || (await fetchPullRequest(ownerRepo, pullNumber))
  const prFiles = options.prFiles || (await listPullRequestFiles(ownerRepo, pullNumber).catch(() => []))
  const body = formatPrComment(result, { ownerRepo, pullNumber, prFiles })
  const comment = await postIssueComment(ownerRepo, pullNumber, body)
  return { comment, body, pr: { title: pr.title, head: pr.head?.sha, url: pr.html_url } }
}

export function buildPrCommentMarker(pullNumber) {
  return `<!-- max-stack-pr-${pullNumber} -->`
}
