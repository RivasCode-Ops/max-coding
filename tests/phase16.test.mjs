import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildPlanPackage, formatPlanMarkdown, writePlanFilename } from '../packages/core/lib/plan-package.mjs'

const sample = {
  generatedAt: '2026-05-30T12:00:00.000Z',
  mode: 'deep',
  repo: { slug: 'demo', path: '/tmp/demo' },
  health: { summary: '82/100 (B)' },
  executiveSummary: { stack: 'vite', topGaps: ['Sem CI'] },
  backlog: [{ id: 'b1', title: 'Add CI', priority: 1, tasks: ['workflow.yml'] }],
  checklist: [{ id: 'c1', item: '[testes] Cobertura', done: false }],
  prPlan: {
    repo: 'demo',
    branches: ['max-stack/demo-improvements'],
    commits: [{ order: 1, message: 'fix(ci): add workflow', files: ['.github/workflows'] }],
    note: 'Revisar antes de merge',
  },
  verification: { ok: true, issues: [] },
  recommendations: [{ id: 'r1', title: 'CI', priority: 1 }],
}

describe('Fase 16 — plan package', () => {
  it('buildPlanPackage bloqueia apply automático', () => {
    const pkg = buildPlanPackage(sample)
    assert.equal(pkg.auditMode, 'plan')
    assert.equal(pkg.authorization.applyAllowed, false)
    assert.equal(pkg.counts.backlog, 1)
    assert.equal(pkg.counts.prCommits, 1)
  })

  it('formatPlanMarkdown inclui PR plan e backlog', () => {
    const md = formatPlanMarkdown(sample)
    assert.match(md, /Modo plan/)
    assert.match(md, /PR plan/)
    assert.match(md, /Add CI/)
    assert.match(md, /max-stack\/demo-improvements/)
  })

  it('writePlanFilename usa prefixo plan', () => {
    assert.match(writePlanFilename('demo'), /^max-stack-plan-demo-/)
  })
})
