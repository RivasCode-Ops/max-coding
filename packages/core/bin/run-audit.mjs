#!/usr/bin/env node
/**
 * MAX Deep Analysis: scan → health → patterns → recommend → handoff + report
 * Uso: node packages/core/bin/run-audit.mjs <repo-path> [--mode audit|plan]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { recommendFromProfile, toMarkdown, toBacklog } from '../../recommender/lib/recommend.mjs'
import { computeHealthScore } from '../lib/health-score.mjs'

const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const target = resolve(process.argv[2] || '')
const modeArg = process.argv.indexOf('--mode')
const mode = modeArg >= 0 ? process.argv[modeArg + 1] : 'audit'

if (!target || !existsSync(target)) {
  console.error('Uso: node packages/core/bin/run-audit.mjs <repo-path> [--mode audit|plan]')
  process.exit(1)
}

const slug = basename(target).toLowerCase().replace(/\s+/g, '-')
const outDir = join(root, 'reports', slug)
mkdirSync(outDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')

console.log(`[MAX Orchestrator] Deep Analysis — ${slug} (mode=${mode})`)

const scanScript = join(root, 'packages/repo-scanner/bin/scan.mjs')
const scan = spawnSync(process.execPath, [scanScript, target, '--out', join(root, 'reports')], {
  encoding: 'utf8',
})
if (scan.status !== 0) {
  console.error(scan.stderr || scan.stdout)
  process.exit(scan.status || 1)
}

const profiles = readdirSync(outDir)
  .filter((f) => f.startsWith('profile-') && f.endsWith('.json'))
  .sort()
const latestProfile = join(outDir, profiles[profiles.length - 1])
const profile = JSON.parse(readFileSync(latestProfile, 'utf8'))
const health = computeHealthScore(profile)

console.log(`[Repo Scout] health score: ${health.summary}`)
console.log('[Pattern Hunter] catálogo vite-kanban')
const { recommendations, references } = recommendFromProfile(profile)

const refsFile = join(outDir, `references-${stamp}.json`)
writeFileSync(refsFile, JSON.stringify({ references, catalog: 'practices-vite-kanban' }, null, 2))

const recFile = join(outDir, `recommendations-${stamp}.json`)
const reportPayload = {
  product: 'MAX',
  analysisMode: 'deep',
  generatedAt: new Date().toISOString(),
  mode,
  phase: 'PLAN',
  profile: latestProfile,
  health,
  recommendations,
}
writeFileSync(recFile, JSON.stringify(reportPayload, null, 2))

const reportMd = toMarkdown(reportPayload, profile)
const reportFile = join(outDir, `report-${stamp}.md`)
writeFileSync(reportFile, reportMd, 'utf8')

const backlogFile = join(outDir, `backlog-${stamp}.json`)
writeFileSync(backlogFile, JSON.stringify(toBacklog(recommendations), null, 2), 'utf8')

const verification = [
  '# Verification checklist (QA Verifier)',
  '',
  'Modo audit: marcar manualmente após implementar no repo alvo.',
  '',
  ...recommendations.map(
    (r) => `- [ ] **${r.id}** ${r.title} — build/test ok`,
  ),
].join('\n')
const verifyFile = join(outDir, `verification-${stamp}.md`)
writeFileSync(verifyFile, verification, 'utf8')

const handoff = {
  product: 'MAX',
  analysisMode: 'deep',
  health,
  repo: { slug, path: target },
  mode,
  phase: 'VERIFY',
  completed: ['INTAKE', 'SCOUT', 'HUNT', 'AUDIT', 'PLAN'],
  artifacts: {
    profile: basename(latestProfile),
    references: basename(refsFile),
    recommendations: basename(recFile),
    report: basename(reportFile),
    backlog: basename(backlogFile),
    verification: basename(verifyFile),
  },
  nextAgent: 'QA Verifier',
  instructions: 'Implementar P1–P2 no repo alvo; rodar build/test; marcar verification.md',
  gstackInspired: true,
  agents: [
    'Orchestrator',
    'Repo Scout',
    'Pattern Hunter',
    'Architecture Auditor',
    'Patch Planner',
    'QA Verifier',
  ],
}
const handoffFile = join(outDir, 'handoff.json')
writeFileSync(handoffFile, JSON.stringify(handoff, null, 2), 'utf8')

console.log(`[Patch Planner] ${recommendations.length} recomendações`)
console.log(`Relatório: ${reportFile}`)
console.log(`Handoff: ${handoffFile}`)
