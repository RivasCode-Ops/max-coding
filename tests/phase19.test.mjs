import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPortfolioDigest,
  formatPortfolioDigestMarkdown,
  writeDigestFilename,
} from '../packages/core/lib/portfolio-digest.mjs'

describe('Fase 19 — portfolio digest', () => {
  it('buildPortfolioDigest agrega summary e alertas', () => {
    const digest = buildPortfolioDigest(
      [
        { slug: 'a', path: '/a', health: 95, grade: 'A' },
        { slug: 'b', path: '/b', health: 55, grade: 'F' },
      ],
      null,
      { root: 'c:\\_PROJETOS' },
    )
    assert.equal(digest.summary.total, 2)
    assert.equal(digest.chart.buckets.excellent, 1)
    assert.equal(digest.chart.buckets.attention, 1)
    assert.ok(digest.repos.length >= 2)
  })

  it('formatPortfolioDigestMarkdown inclui seções', () => {
    const digest = buildPortfolioDigest([{ slug: 'demo', path: '/d', health: 80 }], null)
    const md = formatPortfolioDigestMarkdown(digest)
    assert.match(md, /Digest do portfolio/)
    assert.match(md, /Ranking de health/)
    assert.match(md, /demo/)
  })

  it('writeDigestFilename usa prefixo digest', () => {
    assert.match(writeDigestFilename('2026-05-30'), /portfolio-digest/)
  })
})
