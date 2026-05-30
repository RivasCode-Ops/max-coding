/**
 * Gera hook git pre-commit opcional — aviso Max Stack (Fase 4)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function generatePreCommitHook(repoPath, options = {}) {
  const minHealth = options.minHealth ?? 70
  const content = `#!/bin/sh
# Max Stack pre-commit — aviso opcional (não bloqueia commit)
# Instalado por Max Stack — remova se não quiser

if command -v node >/dev/null 2>&1; then
  MAX_ROOT="${options.maxRoot || ''}"
  if [ -n "$MAX_ROOT" ] && [ -f "$MAX_ROOT/packages/core/bin/hook-check.mjs" ]; then
    node "$MAX_ROOT/packages/core/bin/hook-check.mjs" "${minHealth}" "$(pwd)" 2>/dev/null || true
  fi
fi
exit 0
`
  return content
}

export function installPreCommitHook(repoPath, maxRoot, options = {}) {
  const hooksDir = join(repoPath, '.git', 'hooks')
  if (!existsSync(join(repoPath, '.git'))) {
    throw new Error('Repositório sem .git — hook não instalado')
  }
  mkdirSync(hooksDir, { recursive: true })
  const target = join(hooksDir, 'pre-commit')
  const content = generatePreCommitHook(repoPath, { ...options, maxRoot })
  writeFileSync(target, content, { mode: 0o755 })
  return { written: target }
}
