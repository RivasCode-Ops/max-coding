#!/usr/bin/env node
/**
 * Scan local de repositório → profile.json
 * Uso: node bin/scan.mjs <caminho-repo> [--out reports/]
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

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

function scanRepo(root, slug) {
  const files = walk(root, root, 0, 4000)
  const relPaths = files.map((f) => f.replace(root + (root.endsWith('\\') ? '' : '\\'), '').replace(/\\/g, '/'))

  const pkg = readJson(join(root, 'package.json'))
  const pyReq = existsSync(join(root, 'requirements.txt'))
  const hasStreamlit = relPaths.some((p) => p.endsWith('app.py')) && pyReq

  const signals = []
  const add = (id, evidence) => signals.push({ id, evidence })

  if (pkg?.dependencies?.vite || pkg?.devDependencies?.vite) add('stack_vite', 'package.json → vite')
  if (pkg?.dependencies?.react || pkg?.devDependencies?.react) add('stack_react', 'package.json → react')
  if (pkg?.dependencies?.next || pkg?.devDependencies?.next) add('stack_next', 'package.json → next')
  if (hasStreamlit) add('stack_streamlit', 'app.py + requirements.txt')
  if (existsSync(join(root, 'src'))) add('structure_src', 'src/')
  if (relPaths.some((p) => /test|spec|validar/i.test(p))) add('has_tests_or_validar', relPaths.filter((p) => /test|validar/i.test(p)).slice(0, 5))
  if (relPaths.some((p) => p.startsWith('.github/workflows'))) add('has_ci', '.github/workflows')
  if (existsSync(join(root, '.cursor/rules'))) add('has_cursor_rules', '.cursor/rules')
  if (relPaths.some((p) => p === 'README.md')) add('has_readme', 'README.md')
  if (pkg && !pkg.scripts?.test) add('gap_no_test_script', 'package.json sem script test')

  const frameworks = []
  if (signals.some((s) => s.id === 'stack_vite')) frameworks.push('vite')
  if (signals.some((s) => s.id === 'stack_react')) frameworks.push('react')
  if (signals.some((s) => s.id === 'stack_next')) frameworks.push('next')
  if (signals.some((s) => s.id === 'stack_streamlit')) frameworks.push('streamlit')

  return {
    slug,
    path: root,
    scannedAt: new Date().toISOString(),
    summary: {
      fileCount: relPaths.length,
      frameworks,
      hasCi: signals.some((s) => s.id === 'has_ci'),
      hasTestsSignal: signals.some((s) => s.id === 'has_tests_or_validar'),
      hasCursorRules: signals.some((s) => s.id === 'has_cursor_rules'),
      gapNoTestScript: signals.some((s) => s.id === 'gap_no_test_script'),
    },
    stack: {
      packageManager: existsSync(join(root, 'pnpm-lock.yaml')) ? 'pnpm' : existsSync(join(root, 'package-lock.json')) ? 'npm' : null,
      scripts: pkg?.scripts || {},
      dependencies: Object.keys(pkg?.dependencies || {}),
      devDependencies: Object.keys(pkg?.devDependencies || {}),
    },
    python: pyReq ? { requirements: readLines(join(root, 'requirements.txt')).slice(0, 20) } : null,
    signals,
    samplePaths: relPaths.filter((p) => !p.includes('node_modules')).slice(0, 40),
  }
}

function walk(dir, root, depth, maxFiles) {
  if (depth > 8) return []
  let out = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    if (out.length >= maxFiles) break
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue
    const full = join(dir, e.name)
    if (e.isDirectory()) out = out.concat(walk(full, root, depth + 1, maxFiles - out.length))
    else if (e.isFile()) out.push(full)
  }
  return out
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function readLines(path) {
  try {
    return readFileSync(path, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
  } catch {
    return []
  }
}
