import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { planPilotFixes, applyPilotFixes } from '../packages/core/lib/apply-pilot.mjs'
import { scanRepo } from '../packages/repo-scanner/lib/scan-repo.mjs'

describe('Fase 7 — apply pilot', () => {
  it('planeja fixes para repo sem seguranca/license/eslint', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-pilot-'))
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'x', scripts: { test: 'vitest' } }),
      'utf8',
    )
    writeFileSync(join(dir, 'README.md'), '# x', 'utf8')
    mkdirSync(join(dir, '.github', 'workflows'), { recursive: true })
    writeFileSync(join(dir, '.github', 'workflows', 'ci.yml'), 'name: ci', 'utf8')
    const profile = scanRepo(dir, 'x')
    const plan = planPilotFixes(profile)
    assert.ok(plan.includes('security-md'))
    assert.ok(plan.includes('license-mit'))
  })

  it('aplica SECURITY.md em dry-run', () => {
    const dir = mkdtempSync(join(tmpdir(), 'max-pilot-'))
    writeFileSync(join(dir, 'package.json'), '{}', 'utf8')
    const r = applyPilotFixes(dir, { slug: 'x', dryRun: true, fixes: ['security-md'] })
    assert.equal(r.results[0].dryRun, true)
  })
})
