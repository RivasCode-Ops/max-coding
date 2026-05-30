import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildVerificationReport } from '../packages/core/lib/verify-apply.mjs'
import { listCursorTasks } from '../packages/core/lib/task-registry.mjs'
import { applyBatchRecommendations } from '../packages/core/lib/cursor-apply.mjs'

describe('Fase 9 — verify loop + task registry', () => {
  it('buildVerificationReport APPROVED quando health sobe', () => {
    const before = { health: { overall: 80, summary: '80/100' }, findings: [{ title: 'Gap A' }] }
    const after = { health: { overall: 85, summary: '85/100' }, findings: [] }
    const report = buildVerificationReport(before, after, { ok: true, skipped: false, results: [] }, [])
    assert.equal(report.verdict, 'APPROVED')
    assert.ok(report.checklist.length >= 3)
  })

  it('buildVerificationReport FAILED quando testes falham', () => {
    const before = { health: { overall: 80, summary: '80/100' }, findings: [] }
    const after = { health: { overall: 80, summary: '80/100' }, findings: [] }
    const report = buildVerificationReport(before, after, { ok: false, skipped: false, results: [{ script: 'test', ok: false }] }, [])
    assert.equal(report.verdict, 'FAILED')
  })

  it('listCursorTasks lê pasta tasks', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-tasks-'))
    const tasksDir = join(dir, '.cursor', 'max-stack', 'tasks')
    mkdirSync(tasksDir, { recursive: true })
    writeFileSync(join(tasksDir, 'demo-rec-1.md'), '# Max Stack — Implementar: Test\n', 'utf8')
    const tasks = listCursorTasks(dir)
    assert.equal(tasks.length, 1)
    assert.equal(tasks[0].title, 'Test')
  })

  it('applyBatchRecommendations filtra por prioridade', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-batch-'))
    const analysis = {
      repo: { path: dir, slug: 'demo' },
      health: { summary: '70/100' },
      recommendations: [
        { id: 'r1', title: 'P1 fix', priority: 1, problem: 'x' },
        { id: 'r2', title: 'P3 later', priority: 3, problem: 'y' },
      ],
    }
    const batch = applyBatchRecommendations(analysis, { maxPriority: 2 })
    assert.equal(batch.length, 1)
    assert.equal(batch[0].recommendationId, 'r1')
  })
})
