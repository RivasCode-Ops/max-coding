import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createZipBuffer } from '../packages/core/lib/zip-store.mjs'
import {
  buildPortfolioScorecardBundle,
  formatRepoScorecardMarkdown,
  writeScorecardFilename,
} from '../packages/core/lib/portfolio-scorecard.mjs'

describe('Fase 25 — portfolio scorecard ZIP', () => {
  it('createZipBuffer gera assinatura PK', () => {
    const buf = createZipBuffer([
      { name: 'hello.txt', data: 'Max Stack' },
      { name: 'nested/readme.md', data: '# test' },
    ])
    assert.equal(buf.readUInt32LE(0), 0x04034b50)
    assert.ok(buf.length > 50)
  })

  it('formatRepoScorecardMarkdown inclui health', () => {
    const md = formatRepoScorecardMarkdown({ slug: 'demo', path: '/tmp/demo', health: 88, grade: 'A' })
    assert.match(md, /demo/)
    assert.match(md, /88\/100/)
  })

  it('buildPortfolioScorecardBundle monta arquivos esperados', () => {
    const items = [
      { slug: 'a', path: '/a', health: 90, grade: 'A' },
      { slug: 'b', path: '/b', health: 60, grade: 'D' },
    ]
    const bundle = buildPortfolioScorecardBundle(items, null, { root: 'c:\\x', maxScorecards: 2 })
    assert.ok(bundle.entries.some((e) => e.name === 'digest.md'))
    assert.ok(bundle.entries.some((e) => e.name === 'chart.svg'))
    assert.ok(bundle.entries.some((e) => e.name === 'scorecards/a.md'))
    assert.equal(bundle.manifest.scorecardCount, 2)
  })

  it('writeScorecardFilename usa prefixo scorecard', () => {
    assert.match(writeScorecardFilename('2026-05-30'), /^max-stack-portfolio-scorecard-/)
  })
})
