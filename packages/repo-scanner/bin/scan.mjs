#!/usr/bin/env node
/**
 * Scan local de repositório → profile.json
 * Uso: node bin/scan.mjs <caminho-repo> [--out reports/]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { scanRepo } from '../lib/scan-repo.mjs'

const target = resolve(process.argv[2] || process.cwd())
const outArg = process.argv.indexOf('--out')
const outBase = outArg >= 0 ? resolve(process.argv[outArg + 1]) : join(resolve(import.meta.dirname, '../../..'), 'reports')

if (!existsSync(target)) {
  console.error(`Caminho não encontrado: ${target}`)
  process.exit(1)
}

const slug = basename(target).toLowerCase().replace(/\s+/g, '-')
const profile = scanRepo(target, slug)
const outDir = join(outBase, slug)
mkdirSync(outDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outFile = join(outDir, `profile-${stamp}.json`)
writeFileSync(outFile, JSON.stringify(profile, null, 2), 'utf8')
console.log(`Perfil salvo: ${outFile}`)
console.log(JSON.stringify(profile.summary, null, 2))
