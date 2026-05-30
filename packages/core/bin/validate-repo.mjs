#!/usr/bin/env node
/**
 * Max Stack — validação controlada (test/build/lint) no repo alvo
 */
import { basename, resolve } from 'node:path'
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import { validateFromProfile } from '../lib/repo-validator.mjs'

const repoPath = resolve(process.argv[2] || process.cwd())
const slug = basename(repoPath)
const profile = scanRepo(repoPath, slug)
const result = validateFromProfile(profile)

console.log(JSON.stringify({ slug, path: repoPath, ...result }, null, 2))
process.exit(result.skipped || result.ok ? 0 : 1)
