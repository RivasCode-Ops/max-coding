import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  applyRecommendationViaCursor,
  buildCursorApplyPrompt,
  mapRecToPilotFix,
  writeCursorTask,
} from '../packages/core/lib/cursor-apply.mjs'
import { suggestActions } from '../packages/core/lib/action-suggester.mjs'

describe('Fase 8 — Cursor apply + action suggester', () => {
  it('buildCursorApplyPrompt inclui título e instruções', () => {
    const md = buildCursorApplyPrompt(
      { title: 'Add ESLint', problem: 'Sem linter', suggestedUpgrade: 'eslint flat config', priority: 1 },
      { repo: { path: '/x' }, health: { summary: '80/100 (B)' }, taskFile: 'x-rec-1.md' },
    )
    assert.match(md, /Add ESLint/)
    assert.match(md, /Cursor Agent/)
    assert.match(md, /Não commite/)
  })

  it('mapRecToPilotFix mapeia security e eslint', () => {
    assert.equal(mapRecToPilotFix({ title: 'SECURITY policy' }), 'security-md')
    assert.equal(mapRecToPilotFix({ title: 'Configure ESLint' }), 'eslint')
    assert.equal(mapRecToPilotFix({ title: 'Other' }), null)
  })

  it('writeCursorTask grava em .cursor/max-stack/tasks', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-cursor-'))
    const w = writeCursorTask(dir, 'demo', 'rec-1', '# task')
    assert.ok(existsSync(w.written))
    assert.equal(readFileSync(w.written, 'utf8'), '# task')
    assert.match(w.relative, /\.cursor\/max-stack\/tasks\/demo-rec-1\.md/)
  })

  it('applyRecommendationViaCursor encontra rec por id', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-cursor-'))
    const analysis = {
      repo: { path: dir, slug: 'demo' },
      health: { summary: '70/100' },
      recommendations: [{ id: 'r1', title: 'LICENSE', problem: 'Sem license', priority: 2 }],
    }
    const r = applyRecommendationViaCursor(analysis, 'r1')
    assert.equal(r.recommendationId, 'r1')
    assert.equal(r.pilotFix, 'license-mit')
    assert.ok(r.written)
  })

  it('suggestActions ranqueia por request de testes', () => {
    const analysis = {
      repo: { path: '/x', slug: 'x' },
      health: { summary: '75/100' },
      recommendations: [{ id: 'r1', title: 'Adicionar Vitest', problem: 'Sem testes', category: 'testes', priority: 1 }],
      findings: [],
    }
    const res = suggestActions('preciso de testes unitários', {
      repoPath: '/x',
      slug: 'x',
      analysisResult: analysis,
      profile: { signals: [], summary: { frameworks: ['vite'] } },
    })
    assert.ok(res.suggestions.length >= 1)
    assert.ok(res.suggestions[0].score > 0)
    assert.match(res.suggestions[0].prompt, /Vitest|testes/i)
  })
})
