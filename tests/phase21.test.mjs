import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildQualitySignals, formatQualitySignalsMarkdown } from '../packages/core/lib/quality-signals.mjs'

describe('Fase 21 — quality signals', () => {
  it('buildQualitySignals marca README e CI', () => {
    const q = buildQualitySignals({
      signals: [{ id: 'has_readme' }, { id: 'has_ci' }],
      stack: { scripts: {} },
    })
    const readme = q.checks.find((c) => c.id === 'readme')
    const ci = q.checks.find((c) => c.id === 'ci')
    assert.equal(readme?.ok, true)
    assert.equal(ci?.ok, true)
    assert.ok(q.summary.total >= 10)
  })

  it('detecta script test', () => {
    const q = buildQualitySignals({
      signals: [{ id: 'has_tests_or_validar' }],
      stack: { scripts: { test: 'vitest run' } },
    })
    const t = q.checks.find((c) => c.id === 'test_script')
    assert.equal(t?.ok, true)
  })

  it('formatQualitySignalsMarkdown lista grupos', () => {
    const q = buildQualitySignals({ signals: [{ id: 'has_readme' }], stack: { scripts: {} } })
    const md = formatQualitySignalsMarkdown(q)
    assert.match(md, /Sinais de qualidade/)
    assert.match(md, /Documentação/)
  })
})
