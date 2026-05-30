/**
 * Comparação entre dois repositórios ou análises — Fase 11
 */
import { diffAnalyses } from './scan-diff.mjs'

export function compareAnalyses(current, baseline, labels = {}) {
  const nameA = labels.a || current.repo?.slug || 'A'
  const nameB = labels.b || baseline.repo?.slug || 'B'

  const diff = diffAnalyses(current, baseline)
  const catA = Object.fromEntries((current.health?.categories || []).map((c) => [c.id, c.score]))
  const catB = Object.fromEntries((baseline.health?.categories || []).map((c) => [c.id, c.score]))
  const categoryCompare = Object.keys({ ...catA, ...catB }).map((id) => ({
    id,
    a: catA[id] ?? 0,
    b: catB[id] ?? 0,
    delta: (catA[id] ?? 0) - (catB[id] ?? 0),
  })).filter((c) => c.delta !== 0).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))

  const recTitlesA = new Set((current.recommendations || []).map((r) => r.title))
  const recTitlesB = new Set((baseline.recommendations || []).map((r) => r.title))
  const recsOnlyA = [...recTitlesA].filter((t) => !recTitlesB.has(t))
  const recsOnlyB = [...recTitlesB].filter((t) => !recTitlesA.has(t))

  const winner =
    (current.health?.overall ?? 0) > (baseline.health?.overall ?? 0)
      ? nameA
      : (current.health?.overall ?? 0) < (baseline.health?.overall ?? 0)
        ? nameB
        : 'empate'

  return {
    a: { slug: nameA, health: current.health?.summary, overall: current.health?.overall ?? 0 },
    b: { slug: nameB, health: baseline.health?.summary, overall: baseline.health?.overall ?? 0 },
    healthDelta: (current.health?.overall ?? 0) - (baseline.health?.overall ?? 0),
    winner,
    diff,
    categoryCompare: categoryCompare.slice(0, 12),
    recsOnlyA: recsOnlyA.slice(0, 8),
    recsOnlyB: recsOnlyB.slice(0, 8),
    summary:
      winner === 'empate'
        ? `${nameA} e ${nameB} com health similar`
        : `${winner} está à frente (${Math.abs((current.health?.overall ?? 0) - (baseline.health?.overall ?? 0))} pts)`,
  }
}

export function compareToMarkdown(comparison) {
  const lines = [
    `# Max Stack — Comparação`,
    '',
    `**${comparison.a.slug}:** ${comparison.a.health}`,
    `**${comparison.b.slug}:** ${comparison.b.health}`,
    '',
    `**Resultado:** ${comparison.summary}`,
    '',
  ]
  if (comparison.categoryCompare.length) {
    lines.push('## Categorias (delta)', '')
    for (const c of comparison.categoryCompare) {
      lines.push(`- ${c.id}: ${c.a} vs ${c.b} (${c.delta >= 0 ? '+' : ''}${c.delta})`)
    }
    lines.push('')
  }
  if (comparison.recsOnlyA.length) {
    lines.push(`## Só em ${comparison.a.slug}`, '')
    comparison.recsOnlyA.forEach((t) => lines.push(`- ${t}`))
    lines.push('')
  }
  if (comparison.recsOnlyB.length) {
    lines.push(`## Só em ${comparison.b.slug}`, '')
    comparison.recsOnlyB.forEach((t) => lines.push(`- ${t}`))
    lines.push('')
  }
  return lines.join('\n')
}
