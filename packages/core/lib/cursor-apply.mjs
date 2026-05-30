/**
 * Gera prompts para aplicar recomendações via Cursor Agent (Fase 8)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function buildCursorApplyPrompt(rec, context = {}) {
  const { repo = {}, profile = {}, health = {} } = context
  const fw = (profile.summary?.frameworks || []).join(', ') || '—'
  const scripts = profile.stack?.scripts || {}
  const scriptBlock = Object.keys(scripts).length
    ? Object.entries(scripts)
        .map(([k, v]) => `- \`npm run ${k}\` → ${v}`)
        .join('\n')
    : '- (sem scripts npm)'

  const refs = (rec.references || [])
    .map((r) => `- [${r.repo}](${r.url})`)
    .join('\n')
  const areas = (rec.affectedAreas || []).map((a) => `\`${a}\``).join(', ') || 'detectar no repo'
  const evidence = Array.isArray(rec.evidence)
    ? rec.evidence.map((e) => (typeof e === 'string' ? e : e.ref)).join(', ')
    : ''

  return `# Max Stack — Implementar: ${rec.title}

> Cole este prompt no **Cursor Agent** (Ctrl+I) ou referencie \`@.cursor/max-stack/tasks/${context.taskFile || 'task.md'}\`

## Repositório
- **Path:** \`${repo.path || '—'}\`
- **Stack:** ${fw}
- **Health:** ${health.summary || '—'}

## Objetivo
${rec.title}

## Problema
${rec.problem || rec.justification || '—'}

## Sugestão Max Stack
${rec.suggestedUpgrade || 'Implementar seguindo padrões do catálogo OSS e convenções do repo.'}

## Impacto / esforço
- Impacto: ${rec.impact || '—'} · Esforço: ${rec.effort || '—'} · Risco: ${rec.risk || '—'} · Prioridade: P${rec.priority ?? '?'}

## Áreas afetadas
${areas}

${evidence ? `## Evidência\n${evidence}\n` : ''}
${refs ? `## Referências OSS\n${refs}\n` : ''}
## Comandos do projeto
${scriptBlock}

## Instruções para o agente
1. Leia o código existente nas áreas afetadas antes de editar.
2. Faça a **menor mudança** que resolve o problema descrito.
3. Siga o estilo e convenções já usados no repo.
4. Rode testes/build após alterar (\`npm test\`, \`npm run build\` se existirem).
5. **Não commite** a menos que o usuário peça explicitamente.

## Critérios de aceite
- [ ] Problema "${rec.title}" resolvido com evidência no código
- [ ] Testes existentes passando
- [ ] Sem regressões óbvias na UI ou API
`
}

export function writeCursorTask(repoPath, slug, taskId, content) {
  if (!existsSync(repoPath)) throw new Error(`Repo não encontrado: ${repoPath}`)
  const safeId = taskId.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()
  const dir = join(repoPath, '.cursor', 'max-stack', 'tasks')
  mkdirSync(dir, { recursive: true })
  const filename = `${slug}-${safeId}.md`
  const target = join(dir, filename)
  writeFileSync(target, content, 'utf8')
  return { written: target, filename, relative: `.cursor/max-stack/tasks/${filename}` }
}

export function recommendationToRecObject(r, analysisResult) {
  return {
    id: r.id,
    title: r.title,
    problem: r.problem,
    suggestedUpgrade: r.suggestedUpgrade,
    impact: r.impact,
    effort: r.effort,
    risk: r.risk,
    priority: r.priority,
    references: r.references,
    affectedAreas: r.affectedAreas,
    evidence: r.evidence,
    category: r.category,
    context: analysisResult,
  }
}

export function mapRecToPilotFix(rec) {
  const t = `${rec.title || ''} ${rec.problem || ''}`.toLowerCase()
  if (t.includes('security')) return 'security-md'
  if (t.includes('dependabot') || t.includes('renovate')) return 'dependabot'
  if (t.includes('license')) return 'license-mit'
  if (t.includes('eslint') || t.includes('linter')) return 'eslint'
  if (t.includes('editorconfig')) return 'editorconfig'
  if (t.includes('.env')) return 'env-example'
  return null
}

export function applyRecommendationViaCursor(analysisResult, recommendationId, options = {}) {
  const rec = (analysisResult.recommendations || []).find((r) => r.id === recommendationId)
  if (!rec) throw new Error(`Recomendação ${recommendationId} não encontrada`)

  const context = {
    repo: analysisResult.repo,
    profile: analysisResult.profile,
    health: analysisResult.health,
  }
  const taskFile = `${analysisResult.repo.slug}-${recommendationId}.md`
  const prompt = buildCursorApplyPrompt(rec, { ...context, taskFile })
  const pilotFix = mapRecToPilotFix(rec)

  let written = null
  if (options.writeFile !== false && analysisResult.repo?.path) {
    written = writeCursorTask(analysisResult.repo.path, analysisResult.repo.slug, recommendationId, prompt)
  }

  return {
    recommendationId,
    title: rec.title,
    prompt,
    written,
    pilotFix,
    cursorHint: written
      ? `No Cursor Agent: @${written.relative}`
      : 'Cole o prompt no Cursor Agent (Ctrl+I)',
  }
}

export function applyBatchRecommendations(analysisResult, options = {}) {
  const maxPriority = options.maxPriority ?? 2
  const recs = (analysisResult.recommendations || []).filter((r) => (r.priority ?? 3) <= maxPriority)
  return recs.map((r) => applyRecommendationViaCursor(analysisResult, r.id, options))
}
