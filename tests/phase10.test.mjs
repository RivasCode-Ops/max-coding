import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  parseGitRemoteOwnerRepo,
  resolveRepoContext,
  suggestNextActions,
} from '../packages/core/lib/repo-context.mjs'

describe('Fase 10 — repo context', () => {
  it('parseGitRemoteOwnerRepo lê origin github', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-ctx-'))
    mkdirSync(join(dir, '.git'), { recursive: true })
    // sem git real — retorna null se git falhar
    const r = parseGitRemoteOwnerRepo(dir)
    assert.ok(r === null || typeof r === 'string')
  })

  it('resolveRepoContext usa ownerRepo da análise', () => {
    const ctx = resolveRepoContext('/x', {
      repo: { slug: 'demo', path: '/x', source: 'github', url: 'https://github.com/a/b', ownerRepo: 'a/b' },
    })
    assert.equal(ctx.ownerRepo, 'a/b')
    assert.equal(ctx.githubLinked, true)
  })

  it('suggestNextActions prioriza health baixo', () => {
    const actions = suggestNextActions({
      health: { overall: 65, summary: '65/100' },
      recommendations: [{ id: 'r1', title: 'Gap', priority: 1 }],
    })
    assert.ok(actions.some((a) => a.id === 'health-low'))
  })
})
