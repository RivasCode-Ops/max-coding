/**
 * Pacote de plano autorizado — Fase 16 (modo plan)
 * Backlog + PR plan + checklist + gate QA — sem apply automático
 */
import { generateIssuesMarkdown } from './issues-export.mjs'
import { suggestNextActions } from './repo-context.mjs'

const APPLY_NOTICE =
  'Modo plan: revisão humana obrigatória antes de apply-pilot, cursor-apply ou merge no repo alvo.'

export function buildPlanPackage(result, options = {}) {
  const slug = result.repo?.slug || 'repo'
  const prPlan = result.prPlan || { repo: slug, branches: [], commits: [], note: '' }
  const backlog = result.backlog || []
  const checklist = result.checklist || []
  const verification = result.verification || { ok: true, issues: [] }

  return {
    product: 'Max Stack',
    phase: 'plan',
    auditMode: 'plan',
    generatedAt: result.generatedAt || new Date().toISOString(),
    repo: {
      slug,
      path: result.repo?.path,
      source: result.repo?.source,
      ownerRepo: result.repo?.ownerRepo || null,
    },
    health: result.health?.summary,
    analysisMode: result.mode || 'deep',
    executiveSummary: result.executiveSummary || null,
    backlog,
    checklist,
    prPlan,
    verification,
    authorization: {
      applyAllowed: false,
      requiresHumanReview: true,
      allowedNextSteps: ['cursor-apply', 'apply-pilot', 'verify', 'publish-issues'],
      notice: APPLY_NOTICE,
    },
    counts: {
      backlog: backlog.length,
      checklist: checklist.length,
      prCommits: (prPlan.commits || []).length,
      recommendations: (result.recommendations || []).length,
    },
    nextActions: options.includeNextActions !== false ? suggestNextActions(result) : [],
  }
}

export function formatPlanMarkdown(result, options = {}) {
  const pkg = buildPlanPackage(result, options)
  const lines = [
    `# Max Stack — Plano de implementação (${pkg.repo.slug})`,
    '',
    `**Modo:** plan · **Health:** ${pkg.health || '—'} · **Gerado:** ${pkg.generatedAt}`,
    '',
    `> ${pkg.authorization.notice}`,
    '',
  ]

  if (pkg.executiveSummary) {
    lines.push('## Resumo executivo', '')
    lines.push(`- **Stack:** ${pkg.executiveSummary.stack}`)
    for (const g of pkg.executiveSummary.topGaps || []) {
      lines.push(`- **Gap:** ${g}`)
    }
    lines.push('')
  }

  if (pkg.prPlan?.branches?.length || pkg.prPlan?.commits?.length) {
    lines.push('## PR plan', '')
    if (pkg.prPlan.branches?.length) {
      lines.push(`- **Branch(es):** ${pkg.prPlan.branches.join(', ')}`)
    }
    if (pkg.prPlan.note) lines.push(`- ${pkg.prPlan.note}`)
    lines.push('')
    for (const c of pkg.prPlan.commits || []) {
      lines.push(`${c.order}. \`${c.message}\`${c.files?.length ? ` — ${c.files.join(', ')}` : ''}`)
    }
    lines.push('')
  }

  if (pkg.backlog.length) {
    lines.push('## Backlog priorizado', '')
    for (const b of pkg.backlog.slice(0, options.maxBacklog ?? 12)) {
      lines.push(`### P${b.priority} — ${b.title}`, '')
      for (const t of b.tasks || []) {
        lines.push(`- [ ] ${t}`)
      }
      if (b.acceptance?.length) {
        lines.push('', '**Aceite:**')
        for (const a of b.acceptance) lines.push(`- ${a}`)
      }
      lines.push('')
    }
  }

  if (pkg.checklist.length) {
    lines.push('## Checklist QA', '')
    for (const c of pkg.checklist.slice(0, options.maxChecklist ?? 15)) {
      lines.push(`- [ ] ${c.item}`)
    }
    lines.push('')
  }

  lines.push('## Gate de verificação', '')
  lines.push(`- **QA Verifier:** ${pkg.verification.ok ? 'APPROVED (estrutura)' : 'REVIEW REQUIRED'}`)
  if (pkg.verification.issues?.length) {
    for (const issue of pkg.verification.issues) lines.push(`  - ${issue}`)
  }
  lines.push('')

  if (pkg.nextActions?.length) {
    lines.push('## Próximas ações (Max Stack)', '')
    for (const a of pkg.nextActions) {
      lines.push(`- **${a.title}** (${a.action}) — ${a.detail}`)
    }
    lines.push('')
  }

  if (options.includeIssues) {
    lines.push('---', '', generateIssuesMarkdown(result, { max: options.maxIssues ?? 5 }))
  }

  lines.push('---', '', '*Plano Max Stack — não aplicar patches sem autorização explícita*')
  return lines.join('\n')
}

export function writePlanFilename(slug, ext = 'md') {
  const stamp = new Date().toISOString().slice(0, 10)
  return `max-stack-plan-${slug}-${stamp}.${ext}`
}

export function planPackageJson(pkg) {
  return JSON.stringify(pkg, null, 2)
}
