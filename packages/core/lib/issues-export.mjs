/**
 * Exporta backlog/recomendações como issues GitHub (Fase 4)
 */
export function generateIssuesMarkdown(result, options = {}) {
  const max = options.max ?? 8
  const slug = result.repo?.slug || 'repo'
  const items = pickItems(result, max)
  const lines = [
    `# Max Stack — issues sugeridas para ${slug}`,
    '',
    `Gerado: ${result.generatedAt || new Date().toISOString()}`,
    `Health: ${result.health?.summary || '—'}`,
    '',
    'Copie cada bloco como issue no GitHub ou use `gh issue create`.',
    '',
  ]

  items.forEach((item, i) => {
    lines.push(`---`)
    lines.push('')
    lines.push(`## Issue ${i + 1}: ${item.title}`)
    lines.push('')
    lines.push('```markdown')
    lines.push(`### ${item.title}`)
    lines.push('')
    lines.push(`**Prioridade:** P${item.priority}`)
    if (item.impact) lines.push(`**Impacto:** ${item.impact}`)
    if (item.effort) lines.push(`**Esforço:** ${item.effort}`)
    if (item.risk) lines.push(`**Risco:** ${item.risk}`)
    lines.push('')
    lines.push(item.body)
    lines.push('')
    lines.push('---')
    lines.push('*Gerado por Max Stack*')
    lines.push('```')
    lines.push('')
  })

  return lines.join('\n')
}

export function pickIssueItems(result, max = 8) {
  return pickItems(result, max)
}

function pickItems(result, max) {
  const fromBacklog = (result.backlog || []).map((b) => ({
    title: b.title,
    priority: b.priority ?? 2,
    body: (b.tasks || []).map((t) => `- [ ] ${t}`).join('\n') || b.title,
    impact: b.impact,
    effort: b.effort,
    risk: b.risk,
  }))

  const fromRecs = (result.recommendations || [])
    .filter((r) => r.priority <= 2)
    .map((r) => ({
      title: r.title,
      priority: r.priority,
      body: [r.problem, r.suggestedUpgrade].filter(Boolean).join('\n\n'),
      impact: r.impact,
      effort: r.effort,
      risk: r.risk,
    }))

  const seen = new Set()
  const merged = []
  for (const item of [...fromBacklog, ...fromRecs]) {
    if (seen.has(item.title)) continue
    seen.add(item.title)
    merged.push(item)
    if (merged.length >= max) break
  }
  return merged.sort((a, b) => a.priority - b.priority)
}

export function generateGhCliScript(result, options = {}) {
  const md = generateIssuesMarkdown(result, options)
  const items = pickItems(result, options.max ?? 8)
  const lines = ['#!/usr/bin/env bash', '# Max Stack — criar issues (requer gh auth)', '']
  for (const item of items) {
    const body = [item.body, '', '---', '*Max Stack*'].join('\n').replace(/"/g, '\\"')
    lines.push(`gh issue create --title "${item.title.replace(/"/g, '\\"')}" --body "${body}"`)
  }
  return { markdown: md, script: lines.join('\n'), count: items.length }
}
