/**
 * Notificações externas — Fase 23
 * Arquivo local (JSONL) e/ou webhook quando watch detecta eventos
 */
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAppSetting, setAppSetting } from './db.mjs'

const REPO_ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
export const NOTIFY_SETTINGS_KEY = 'notification_config'
export const DEFAULT_NOTIFY_FILE = join(REPO_ROOT, 'data', 'notifications.log')

export const DEFAULT_NOTIFICATION_CONFIG = {
  enabled: false,
  webhookUrl: '',
  filePath: DEFAULT_NOTIFY_FILE,
  onRegression: true,
  onCritical: true,
  onFailure: true,
}

export function normalizeNotificationConfig(raw) {
  const merged = { ...DEFAULT_NOTIFICATION_CONFIG, ...(raw || {}) }
  merged.enabled = Boolean(merged.enabled)
  merged.webhookUrl = String(merged.webhookUrl || '').trim()
  merged.filePath = String(merged.filePath || '').trim() || DEFAULT_NOTIFY_FILE
  merged.onRegression = merged.onRegression !== false
  merged.onCritical = merged.onCritical !== false
  merged.onFailure = merged.onFailure !== false

  if (process.env.MAX_NOTIFY_WEBHOOK_URL?.trim()) {
    merged.webhookUrl = process.env.MAX_NOTIFY_WEBHOOK_URL.trim()
  }
  if (process.env.MAX_NOTIFY_FILE?.trim()) {
    merged.filePath = resolve(process.env.MAX_NOTIFY_FILE.trim())
  }
  if (process.env.MAX_NOTIFY_ENABLED === '1' || process.env.MAX_NOTIFY_ENABLED === 'true') {
    merged.enabled = true
  }

  return merged
}

export function getNotificationConfig(db) {
  if (!db) return normalizeNotificationConfig(null)
  const raw = getAppSetting(db, NOTIFY_SETTINGS_KEY)
  if (!raw) return normalizeNotificationConfig(null)
  try {
    return normalizeNotificationConfig(JSON.parse(raw))
  } catch {
    return normalizeNotificationConfig(null)
  }
}

export function saveNotificationConfig(db, config) {
  const normalized = normalizeNotificationConfig(config)
  setAppSetting(db, NOTIFY_SETTINGS_KEY, JSON.stringify(normalized))
  return normalized
}

export function collectWatchNotificationEvents(run, config) {
  const events = []
  for (const r of run.results || []) {
    if (!r.ok && config.onFailure) {
      events.push({
        type: 'watch-failure',
        slug: r.slug,
        path: r.path,
        code: r.code,
        level: r.level,
        message: r.error || 'Falha no re-scan',
      })
      continue
    }
    if (!r.ok) continue

    if (config.onRegression && r.healthDelta != null && r.healthDelta <= -5) {
      events.push({
        type: 'health-regression',
        slug: r.slug,
        path: r.path,
        code: r.code,
        level: r.level,
        health: r.health,
        healthDelta: r.healthDelta,
        message: `Health caiu ${r.healthDelta} pts (${r.healthSummary || r.health + '/100'})`,
      })
    } else if (config.onCritical && r.level === 'critical') {
      events.push({
        type: 'critical-alert',
        slug: r.slug,
        path: r.path,
        code: r.code,
        level: r.level,
        health: r.health,
        message: `Alerta crítico no watch (${r.code})`,
      })
    }
  }
  return events
}

export function buildNotificationPayload(event, run) {
  return {
    product: 'Max Stack',
    phase: 'watch-notify',
    at: new Date().toISOString(),
    watchAt: run.at,
    watchSummary: run.summary,
    ...event,
  }
}

export function appendNotificationFile(filePath, payload) {
  const target = resolve(filePath)
  mkdirSync(dirname(target), { recursive: true })
  appendFileSync(target, `${JSON.stringify(payload)}\n`, 'utf8')
  return { ok: true, file: target }
}

export async function postNotificationWebhook(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Max-Stack-Notify/0.25',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Webhook ${res.status}${text ? `: ${text.slice(0, 120)}` : ''}`)
  }
  return { ok: true, status: res.status }
}

export async function dispatchNotification(config, payload) {
  const channels = []
  if (config.filePath) {
    appendNotificationFile(config.filePath, payload)
    channels.push('file')
  }
  if (config.webhookUrl) {
    await postNotificationWebhook(config.webhookUrl, payload)
    channels.push('webhook')
  }
  return channels
}

export async function dispatchWatchNotifications(db, run, options = {}) {
  const config = normalizeNotificationConfig(options.config ?? getNotificationConfig(db))
  if (!config.enabled || run.dryRun) {
    return { dispatched: 0, skipped: true, reason: run.dryRun ? 'dry-run' : 'disabled', events: [] }
  }
  if (!config.filePath && !config.webhookUrl) {
    return { dispatched: 0, skipped: true, reason: 'sem canal (file/webhook)', events: [] }
  }

  const events = collectWatchNotificationEvents(run, config)
  if (!events.length) return { dispatched: 0, skipped: false, events: [] }

  const dispatched = []
  for (const event of events) {
    const payload = buildNotificationPayload(event, run)
    const channels = await dispatchNotification(config, payload)
    dispatched.push({ ...payload, channels })
  }

  return {
    dispatched: dispatched.length,
    skipped: false,
    events: dispatched,
    file: config.filePath || null,
    webhook: config.webhookUrl || null,
  }
}

export async function sendTestNotification(db, options = {}) {
  const config = normalizeNotificationConfig(options.config ?? getNotificationConfig(db))
  const testConfig = { ...config, enabled: true }
  if (!testConfig.filePath && !testConfig.webhookUrl) {
    testConfig.filePath = DEFAULT_NOTIFY_FILE
  }
  const run = {
    dryRun: false,
    at: new Date().toISOString(),
    summary: 'Test notification',
    results: [],
  }
  const payload = buildNotificationPayload(
    {
      type: 'test',
      message: options.message || 'Notificação de teste do Max Stack',
    },
    run,
  )
  const channels = await dispatchNotification(testConfig, payload)
  return { ok: true, channels, payload, config: testConfig }
}
