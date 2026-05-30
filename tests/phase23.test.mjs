import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  collectWatchNotificationEvents,
  dispatchWatchNotifications,
  normalizeNotificationConfig,
  saveNotificationConfig,
  sendTestNotification,
} from '../packages/core/lib/notifications.mjs'

describe('Fase 23 — notifications', () => {
  it('normalizeNotificationConfig aplica defaults', () => {
    const c = normalizeNotificationConfig({ enabled: true })
    assert.equal(c.enabled, true)
    assert.ok(c.filePath.includes('notifications.log'))
  })

  it('collectWatchNotificationEvents detecta regressão', () => {
    const config = normalizeNotificationConfig({ onRegression: true })
    const run = {
      results: [
        { ok: true, slug: 'demo', path: '/tmp/demo', healthDelta: -8, level: 'warning', health: 70 },
        { ok: true, slug: 'ok', path: '/tmp/ok', healthDelta: 2, level: 'info', health: 90 },
      ],
    }
    const events = collectWatchNotificationEvents(run, config)
    assert.equal(events.length, 1)
    assert.equal(events[0].type, 'health-regression')
  })

  it('dispatchWatchNotifications grava arquivo JSONL', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-notify-'))
    const file = join(dir, 'notify.log')
    const db = { prepare: () => ({ get: () => null, run: () => {} }) }
    const run = {
      dryRun: false,
      at: new Date().toISOString(),
      summary: 'Watch test',
      results: [{ ok: true, slug: 'x', path: dir, healthDelta: -10, level: 'warning', health: 60 }],
    }
    const out = await dispatchWatchNotifications(db, run, {
      config: { enabled: true, filePath: file, webhookUrl: '', onRegression: true, onCritical: true, onFailure: true },
    })
    assert.equal(out.dispatched, 1)
    const lines = readFileSync(file, 'utf8').trim().split('\n')
    assert.equal(lines.length, 1)
    assert.match(lines[0], /health-regression/)
  })

  it('sendTestNotification escreve teste no arquivo', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-notify-test-'))
    const file = join(dir, 'test.log')
    const db = { prepare: () => ({ get: () => null, run: () => {} }) }
    const result = await sendTestNotification(db, {
      config: { enabled: true, filePath: file, webhookUrl: '', onRegression: true, onCritical: true, onFailure: true },
    })
    assert.equal(result.ok, true)
    assert.ok(result.channels.includes('file'))
    assert.match(readFileSync(file, 'utf8'), /"type":"test"/)
  })
})
