#!/usr/bin/env node
/**
 * Max Stack — agendar watch portfolio no Windows (Fase 24)
 * Uso: npm run watch-schedule -- status
 *      npm run watch-schedule -- install [root] [intervalo_minutos]
 *      npm run watch-schedule -- remove
 */
import { closeDb, getDb } from '../lib/analyze.mjs'
import {
  getWatchScheduleStatus,
  installWatchTask,
  removeWatchTask,
} from '../lib/watch-scheduler.mjs'

const db = getDb()
const cmd = process.argv[2]
const args = process.argv.slice(3).filter((a) => !a.startsWith('--'))

if (cmd === 'install') {
  const root = args[0]
  const intervalMinutes = args[1] ? Number(args[1]) : undefined
  const result = installWatchTask(db, { root, intervalMinutes })
  if (!result.ok) {
    console.error(result.message || 'Instalação falhou')
    closeDb()
    process.exit(1)
  }
  console.log(`Tarefa instalada: ${result.config.taskName}`)
  console.log(`Portfolio: ${result.config.root} · a cada ${result.config.intervalMinutes} min`)
  console.log(`Agenda: ${result.schedule.sc} / MO ${result.schedule.mo}`)
  closeDb()
  process.exit(0)
}

if (cmd === 'remove') {
  const result = removeWatchTask(db)
  if (!result.ok) {
    console.error(result.message || 'Remoção falhou')
    closeDb()
    process.exit(1)
  }
  console.log(`Tarefa removida: ${result.config.taskName}`)
  closeDb()
  process.exit(0)
}

const status = getWatchScheduleStatus(db)
console.log(`Plataforma: ${status.platform} · suportado: ${status.supported}`)
console.log(`Config: ${status.config.installed ? 'instalada' : 'não instalada'} · ${status.config.intervalMinutes} min`)
console.log(`Portfolio: ${status.config.root}`)
if (status.task.installed) {
  console.log(`Task: ${status.task.taskName} · ${status.task.status || '—'}`)
  if (status.task.nextRun) console.log(`Próxima: ${status.task.nextRun}`)
} else if (status.supported) {
  console.log(`Task ${status.config.taskName}: não encontrada no agendador`)
}

closeDb()
