import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeHealthScore } from '../packages/core/lib/health-score.mjs'

describe('computeHealthScore', () => {
  it('retorna 100 para perfil completo', () => {
    const profile = {
      summary: {
        hasTestsSignal: true,
        gapNoTestScript: false,
        hasCi: true,
        hasCursorRules: true,
        frameworks: ['node'],
      },
      signals: [
        { id: 'structure_src' },
        { id: 'has_readme' },
      ],
      stack: {
        scripts: { test: 'node --test', build: 'tsc' },
        dependencies: ['a'],
        devDependencies: ['b'],
      },
    }
    const result = computeHealthScore(profile)
    assert.equal(result.overall, 100)
    assert.equal(result.grade, 'A')
  })

  it('penaliza gaps de testes e CI', () => {
    const profile = {
      summary: { hasTestsSignal: false, gapNoTestScript: true, hasCi: false, hasCursorRules: false, frameworks: [] },
      signals: [],
      stack: { scripts: {}, dependencies: [], devDependencies: [] },
    }
    const result = computeHealthScore(profile)
    assert.ok(result.overall < 50)
    assert.equal(result.grade, 'D')
  })
})
