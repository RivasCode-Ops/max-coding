import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildPortfolioQuality, formatPortfolioQualityMarkdown } from '../packages/core/lib/portfolio-quality.mjs'

describe('Fase 27 — portfolio quality', () => {
  it('buildPortfolioQuality agrega checks', () => {
    const report = buildPortfolioQuality(
      [
        { slug: 'a', path: process.cwd(), health: 88 },
        { slug: 'b', path: process.cwd(), health: 70 },
      ],
      { maxRepos: 2 },
    )
    assert.equal(report.repos.length, 2)
    assert.ok(report.summary.averagePct >= 0)
    assert.equal(report.checks.length, 16)
    assert.ok(report.summary.weakestChecks.length)
  })

  it('formatPortfolioQualityMarkdown inclui média', () => {
    const report = buildPortfolioQuality([{ slug: 'x', path: process.cwd(), health: 80 }], { maxRepos: 1 })
    const md = formatPortfolioQualityMarkdown(report)
    assert.match(md, /Qualidade do portfolio/)
    assert.match(md, /Média/)
  })
})
