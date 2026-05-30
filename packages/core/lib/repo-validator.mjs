/**
 * Validação controlada no repo alvo — test/build apenas (Fase 3)
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const ALLOWED = new Set(['test', 'build', 'lint', 'validar', 'check'])

export function validateRepository(repoPath, options = {}) {
  const scripts = options.scripts || {}
  const timeout = options.timeoutMs || 120_000
  const toRun = options.scriptsToRun || pickScripts(scripts)

  if (!toRun.length) {
    return { ok: true, skipped: true, message: 'Nenhum script test/build/lint detectado', results: [] }
  }

  const results = []
  let allOk = true

  for (const script of toRun) {
    const started = Date.now()
    const proc = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
      cwd: repoPath,
      encoding: 'utf8',
      timeout,
      shell: true,
    })
    const ok = proc.status === 0
    if (!ok) allOk = false
    results.push({
      script,
      ok,
      exitCode: proc.status,
      durationMs: Date.now() - started,
      stdout: tail(proc.stdout, 800),
      stderr: tail(proc.stderr, 400),
    })
  }

  return { ok: allOk, skipped: false, results }
}

function pickScripts(scripts) {
  const order = ['test', 'validar', 'check', 'lint', 'build']
  return order.filter((s) => ALLOWED.has(s) && scripts[s])
}

function tail(str, max) {
  if (!str) return ''
  const s = String(str)
  return s.length <= max ? s : s.slice(-max)
}

export function validateFromProfile(profile) {
  if (!profile?.path || !existsSync(profile.path)) {
    throw new Error('Repo path inválido para validação')
  }
  return validateRepository(profile.path, { scripts: profile.stack?.scripts || {} })
}
