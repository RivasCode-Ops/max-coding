/**
 * Aplica correções seguras (P1/P2) com base no perfil — piloto Fase 7
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'

const SECURITY_MD = `# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | Yes       |

## Reporting a Vulnerability

Please report security issues via [GitHub Security Advisories](https://github.com/security/advisories) for this repository.
Do not open public issues for undisclosed vulnerabilities.
`

const DEPENDABOT_YML = `version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
`

const EDITORCONFIG = `root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
`

const ENV_EXAMPLE = `# Copie para .env.local (não commitar secrets)
# VITE_API_URL=
`

const ESLINT_CONFIG = `export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
]
`

const LICENSE_MIT = (year, holder) => `MIT License

Copyright (c) ${year} ${holder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

export function planPilotFixes(profile) {
  const signals = new Set((profile.signals || []).map((s) => s.id))
  const planned = []
  if (!signals.has('has_security_md')) planned.push('security-md')
  if (signals.has('has_ci') && !signals.has('has_dependabot')) planned.push('dependabot')
  if (!signals.has('has_license')) planned.push('license-mit')
  if (!signals.has('has_eslint')) planned.push('eslint')
  if (!signals.has('has_editorconfig')) planned.push('editorconfig')
  if (!signals.has('has_env_example')) planned.push('env-example')
  return planned
}

export function applyPilotFixes(repoPath, options = {}) {
  const slug = options.slug || basename(repoPath).toLowerCase().replace(/\s+/g, '-')
  const profile = options.profile || scanRepo(repoPath, slug)
  const planned = options.fixes || planPilotFixes(profile)
  const dryRun = Boolean(options.dryRun)
  const force = Boolean(options.force)
  const results = []

  for (const fixId of planned) {
    const r = applyOne(repoPath, fixId, { dryRun, force, slug, profile })
    results.push(r)
  }

  return { repoPath, slug, planned, results, profile }
}

function applyOne(repoPath, fixId, ctx) {
  const handlers = {
    'security-md': () => writeOnce(repoPath, 'SECURITY.md', SECURITY_MD, ctx),
    dependabot: () => {
      mkdirSync(join(repoPath, '.github'), { recursive: true })
      return writeOnce(repoPath, join('.github', 'dependabot.yml'), DEPENDABOT_YML, ctx)
    },
    'license-mit': () => {
      const pkg = readJson(join(repoPath, 'package.json'))
      const holder = pkg?.author || slugToTitle(ctx.slug)
      return writeOnce(repoPath, 'LICENSE', LICENSE_MIT(new Date().getFullYear(), holder), ctx)
    },
    eslint: () => {
      const w = writeOnce(repoPath, 'eslint.config.js', ESLINT_CONFIG, ctx)
      if (!w.skipped && !ctx.dryRun) patchPackageJson(repoPath, ctx)
      return w
    },
    editorconfig: () => writeOnce(repoPath, '.editorconfig', EDITORCONFIG, ctx),
    'env-example': () => writeOnce(repoPath, '.env.example', ENV_EXAMPLE, ctx),
  }
  const fn = handlers[fixId]
  if (!fn) return { fixId, ok: false, error: 'fix desconhecido' }
  return { fixId, ...fn() }
}

function writeOnce(repoPath, rel, content, ctx) {
  const target = join(repoPath, rel)
  if (existsSync(target) && !ctx.force) {
    return { ok: true, skipped: true, path: target, reason: 'já existe' }
  }
  if (ctx.dryRun) {
    return { ok: true, dryRun: true, path: target, bytes: content.length }
  }
  mkdirSync(join(target, '..'), { recursive: true })
  writeFileSync(target, content, 'utf8')
  return { ok: true, written: target, bytes: content.length }
}

function patchPackageJson(repoPath, ctx) {
  if (ctx.dryRun) return { patched: false }
  const path = join(repoPath, 'package.json')
  const pkg = readJson(path)
  if (!pkg) return { patched: false }
  pkg.scripts = pkg.scripts || {}
  if (!pkg.scripts.lint) pkg.scripts.lint = 'eslint .'
  pkg.devDependencies = pkg.devDependencies || {}
  if (!pkg.devDependencies.eslint) pkg.devDependencies.eslint = '^9.0.0'
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  return { patched: true }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function slugToTitle(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function runPilot(repoPath, options = {}) {
  const { analyzeRepository } = await import('./analyze.mjs')
  const before = await analyzeRepository(repoPath, {
    mode: options.mode || 'quick',
    writeReports: false,
    githubSearch: false,
  })
  const applied = applyPilotFixes(repoPath, {
    dryRun: options.dryRun,
    force: options.force,
    fixes: options.fixes,
  })
  let after = before
  if (!options.dryRun && applied.results.some((r) => r.written || r.patched)) {
    after = await analyzeRepository(repoPath, {
      mode: options.mode || 'quick',
      writeReports: false,
      githubSearch: false,
    })
  }
  return {
    before: { health: before.health, findings: before.findings.length },
    after: { health: after.health, findings: after.findings.length },
    delta: (after.health?.overall ?? 0) - (before.health?.overall ?? 0),
    applied,
  }
}
