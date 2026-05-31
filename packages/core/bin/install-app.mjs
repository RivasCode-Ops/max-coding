#!/usr/bin/env node
/**
 * Instala atalhos Max Stack na área de trabalho
 * npm run install-app [--dry-run]
 */
import { getAppInstallStatus, installDesktopShortcut } from '../lib/app-installer.mjs'

const dryRun = process.argv.includes('--dry-run')
const status = getAppInstallStatus()
console.log(JSON.stringify(status, null, 2))

if (dryRun) {
  const preview = installDesktopShortcut({ dryRun: true })
  console.log('\nPreview:')
  console.log(JSON.stringify(preview, null, 2))
  process.exit(preview.ok ? 0 : 1)
}

const result = installDesktopShortcut()
console.log('\nResultado:')
console.log(JSON.stringify(result, null, 2))
process.exit(result.ok ? 0 : 1)
