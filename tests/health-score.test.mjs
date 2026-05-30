import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeHealthScore } from '../packages/core/lib/health-score.mjs'

describe('computeHealthScore', () => {
  it('retorna grade A para perfil completo', () => {
    const profile = {
      summary: {
        hasTestsSignal: true,
        gapNoTestScript: false,
        hasCi: true,
        hasCursorRules: true,
        frameworks: ['node-monorepo'],
      },
      signals: [
        { id: 'structure_packages' },
        { id: 'has_readme' },
        { id: 'has_tests_or_validar' },
        { id: 'has_ci' },
        { id: 'has_security_md' },
        { id: 'has_dependabot' },
        { id: 'has_build_script' },
        { id: 'has_eslint' },
        { id: 'has_typescript' },
        { id: 'has_license' },
        { id: 'has_cursor_rules' },
        { id: 'has_workspace_packages' },
        { id: 'has_docker' },
      ],
      stack: {
        scripts: { test: 'node --test', build: 'tsc' },
        dependencies: [],
        devDependencies: [],
        allDependencies: ['x'],
      },
    }
    const result = computeHealthScore(profile)
    assert.ok(result.overall >= 85)
    assert.equal(result.categories.length, 12)
  })

  it('penaliza perfil vazio', () => {
    const profile = { summary: {}, signals: [], stack: { scripts: {} } }
    const result = computeHealthScore(profile)
    assert.notEqual(result.grade, 'A')
    assert.ok(result.overall <= 85)
  })
})
