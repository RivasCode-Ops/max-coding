/**
 * Análise estrutural — acoplamento, arquivos grandes, hotspots (Fase 3)
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { createFinding } from './findings.mjs'

const CODE_EXT = new Set(['.js', '.mjs', '.ts', '.tsx', '.jsx'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', 'build'])

export function analyzeStructure(repoPath) {
  const files = walkCode(repoPath, repoPath)
  const metrics = files.map((abs) => analyzeFile(repoPath, abs))
  const findings = []

  const large = metrics.filter((m) => m.lines > 350)
  for (const f of large.slice(0, 5)) {
    findings.push(
      createFinding({
        category: 'arquitetura_modularidade',
        title: `Arquivo grande: ${f.rel} (${f.lines} linhas)`,
        findingType: 'hypothesis',
        severity: f.lines > 600 ? 'high' : 'medium',
        justification: 'Arquivos muito longos indicam possível acoplamento ou falta de modularização',
        evidence: [f.rel, `lines:${f.lines}`],
        affectedAreas: [f.rel],
        priority: f.lines > 600 ? 1 : 2,
        sourceRole: 'Architecture Auditor',
      }),
    )
  }

  const heavyImports = metrics.filter((m) => m.importCount >= 12)
  for (const f of heavyImports.slice(0, 3)) {
    findings.push(
      createFinding({
        category: 'arquitetura_modularidade',
        title: `Alto acoplamento por imports: ${f.rel}`,
        findingType: 'hypothesis',
        severity: 'medium',
        justification: `${f.importCount} imports — considere dividir responsabilidades`,
        evidence: [f.rel, `imports:${f.importCount}`],
        affectedAreas: [f.rel],
        priority: 2,
        sourceRole: 'Architecture Auditor',
      }),
    )
  }

  const uiOnly = metrics.filter((m) => m.rel.includes('main.') && m.lines > 200 && m.importCount < 3)
  if (uiOnly.length && metrics.length > 3) {
    findings.push(
      createFinding({
        category: 'arquitetura_modularidade',
        title: 'Lógica concentrada em entrypoint (main)',
        findingType: 'suggestion',
        severity: 'medium',
        justification: 'Entrypoint grande com poucos módulos — extrair lib/ ou components/',
        evidence: uiOnly.map((m) => m.rel),
        affectedAreas: uiOnly.map((m) => m.rel),
        priority: 2,
        sourceRole: 'Architecture Auditor',
      }),
    )
  }

  return {
    fileCount: metrics.length,
    totalLines: metrics.reduce((s, m) => s + m.lines, 0),
    hotspots: large.slice(0, 5).map((m) => ({ file: m.rel, lines: m.lines, imports: m.importCount })),
    findings,
  }
}

function walkCode(dir, root, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(name.name)) continue
    const full = join(dir, name.name)
    if (name.isDirectory()) walkCode(full, root, out)
    else if (CODE_EXT.has(name.name.slice(name.name.lastIndexOf('.')))) out.push(full)
  }
  return out
}

function analyzeFile(root, abs) {
  const rel = relative(root, abs).replace(/\\/g, '/')
  let content = ''
  try {
    content = readFileSync(abs, 'utf8')
  } catch {
    return { rel, lines: 0, importCount: 0 }
  }
  const lines = content.split('\n').length
  const importCount = (content.match(/^import\s+/gm) || []).length + (content.match(/require\s*\(/g) || []).length
  return { rel, lines, importCount }
}
