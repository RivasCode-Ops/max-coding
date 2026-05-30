import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { recommendFromProfile } from '../packages/recommender/lib/recommend.mjs'

describe('recommendFromProfile', () => {
  it('sugere testes quando falta script test', () => {
    const profile = {
      slug: 'demo',
      signals: [{ id: 'stack_vite' }, { id: 'gap_no_test_script' }],
      summary: { frameworks: ['vite'], hasCi: false, hasTestsSignal: false, hasCursorRules: false, gapNoTestScript: true },
    }
    const { recommendations } = recommendFromProfile(profile)
    assert.ok(recommendations.some((r) => r.category === 'testes'))
  })

  it('sugere CI quando falta workflow', () => {
    const profile = {
      slug: 'demo',
      signals: [{ id: 'stack_vite' }, { id: 'gap_no_test_script' }],
      summary: { frameworks: ['vite'], hasCi: false, gapNoTestScript: true },
    }
    const { recommendations } = recommendFromProfile(profile)
    assert.ok(recommendations.some((r) => r.title.includes('CI')))
  })
})
