#!/usr/bin/env node
/**
 * MAX Quick Scan — perfil + health score (sem padrões externos nem backlog completo)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { computeHealthScore } from '../lib/health-score.mjs'

const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const target = resolve(process.argv[2] || '')

if (!target || !existsSync(target)) {
  console.error('Uso: npm run quick -- <repo-path>')
  process.exit(1)
}

const slug = basename(target).toLowerCase().replace(/\s+/g, '-')
const outDir = join(root, 'reports', slug)
mkdirSync(outDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')

console.log(`[MAX] Quick Scan — ${slug}`)

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

const summary = {
  product: 'MAX',
  mode: 'quick',
  generatedAt: new Date().toISOString(),
  repo: { slug, path: target },
  profile: basename(latestProfile),
  health,
  summary: profile.summary,
  signals: (profile.signals || []).map((s) => s.id),
}

const outFile = join(outDir, `quick-${stamp}.json`)
writeFileSync(outFile, JSON.stringify(summary, null, 2), 'utf8')

const md = [
  `# MAX Quick Scan — ${slug}`,
  '',
  `**Health score:** ${health.summary}`,
  '',
  '## Categorias',
  '',
  ...health.categories.map((c) => `- **${c.id}** (${c.weight}pts): ${c.status === 'ok' ? '✓' : 'gap'}`),
  '',
  '## Stack',
  '',
  `- Frameworks: ${(profile.summary?.frameworks || []).join(', ') || '—'}`,
  `- Arquivos indexados: ${profile.summary?.fileCount ?? '—'}`,
  '',
  'Para análise completa: `npm run deep -- <path>`',
].join('\n')

const mdFile = join(outDir, `quick-${stamp}.md`)
writeFileSync(mdFile, md, 'utf8')

console.log(`Health: ${health.summary}`)
console.log(`Relatório: ${mdFile}`)
