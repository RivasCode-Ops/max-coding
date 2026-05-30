/**
 * Scan de repositório local → profile object
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function scanRepo(root, slug) {
  const files = walk(root, root, 0, 4000)
  const relPaths = files.map((f) => f.replace(root + (root.endsWith('\\') ? '' : '\\'), '').replace(/\\/g, '/'))

  const pkg = readJson(join(root, 'package.json'))
  const pyReq = existsSync(join(root, 'requirements.txt'))
  const hasStreamlit = relPaths.some((p) => p.endsWith('app.py')) && pyReq

  const signals = []
  const add = (id, evidence) => signals.push({ id, evidence })

  const workspacePkgCount = countWorkspacePackages(root, pkg)
  if (workspacePkgCount > 0) add('has_workspace_packages', `${workspacePkgCount} packages`)
  if (pkg?.workspaces?.length) add('stack_node_monorepo', 'package.json → workspaces')
  if (pkg?.dependencies?.vite || pkg?.devDependencies?.vite) add('stack_vite', 'package.json → vite')
  if (pkg?.dependencies?.react || pkg?.devDependencies?.react) add('stack_react', 'package.json → react')
  if (pkg?.dependencies?.next || pkg?.devDependencies?.next) add('stack_next', 'package.json → next')
  if (hasStreamlit) add('stack_streamlit', 'app.py + requirements.txt')
  if (existsSync(join(root, 'src'))) add('structure_src', 'src/')
  if (existsSync(join(root, 'packages'))) add('structure_packages', 'packages/')
  if (relPaths.some((p) => /test|spec|validar/i.test(p))) {
    add('has_tests_or_validar', relPaths.filter((p) => /test|validar/i.test(p)).slice(0, 5))
  }
  if (relPaths.some((p) => p.startsWith('.github/workflows'))) add('has_ci', '.github/workflows')
  if (existsSync(join(root, '.cursor/rules'))) add('has_cursor_rules', '.cursor/rules')
  if (relPaths.some((p) => p === 'README.md')) add('has_readme', 'README.md')
  if (pkg && !pkg.scripts?.test) add('gap_no_test_script', 'package.json sem script test')
  if (pkg?.scripts?.build) add('has_build_script', 'package.json → scripts.build')

  if (relPaths.some((p) => /dockerfile/i.test(p))) add('has_docker', 'Dockerfile')
  if (relPaths.some((p) => /docker-compose/i.test(p))) add('has_docker_compose', 'docker-compose')
  if (relPaths.some((p) => p === 'SECURITY.md')) add('has_security_md', 'SECURITY.md')
  if (relPaths.some((p) => /^LICENSE/i.test(p))) add('has_license', 'LICENSE')
  if (relPaths.some((p) => p === 'CONTRIBUTING.md')) add('has_contributing', 'CONTRIBUTING.md')
  if (relPaths.some((p) => p.includes('dependabot'))) add('has_dependabot', 'dependabot config')
  if (existsSync(join(root, '.editorconfig'))) add('has_editorconfig', '.editorconfig')
  if (existsSync(join(root, 'tsconfig.json'))) add('has_typescript', 'tsconfig.json')
  if (
    relPaths.some((p) => /eslint.config/i.test(p)) ||
    existsSync(join(root, '.eslintrc.json')) ||
    existsSync(join(root, '.eslintrc.cjs'))
  ) {
    add('has_eslint', 'eslint config')
  }
  if (relPaths.some((p) => /\.prettierrc/i.test(p))) add('has_prettier', 'prettier config')
  if (relPaths.some((p) => p === '.env.example')) add('has_env_example', '.env.example')

  const langs = detectLanguages(relPaths)
  if (langs.length) add('languages', langs)

  const srcJs = relPaths.filter((p) => p.startsWith('src/') && p.endsWith('.js'))
  const srcText = srcJs.map((p) => readText(join(root, ...p.split('/')))).join('\n')
  if (/draggable|dragstart|drop-zone|dataTransfer/i.test(srcText)) {
    add('has_drag_drop', srcJs.filter((p) => /main|board/i.test(p)).slice(0, 3))
  }
  if (/appendActivity|activity\[\]|has_activity/i.test(srcText)) {
    add('has_activity_log', srcJs.filter((p) => p.includes('board')).slice(0, 2))
  }
  if (/applyDoneAutomation|automation|IFTTT/i.test(srcText)) {
    add('has_automation_rules', srcJs.filter((p) => p.includes('board')).slice(0, 2))
  }

  const frameworks = []
  if (signals.some((s) => s.id === 'stack_vite')) frameworks.push('vite')
  if (signals.some((s) => s.id === 'stack_react')) frameworks.push('react')
  if (signals.some((s) => s.id === 'stack_next')) frameworks.push('next')
  if (signals.some((s) => s.id === 'stack_streamlit')) frameworks.push('streamlit')
  if (signals.some((s) => s.id === 'stack_node_monorepo')) frameworks.push('node-monorepo')

  const workspaceDeps = collectWorkspaceDeps(root, pkg)
  const rootDeps = Object.keys(pkg?.dependencies || {})
  const rootDevDeps = Object.keys(pkg?.devDependencies || {})
  const allDeps = [...new Set([...rootDeps, ...rootDevDeps, ...workspaceDeps])]

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
      packageManager: existsSync(join(root, 'pnpm-lock.yaml'))
        ? 'pnpm'
        : existsSync(join(root, 'package-lock.json'))
          ? 'npm'
          : null,
      scripts: pkg?.scripts || {},
      dependencies: rootDeps,
      devDependencies: rootDevDeps,
      workspaceDependencies: workspaceDeps,
      allDependencies: allDeps,
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
    return readFileSync(path, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function readText(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return ''
  }
}

function collectWorkspaceDeps(root, pkg) {
  const out = new Set()
  if (!pkg?.workspaces?.length) return []
  const packagesDir = join(root, 'packages')
  if (!existsSync(packagesDir)) return []
  for (const name of readdirSync(packagesDir)) {
    const childPkg = readJson(join(packagesDir, name, 'package.json'))
    if (!childPkg) continue
    for (const k of Object.keys(childPkg.dependencies || {})) out.add(k)
    for (const k of Object.keys(childPkg.devDependencies || {})) out.add(k)
  }
  return [...out]
}

function countWorkspacePackages(root, pkg) {
  if (!pkg?.workspaces?.length) return 0
  const packagesDir = join(root, 'packages')
  if (!existsSync(packagesDir)) return 0
  let count = 0
  for (const name of readdirSync(packagesDir)) {
    if (readJson(join(packagesDir, name, 'package.json'))) count += 1
  }
  return count
}

function detectLanguages(relPaths) {
  const extMap = { '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.py': 'python', '.go': 'go', '.rs': 'rust' }
  const found = new Set()
  for (const p of relPaths) {
    for (const [ext, lang] of Object.entries(extMap)) {
      if (p.endsWith(ext)) found.add(lang)
    }
  }
  return [...found]
}
