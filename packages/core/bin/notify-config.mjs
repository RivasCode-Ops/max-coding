#!/usr/bin/env node
/**
 * Max Stack — configuração de notificações (Fase 23)
 * Uso: npm run notify-config
 *      npm run notify-config -- set --file data/notifications.log --webhook http://localhost/hook
 *      npm run notify-config -- test
 */
import { closeDb, getDb } from '../lib/analyze.mjs'
import {
  getNotificationConfig,
  saveNotificationConfig,
  sendTestNotification,
} from '../lib/notifications.mjs'

const db = getDb()
const args = process.argv.slice(2)

function readFlag(name) {
  const i = args.indexOf(name)
  if (i === -1) return null
  return args[i + 1] ?? null
}

if (args[0] === 'test') {
  const result = await sendTestNotification(db)
  console.log(`Teste OK · canais: ${result.channels.join(', ') || '—'}`)
  if (result.config.filePath) console.log(`Arquivo: ${result.config.filePath}`)
  closeDb()
  process.exit(0)
}

if (args[0] === 'set') {
  const current = getNotificationConfig(db)
  const enabledArg = args.includes('--on') ? true : args.includes('--off') ? false : current.enabled
  const config = saveNotificationConfig(db, {
    enabled: enabledArg,
    filePath: readFlag('--file') ?? current.filePath,
    webhookUrl: readFlag('--webhook') ?? current.webhookUrl,
    onRegression: args.includes('--no-regression') ? false : current.onRegression,
    onCritical: args.includes('--no-critical') ? false : current.onCritical,
    onFailure: args.includes('--no-failure') ? false : current.onFailure,
  })
  console.log(`Notificações: ${config.enabled ? 'ativas' : 'inativas'}`)
  if (config.filePath) console.log(`Arquivo: ${config.filePath}`)
  if (config.webhookUrl) console.log(`Webhook: ${config.webhookUrl}`)
  closeDb()
  process.exit(0)
}

const config = getNotificationConfig(db)
console.log(`Notificações: ${config.enabled ? 'ativas' : 'inativas'}`)
console.log(`Arquivo: ${config.filePath || '—'}`)
console.log(`Webhook: ${config.webhookUrl || '—'}`)
console.log(
  `Eventos: regressão=${config.onRegression} · crítico=${config.onCritical} · falha=${config.onFailure}`,
)

closeDb()
