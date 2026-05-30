import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildWatchTaskAction,
  normalizeWatchSchedule,
  parseSchtasksList,
  schtasksScheduleArgs,
} from '../packages/core/lib/watch-scheduler.mjs'

describe('Fase 24 — watch scheduler', () => {
  it('schtasksScheduleArgs converte minutos', () => {
    assert.deepEqual(schtasksScheduleArgs(60), { sc: 'HOURLY', mo: 1 })
    assert.deepEqual(schtasksScheduleArgs(30), { sc: 'MINUTE', mo: 30 })
    assert.deepEqual(schtasksScheduleArgs(1440), { sc: 'DAILY', mo: 1 })
  })

  it('buildWatchTaskAction inclui --once', () => {
    const cmd = buildWatchTaskAction({ root: 'c:\\_PROJETOS\\demo', repoRoot: 'c:\\_PROJETOS\\max-coding' })
    assert.match(cmd, /watch-portfolio\.mjs/)
    assert.match(cmd, /--once/)
    assert.match(cmd, /demo/)
  })

  it('parseSchtasksList extrai status', () => {
    const parsed = parseSchtasksList(`TaskName: MaxStack-WatchPortfolio
Status: Ready
Next Run Time: 30/05/2026 12:00:00
Task To Run: node.exe watch`)
    assert.equal(parsed.taskName, 'MaxStack-WatchPortfolio')
    assert.equal(parsed.status, 'Ready')
    assert.match(parsed.nextRun, /2026/)
  })

  it('normalizeWatchSchedule limita intervalo mínimo', () => {
    const c = normalizeWatchSchedule({ intervalMinutes: 1, root: 'c:\\x' })
    assert.equal(c.intervalMinutes, 5)
  })
})
