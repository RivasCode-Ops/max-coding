import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateCursorRules } from '../packages/core/lib/rules-generator.mjs'

describe('generateCursorRules', () => {
  it('gera mdc com stack e recomendacoes', () => {
    const rules = generateCursorRules({
      repo: { slug: 'demo', path: '/tmp/demo', url: null },
      profile: { summary: { frameworks: ['vite'] }, stack: { scripts: { test: 'vitest' } } },
      health: { summary: '80/100 (B)', overall: 80, categories: [{ id: 'testes', status: 'gap', label: 'Testes' }] },
      recommendations: [{ priority: 1, title: 'Adicionar CI' }],
      findings: [{ findingType: 'confirmed', severity: 'high', title: 'Sem CI' }],
    })
    assert.ok(rules.includes('alwaysApply: true'))
    assert.ok(rules.includes('vite'))
    assert.ok(rules.includes('Adicionar CI'))
  })
})
