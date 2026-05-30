import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateExecutiveReport } from '../packages/core/lib/report-export.mjs'
import { compareAnalyses, compareToMarkdown } from '../packages/core/lib/repo-compare.mjs'

describe('Fase 11 — report export + compare', () => {
  it('generateExecutiveReport inclui health e recomendações', () => {
    const md = generateExecutiveReport({
      repo: { slug: 'demo' },
      mode: 'quick',
      generatedAt: '2026-01-01',
      health: { summary: '80/100 (B)', categories: [{ id: 'testes', label: 'Testes', weight: 10, score: 8, status: 'ok' }] },
      findings: [],
      recommendations: [{ id: 'r1', title: 'Add tests', priority: 1, category: 'testes', suggestedUpgrade: 'vitest' }],
      executiveSummary: { stack: 'vite', topGaps: ['CI'] },
    })
    assert.match(md, /Max Stack/)
    assert.match(md, /Próximos passos/)
  })

  it('compareAnalyses detecta vencedor', () => {
    const a = { repo: { slug: 'a' }, health: { overall: 90, summary: '90/100' }, recommendations: [], findings: [] }
    const b = { repo: { slug: 'b' }, health: { overall: 70, summary: '70/100' }, recommendations: [], findings: [] }
    const c = compareAnalyses(a, b)
    assert.equal(c.winner, 'a')
    assert.equal(c.healthDelta, 20)
  })

  it('compareToMarkdown gera texto', () => {
    const md = compareToMarkdown({
      a: { slug: 'a', health: '90/100', overall: 90 },
      b: { slug: 'b', health: '70/100', overall: 70 },
      summary: 'a à frente',
      categoryCompare: [],
      recsOnlyA: [],
      recsOnlyB: [],
    })
    assert.match(md, /Comparação/)
  })
})
