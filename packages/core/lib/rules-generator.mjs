/**
 * Gera .cursor/rules a partir do perfil (estilo ECC — Fase 2)
 */
export function generateCursorRules(result) {
  const { profile, repo, health, recommendations = [], findings = [] } = result
  const fw = (profile.summary?.frameworks || []).join(', ') || 'detectar manualmente'
  const scripts = profile.stack?.scripts || {}
  const scriptLines = Object.keys(scripts).length
    ? Object.entries(scripts)
        .map(([k, v]) => `- \`npm run ${k}\` → ${v}`)
        .join('\n')
    : '- (sem scripts npm detectados)'

  const topRecs = recommendations.slice(0, 6)
  const topGaps = findings
    .filter((f) => f.findingType !== 'confirmed' || f.severity !== 'low')
    .slice(0, 5)

  return `---
description: ${repo.slug} — regras geradas pelo Max Stack
alwaysApply: true
---

# ${repo.slug}

> Gerado por Max Stack · health ${health?.summary || '—'}

## Stack detectada
${fw}

## Caminhos
- Repo: \`${repo.path}\`
${repo.url ? `- GitHub: ${repo.url}` : ''}

## Comandos
${scriptLines}
- Validar: \`npm test\` (se existir)

## Health (${health?.overall ?? '—'}/100)
${(health?.categories || [])
  .filter((c) => c.status === 'gap')
  .map((c) => `- Gap: **${c.label || c.id}**`)
  .join('\n') || '- Sem gaps críticos nas categorias'}

## Prioridades Max Stack
${topRecs.map((r) => `- [P${r.priority}] ${r.title}`).join('\n') || '- Nenhuma recomendação pendente'}

## Achados a considerar
${topGaps.map((f) => `- [${f.findingType}] ${f.title}`).join('\n') || '- Nenhum'}

## Regras para agentes
- Não inventar problemas sem evidência no repo
- Rodar testes antes de commit
- Não aplicar refactors grandes sem alinhar ao backlog Max Stack
`
}

export function cursorRulesFilename(slug) {
  return `${slug.replace(/[^a-z0-9-]/gi, '-')}.mdc`
}
