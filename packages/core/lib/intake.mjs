/**
 * Ingestão: caminho local ou URL GitHub → path analisável
 */
import { existsSync, mkdirSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('../../..', import.meta.url)))
const REPOS_DIR = join(ROOT, 'data', 'repos')

const GITHUB_RE = /^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git|\/)?\/?$/i

export function parseGithubUrl(input) {
  const m = input.trim().match(GITHUB_RE)
  if (!m) return null
  const full = m[1].replace(/\.git$/i, '')
  const slug = full.replace('/', '-').toLowerCase()
  return { ownerRepo: full, slug, url: `https://github.com/${full}` }
}

export function isGithubUrl(input) {
  return GITHUB_RE.test(input.trim())
}

export function resolveRepositoryInput(input, options = {}) {
  const raw = String(input || '').trim()
  if (!raw) throw new Error('Informe caminho local ou URL GitHub')

  const gh = parseGithubUrl(raw)
  if (gh) {
    const localPath = ensureGithubCheckout(gh, options)
    return {
      source: 'github',
      url: gh.url,
      ownerRepo: gh.ownerRepo,
      slug: gh.slug,
      path: localPath,
    }
  }

  const localPath = resolve(raw)
  if (!existsSync(localPath)) {
    throw new Error(`Caminho não encontrado: ${localPath}`)
  }
  const slug = basename(localPath).toLowerCase().replace(/\s+/g, '-')
  return { source: 'local', url: null, ownerRepo: null, slug, path: localPath }
}

function ensureGithubCheckout(gh, options = {}) {
  mkdirSync(REPOS_DIR, { recursive: true })
  const target = join(REPOS_DIR, gh.slug)
  if (existsSync(join(target, '.git')) && !options.forceRefresh) {
    return target
  }
  if (existsSync(target)) {
    const pull = spawnSync('git', ['-C', target, 'pull', '--ff-only'], { encoding: 'utf8' })
    if (pull.status === 0) return target
  }
  mkdirSync(REPOS_DIR, { recursive: true })
  const clone = spawnSync(
    'git',
    ['clone', '--depth', '1', `https://github.com/${gh.ownerRepo}.git`, target],
    { encoding: 'utf8' },
  )
  if (clone.status !== 0) {
    throw new Error(`Falha ao clonar ${gh.url}: ${clone.stderr || clone.stdout}`)
  }
  return target
}

export function getReposCacheDir() {
  return REPOS_DIR
}
