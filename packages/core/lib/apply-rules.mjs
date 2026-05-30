/**
 * Escreve cursor rules no repo alvo (sob autorização — Fase 3)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cursorRulesFilename } from './rules-generator.mjs'

export function applyCursorRules(repoPath, rulesContent, slug) {
  if (!rulesContent?.trim()) throw new Error('Conteúdo de rules vazio')
  if (!existsSync(repoPath)) throw new Error(`Repo não encontrado: ${repoPath}`)

  const rulesDir = join(repoPath, '.cursor', 'rules')
  mkdirSync(rulesDir, { recursive: true })
  const filename = cursorRulesFilename(slug || 'projeto')
  const target = join(rulesDir, filename)
  writeFileSync(target, rulesContent, 'utf8')
  return { written: target, filename }
}
