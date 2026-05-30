/**
 * Análise git — atividade, hotspots de commits (Fase 4)
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createFinding } from './findings.mjs'

export function analyzeGitHistory(repoPath, options = {}) {
  const days = options.days ?? 90
  const gitDir = join(repoPath, '.git')
  if (!existsSync(gitDir)) {
    return { available: false, findings: [], metrics: null }
  }

  const since = `${days} days ago`
  const log = git(repoPath, ['log', `--since=${since}`, '--pretty=format:%H|%ai', '--name-only'])
  if (!log.ok) {
    return { available: false, findings: [], metrics: null, error: log.stderr }
  }

  const commits = parseLog(log.stdout)
  const fileCounts = countFiles(commits)
  const topFiles = [...fileCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([file, count]) => ({ file, count }))

  const lastCommit = git(repoPath, ['log', '-1', '--pretty=format:%ai'])
  const lastDate = lastCommit.ok ? lastCommit.stdout.trim().slice(0, 10) : null
  const daysSinceLast = lastDate ? daysBetween(lastDate, new Date()) : null

  const metrics = {
    commitCount: commits.length,
    daysWindow: days,
    topFiles,
    lastCommitDate: lastDate,
    daysSinceLastCommit: daysSinceLast,
  }

  const findings = []
  if (commits.length === 0) {
    findings.push(
      createFinding({
        category: 'maturidade_operacional',
        title: `Sem commits nos últimos ${days} dias`,
        findingType: 'hypothesis',
        severity: 'medium',
        justification: 'Repositório pode estar abandonado ou em pausa longa',
        evidence: [`window:${days}d`],
        priority: 2,
        sourceRole: 'Performance Reviewer',
      }),
    )
  } else if (daysSinceLast !== null && daysSinceLast > 60) {
    findings.push(
      createFinding({
        category: 'maturidade_operacional',
        title: `Último commit há ${daysSinceLast} dias`,
        findingType: 'hypothesis',
        severity: 'low',
        justification: 'Baixa atividade recente — considere retomar cadência ou documentar status',
        evidence: [lastDate],
        priority: 3,
        sourceRole: 'Performance Reviewer',
      }),
    )
  }

  const hotspot = topFiles[0]
  if (hotspot && hotspot.count >= 5 && commits.length >= 8) {
    findings.push(
      createFinding({
        category: 'arquitetura_modularidade',
        title: `Hotspot git: ${hotspot.file} (${hotspot.count} commits)`,
        findingType: 'hypothesis',
        severity: 'medium',
        justification: 'Arquivo muito editado — possível ponto de instabilidade ou acoplamento',
        evidence: topFiles.slice(0, 3).map((f) => `${f.file}:${f.count}`),
        affectedAreas: topFiles.slice(0, 3).map((f) => f.file),
        priority: 2,
        sourceRole: 'Architecture Auditor',
      }),
    )
  }

  if (commits.length >= 20) {
    findings.push(
      createFinding({
        category: 'maturidade_operacional',
        title: `Alta atividade git (${commits.length} commits / ${days}d)`,
        findingType: 'confirmed',
        severity: 'low',
        justification: 'Repositório ativo — bom sinal de manutenção contínua',
        evidence: [`commits:${commits.length}`],
        priority: 4,
        sourceRole: 'Repo Scout',
      }),
    )
  }

  return { available: true, findings, metrics }
}

function git(cwd, args) {
  const proc = spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 15_000 })
  return { ok: proc.status === 0, stdout: proc.stdout || '', stderr: proc.stderr || '' }
}

function parseLog(raw) {
  const commits = []
  let current = null
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    if (line.includes('|')) {
      if (current) commits.push(current)
      const [hash, date] = line.split('|')
      current = { hash, date, files: [] }
    } else if (current) {
      current.files.push(line.trim())
    }
  }
  if (current) commits.push(current)
  return commits
}

function countFiles(commits) {
  const map = new Map()
  for (const c of commits) {
    for (const f of c.files) {
      if (!f || f.startsWith('.') || f.includes('node_modules')) continue
      map.set(f, (map.get(f) || 0) + 1)
    }
  }
  return map
}

function daysBetween(isoDate, now) {
  const a = new Date(isoDate)
  const b = now instanceof Date ? now : new Date(now)
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000)
}
