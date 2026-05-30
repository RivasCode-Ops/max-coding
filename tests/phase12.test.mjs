import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildEvolveSummary } from '../packages/core/lib/evolve-repo.mjs'

describe('Fase 12 — evolve workflow', () => {
  it('buildEvolveSummary preview com planned fixes', () => {
    const s = buildEvolveSummary(
      { health: { summary: '70/100' } },
      { applied: { planned: ['eslint', 'license-mit'] } },
      null,
      true,
    )
    assert.match(s, /eslint/)
  })

  it('buildEvolveSummary aprovado após verify', () => {
    const s = buildEvolveSummary(
      { health: { summary: '70/100' } },
      { delta: 5 },
      { verdict: 'APPROVED', after: { health: { summary: '75/100' } }, diff: { healthDelta: 5 } },
      false,
    )
    assert.match(s, /APPROVED/)
    assert.match(s, /\+5/)
  })
})
