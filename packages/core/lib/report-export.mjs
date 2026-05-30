/**
 * Relatório executivo exportável — Fase 11
 */
import { toMarkdown } from '../../recommender/lib/recommend.mjs'
import { suggestNextActions } from './repo-context.mjs'
import { generateIssuesMarkdown } from './issues-export.mjs'
import { formatQualitySignalsMarkdown } from './quality-signals.mjs'

export function generateExecutiveReport(result, options = {}) {
  const profile = result.profile || { slug: result.repo?.slug || 'repo' }
  const sections = []

  sections.push(toMarkdown(result, profile))

  if (result.executiveSummary) {
    sections.push('## Resumo executivo', '')
    sections.push(`- **Stack:** ${result.executiveSummary.stack}`)
    for (const g of result.executiveSummary.topGaps || []) {
      sections.push(`- **Gap:** ${g}`)
    }
    sections.push('')
  }

  if (result.scanDiff?.hasPrevious) {
    const d = result.scanDiff
    sections.push('## Evolução vs scan anterior', '')
    sections.push(`- Health: ${d.healthDelta >= 0 ? '+' : ''}${d.healthDelta} pts`)
    if (d.resolvedFindings?.length) {
      sections.push(`- Resolvidos: ${d.resolvedFindings.join('; ')}`)
    }
    if (d.newFindings?.length) {
      sections.push(`- Novos: ${d.newFindings.join('; ')}`)
    }
    sections.push('')
  }

  const next = suggestNextActions(result)
  if (next.length) {
    sections.push('## Próximos passos sugeridos', '')
    for (const a of next) {
      sections.push(`- **${a.title}** — ${a.detail}`)
    }
    sections.push('')
  }

  if (result.qualitySignals?.checks?.length) {
    sections.push(formatQualitySignalsMarkdown(result.qualitySignals))
  }

  if (result.checklist?.length) {
    sections.push('## Checklist de verificação', '')
    for (const c of result.checklist.slice(0, 12)) {
      sections.push(`- [ ] ${c.item}`)
    }
    sections.push('')
  }

  if (options.includeIssues) {
    sections.push('---', '', generateIssuesMarkdown(result, { max: options.maxIssues ?? 5 }))
  }

  sections.push('---', '', '*Relatório Max Stack — local-first*')
  return sections.join('\n')
}

export function writeReportFilename(slug, ext = 'md') {
  const stamp = new Date().toISOString().slice(0, 10)
  return `max-stack-${slug}-${stamp}.${ext}`
}
