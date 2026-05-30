#!/usr/bin/env node
/**
 * Checagem leve para pre-commit hook — só avisa no stderr
 */
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import { analyzeCategories } from '../lib/categories.mjs'
import { basename, resolve } from 'node:path'

const minHealth = Number(process.argv[2] || 70)
const repoPath = resolve(process.argv[3] || process.cwd())
const slug = basename(repoPath)
const profile = scanRepo(repoPath, slug)
const health = analyzeCategories(profile)

if (health.overall < minHealth) {
  console.error(`[Max Stack] Health ${health.summary} abaixo de ${minHealth}/100 — considere npm run quick neste repo`)
}
