/**
 * Contexto unificado do repo — Fase 10
 */
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseGithubUrl } from './intake.mjs'
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import { planPilotFixes } from './apply-pilot.mjs'

const REMOTE_RE = /github\.com[:/]([^/]+\/[^/\s]+?)(?:\.git)?$/i

export function parseGitRemoteOwnerRepo(repoPath) {
  if (!existsSync(join(repoPath, '.git'))) return null
  const r = spawnSync('git', ['-C', repoPath, 'remote', 'get-url', 'origin'], { encoding: 'utf8' })
  if (r.status !== 0 || !r.stdout?.trim()) return null
  const url = r.stdout.trim()
  const gh = parseGithubUrl(url.startsWith('http') ? url : `https://${url.replace(':', '/')}`)
  if (gh) return gh.ownerRepo
  const m = url.match(REMOTE_RE)
  return m ? m[1].replace(/\.git$/i, '') : null
}

export function resolveRepoContext(repoPath, analysisResult = null) {
  const slug = analysisResult?.repo?.slug || basename(repoPath).toLowerCase().replace(/\s+/g, '-')
  const ownerRepo =
    analysisResult?.repo?.ownerRepo ||
    analysisResult?.profile?.intake?.ownerRepo ||
    parseGitRemoteOwnerRepo(repoPath)

  const source = analysisResult?.repo?.source || (ownerRepo ? 'github-linked' : 'local')
  const url = analysisResult?.repo?.url || (ownerRepo ? `https://github.com/${ownerRepo}` : null)

  return {
    path: repoPath,
    slug,
    ownerRepo,
    source,
    url,
    githubLinked: Boolean(ownerRepo),
  }
}

export function suggestNextActions(analysisResult = {}, context = {}) {
  const actions = []
  const health = analysisResult.health?.overall ?? 0
  const recs = analysisResult.recommendations || []
  const p1 = recs.filter((r) => (r.priority ?? 3) <= 1)
  const p2 = recs.filter((r) => r.priority === 2)
  const profile = analysisResult.profile || context.profile

  if (health < 70) {
    actions.push({
      id: 'health-low',
      kind: 'priority',
      title: 'Health abaixo de 70 — priorizar gaps P1',
      detail: `Score atual: ${analysisResult.health?.summary || health}`,
      action: 'apply-batch',
    })
  }

  if (p1.length) {
    actions.push({
      id: 'p1-recs',
      kind: 'recommendation',
      title: `${p1.length} recomendação(ões) P1`,
      detail: p1[0].title,
      action: 'apply-batch',
    })
  }

  const pilot = profile ? planPilotFixes(profile) : []
  if (pilot.length) {
    actions.push({
      id: 'pilot',
      kind: 'pilot',
      title: 'Correções automáticas disponíveis',
      detail: pilot.slice(0, 4).join(', '),
      action: 'apply-pilot',
    })
  }

  if (!analysisResult.repoValidation || analysisResult.repoValidation.skipped) {
    actions.push({
      id: 'validate',
      kind: 'validate',
      title: 'Validar scripts npm',
      detail: 'Rodar test/build/lint no repo',
      action: 'validate',
    })
  } else if (!analysisResult.repoValidation.ok) {
    actions.push({
      id: 'fix-tests',
      kind: 'validate',
      title: 'Scripts npm falhando',
      detail: 'Corrigir testes ou build antes de evoluir',
      action: 'validate',
    })
  }

  if (p2.length && actions.length < 5) {
    actions.push({
      id: 'p2-recs',
      kind: 'recommendation',
      title: `${p2.length} recomendação(ões) P2`,
      detail: p2[0].title,
      action: 'cursor-batch',
    })
  }

  if (context.ownerRepo) {
    actions.push({
      id: 'pr-comment',
      kind: 'github',
      title: 'Publicar resumo em PR',
      detail: context.ownerRepo,
      action: 'pr-preview',
    })
  }

  if (health >= 90 && recs.length === 0) {
    actions.push({
      id: 'maintain',
      kind: 'info',
      title: 'Repo saudável — manter monitoramento',
      detail: 'Use watch mode ou re-scan periódico',
      action: 'verify',
    })
  }

  return actions.slice(0, 6)
}

export function buildRepoContext(repoPath, analysisResult = null) {
  const context = resolveRepoContext(repoPath, analysisResult)
  const profile = analysisResult?.profile || scanRepo(repoPath, context.slug)
  const nextActions = suggestNextActions(analysisResult || {}, { ...context, profile })
  return { ...context, nextActions, profileSummary: profile.summary }
}
