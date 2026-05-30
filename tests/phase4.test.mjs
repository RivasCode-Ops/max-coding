import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeGitHistory } from '../packages/core/lib/git-analyzer.mjs'
import { discoverLocalRepos, portfolioSummary, quickScanPortfolio } from '../packages/core/lib/portfolio.mjs'
import { generateIssuesMarkdown } from '../packages/core/lib/issues-export.mjs'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))

describe('Fase 4 — git analyzer', () => {
  it('analisa histórico git do max-coding', () => {
    const g = analyzeGitHistory(ROOT)
    assert.ok(g.available)
    assert.ok(g.metrics)
    assert.ok(Array.isArray(g.findings))
  })
})

describe('Fase 4 — portfolio', () => {
  it('descobre repos em _PROJETOS', () => {
    const parent = resolve(ROOT, '..')
    const repos = discoverLocalRepos(parent)
    assert.ok(repos.length >= 1)
    const items = quickScanPortfolio(repos.slice(0, 3))
    const summary = portfolioSummary(items)
    assert.ok(summary.total >= 1)
  })
})

describe('Fase 4 — issues export', () => {
  it('gera markdown de issues', () => {
    const md = generateIssuesMarkdown({
      repo: { slug: 'test' },
      health: { summary: '80/100 (A)' },
      backlog: [{ title: 'Add tests', priority: 1, tasks: ['vitest setup'] }],
      recommendations: [],
    })
    assert.ok(md.includes('Add tests'))
    assert.ok(md.includes('Issue 1'))
  })
})
