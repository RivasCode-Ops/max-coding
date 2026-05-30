/**
 * Agendamento watch portfolio — Fase 24 (Windows Task Scheduler)
 */
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAppSetting, setAppSetting } from './db.mjs'

const REPO_ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
export const DEFAULT_TASK_NAME = 'MaxStack-WatchPortfolio'
export const WATCH_SCHEDULE_KEY = 'watch_schedule'

export const DEFAULT_WATCH_SCHEDULE = {
  taskName: DEFAULT_TASK_NAME,
  root: process.env.MAX_PORTFOLIO_ROOT || 'c:\\_PROJETOS',
  intervalMinutes: 60,
  installed: false,
  installedAt: null,
  lastStatus: null,
}

export function normalizeWatchSchedule(raw) {
  const merged = { ...DEFAULT_WATCH_SCHEDULE, ...(raw || {}) }
  merged.taskName = String(merged.taskName || DEFAULT_TASK_NAME).trim() || DEFAULT_TASK_NAME
  merged.root = resolve(merged.root || DEFAULT_WATCH_SCHEDULE.root)
  merged.intervalMinutes = clampMinutes(Number(merged.intervalMinutes) || 60)
  merged.installed = Boolean(merged.installed)
  merged.installedAt = merged.installedAt || null
  merged.lastStatus = merged.lastStatus || null
  return merged
}

export function getWatchScheduleConfig(db) {
  if (!db) return normalizeWatchSchedule(null)
  const raw = getAppSetting(db, WATCH_SCHEDULE_KEY)
  if (!raw) return normalizeWatchSchedule(null)
  try {
    return normalizeWatchSchedule(JSON.parse(raw))
  } catch {
    return normalizeWatchSchedule(null)
  }
}

export function saveWatchScheduleConfig(db, config) {
  const normalized = normalizeWatchSchedule(config)
  setAppSetting(db, WATCH_SCHEDULE_KEY, JSON.stringify(normalized))
  return normalized
}

export function isWatchSchedulerSupported() {
  return process.platform === 'win32'
}

export function schtasksScheduleArgs(intervalMinutes) {
  const minutes = clampMinutes(intervalMinutes)
  if (minutes >= 1440 && minutes % 1440 === 0) {
    return { sc: 'DAILY', mo: minutes / 1440 }
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    return { sc: 'HOURLY', mo: minutes / 60 }
  }
  return { sc: 'MINUTE', mo: minutes }
}

export function buildWatchTaskAction(options = {}) {
  const root = resolve(options.root || DEFAULT_WATCH_SCHEDULE.root)
  const repoRoot = resolve(options.repoRoot || REPO_ROOT)
  const node = options.nodePath || process.execPath
  const script = join(repoRoot, 'packages', 'core', 'bin', 'watch-portfolio.mjs')
  return `"${node}" "${script}" "${root}" --once`
}

export function parseSchtasksList(stdout) {
  const text = String(stdout || '')
  const pick = (key) => {
    const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'im'))
    return m ? m[1].trim() : null
  }
  return {
    taskName: pick('TaskName'),
    status: pick('Status'),
    nextRun: pick('Next Run Time') || pick('Próxima execução'),
    lastRun: pick('Last Run Time') || pick('Última execução'),
    taskToRun: pick('Task To Run') || pick('Tarefa a ser executada'),
  }
}

function runSchtasks(args) {
  const result = spawnSync('schtasks', args, { encoding: 'utf8', windowsHide: true })
  const stdout = (result.stdout || '').trim()
  const stderr = (result.stderr || '').trim()
  const output = stdout || stderr
  if (result.status !== 0) {
    throw new Error(output || `schtasks falhou (${result.status})`)
  }
  return output
}

export function queryWatchTask(taskName = DEFAULT_TASK_NAME) {
  if (!isWatchSchedulerSupported()) {
    return { supported: false, platform: process.platform, installed: false, taskName }
  }
  const result = spawnSync('schtasks', ['/Query', '/TN', taskName, '/FO', 'LIST', '/V'], {
    encoding: 'utf8',
    windowsHide: true,
  })
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
  if (result.error?.code === 'ENOENT') {
    return { supported: false, platform: process.platform, installed: false, taskName, queryNote: 'schtasks indisponível' }
  }
  if (result.status !== 0) {
    return { supported: true, platform: process.platform, installed: false, taskName, queryNote: output.slice(0, 160) || null }
  }
  const parsed = parseSchtasksList(output)
  return {
    supported: true,
    platform: process.platform,
    installed: true,
    taskName,
    ...parsed,
  }
}

export function installWatchTask(db, options = {}) {
  if (!isWatchSchedulerSupported()) {
    return {
      ok: false,
      supported: false,
      platform: process.platform,
      message: 'Agendamento via Task Scheduler disponível apenas no Windows',
    }
  }

  const config = normalizeWatchSchedule({
    ...getWatchScheduleConfig(db),
    ...options,
    taskName: options.taskName || DEFAULT_TASK_NAME,
  })
  const { sc, mo } = schtasksScheduleArgs(config.intervalMinutes)
  const tr = buildWatchTaskAction({ root: config.root, repoRoot: options.repoRoot })

  runSchtasks([
    '/Create',
    '/TN',
    config.taskName,
    '/TR',
    tr,
    '/SC',
    sc,
    '/MO',
    String(mo),
    '/F',
  ])

  const saved = saveWatchScheduleConfig(db, {
    ...config,
    installed: true,
    installedAt: new Date().toISOString(),
    lastStatus: 'installed',
  })

  return {
    ok: true,
    supported: true,
    config: saved,
    schedule: { sc, mo },
    command: tr,
  }
}

export function removeWatchTask(db, options = {}) {
  if (!isWatchSchedulerSupported()) {
    return {
      ok: false,
      supported: false,
      platform: process.platform,
      message: 'Agendamento via Task Scheduler disponível apenas no Windows',
    }
  }

  const taskName = options.taskName || getWatchScheduleConfig(db).taskName || DEFAULT_TASK_NAME
  runSchtasks(['/Delete', '/TN', taskName, '/F'])

  const saved = saveWatchScheduleConfig(db, {
    ...getWatchScheduleConfig(db),
    taskName,
    installed: false,
    installedAt: null,
    lastStatus: 'removed',
  })

  return { ok: true, supported: true, config: saved }
}

export function getWatchScheduleStatus(db, options = {}) {
  const config = getWatchScheduleConfig(db)
  const taskName = options.taskName || config.taskName
  let task = { supported: isWatchSchedulerSupported(), platform: process.platform, installed: false, taskName }
  if (isWatchSchedulerSupported()) {
    task = queryWatchTask(taskName)
  }
  return {
    supported: isWatchSchedulerSupported(),
    platform: process.platform,
    config,
    task,
    repoRoot: REPO_ROOT,
  }
}

function clampMinutes(n) {
  return Math.max(5, Math.min(24 * 60, Math.round(n)))
}
