/**
 * Busca melhor opção para ação solicitada pelo usuário (Fase 8)
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanRepo } from '../../repo-scanner/lib/scan-repo.mjs'
import { recommendFromProfile } from '../../recommender/lib/recommend.mjs'
import { planPilotFixes } from './apply-pilot.mjs'
import { buildCursorApplyPrompt, mapRecToPilotFix } from './cursor-apply.mjs'

const ROOT = join(fileURLToPath(new URL('../../..', import.meta.url)))

const KEYWORDS = [
  { keys: ['test', 'teste', 'vitest', 'jest', 'coverage'], tags: ['testes', 'test'], signal: 'has_tests_or_validar' },
  { keys: ['ci', 'pipeline', 'github actions', 'workflow'], tags: ['ci_cd', 'ci'], signal: 'has_ci' },
  { keys: ['eslint', 'lint', 'linter', 'prettier'], tags: ['qualidade_codigo', 'lint'], signal: 'has_eslint' },
  { keys: ['security', 'seguranca', 'vulnerab'], tags: ['seguranca'], signal: 'has_security_md' },
  { keys: ['dependabot', 'renovate', 'deps', 'dependencia'], tags: ['dependencias', 'dependabot'], signal: 'has_dependabot' },
  { keys: ['docker', 'container'], tags: ['infra', 'docker'], signal: 'has_docker' },
  { keys: ['readme', 'doc', 'documentacao'], tags: ['documentacao'], signal: 'has_readme' },
  { keys: ['license', 'licenca', 'mit'], tags: ['governanca'], signal: 'has_license' },
  { keys: ['typescript', 'ts', 'tipagem'], tags: ['typescript'], signal: 'has_typescript' },
  { keys: ['modular', 'refator', 'split', 'main.js', 'arquivo grande'], tags: ['arquitetura'], signal: 'structure_src' },
  { keys: ['cursor', 'rules', 'agente'], tags: ['dx'], signal: 'has_cursor_rules' },
  { keys: ['dnd', 'drag', 'kanban', 'board'], tags: ['feature'], signal: 'has_drag_drop' },
  { keys: ['performance', 'bundle', 'build'], tags: ['performance'], signal: 'has_build_script' },
]

export function suggestActions(input, context = {}) {
  const request = String(input || '').trim()
  if (!request) return { request, suggestions: [], note: 'Informe o que deseja fazer' }

  const profile = context.profile || scanRepo(context.repoPath, context.slug)
  const analysis = context.analysisResult || {}
  const tokens = tokenize(request)
  const signals = new Set((profile.signals || []).map((s) => s.id))

  const candidates = []

  for (const rec of analysis.recommendations || []) {
    candidates.push({
      kind: 'recommendation',
      id: rec.id,
      title: rec.title,
      subtitle: rec.problem || rec.suggestedUpgrade,
      priority: rec.priority ?? 3,
      score: scoreItem(rec.title + ' ' + (rec.problem || '') + ' ' + (rec.category || ''), tokens, rec.category),
      rec,
      pilotFix: mapRecToPilotFix(rec),
    })
  }

  for (const f of analysis.findings || []) {
    candidates.push({
      kind: 'finding',
      id: f.id,
      title: f.title,
      subtitle: f.justification,
      priority: f.priority ?? 3,
      score: scoreItem(f.title + ' ' + f.justification + ' ' + f.category, tokens, f.category),
      rec: findingAsRec(f),
      pilotFix: null,
    })
  }

  const catalogRecs = recommendFromProfile(profile).recommendations || []
  for (const rec of catalogRecs) {
    if (candidates.some((c) => c.title === rec.title)) continue
    candidates.push({
      kind: 'catalog',
      id: rec.id,
      title: rec.title,
      subtitle: rec.problem,
      priority: rec.priority ?? 3,
      score: scoreItem(rec.title + ' ' + rec.problem + ' ' + rec.category, tokens, rec.category),
      rec,
      pilotFix: mapRecToPilotFix(rec),
    })
  }

  for (const kw of KEYWORDS) {
    if (!kw.keys.some((k) => request.toLowerCase().includes(k))) continue
    const hasSignal = kw.signal ? signals.has(kw.signal) : false
    if (!hasSignal) {
      candidates.push({
        kind: 'gap',
        id: `gap-${kw.signal}`,
        title: `Gap detectado: ${kw.keys[0]}`,
        subtitle: `Projeto sem sinal ${kw.signal} — Max Stack sugere implementar`,
        priority: 1,
        score: 50 + kw.keys.filter((k) => request.toLowerCase().includes(k)).length * 10,
        rec: {
          id: `gap-${kw.signal}`,
          title: `Implementar ${kw.keys[0]} no projeto`,
          problem: `Sinal ${kw.signal} ausente no scan`,
          suggestedUpgrade: pickUpgradeHint(kw, profile),
          priority: 1,
          category: kw.tags[0],
        },
        pilotFix: mapPilotFromSignal(kw.signal),
      })
    }
  }

  const pilotPlanned = planPilotFixes(profile)
  for (const fixId of pilotPlanned) {
    if (!tokensMatchFix(tokens, fixId) && !request.toLowerCase().includes(fixId.replace('-', ' '))) continue
    candidates.push({
      kind: 'pilot',
      id: fixId,
      title: `Apply-pilot: ${fixId}`,
      subtitle: 'Correção automática segura disponível',
      priority: 1,
      score: 45,
      rec: {
        id: fixId,
        title: `Aplicar ${fixId}`,
        problem: 'Gap detectado no scan',
        suggestedUpgrade: 'Executar npm run apply-pilot ou botão Aplicar automático',
        priority: 1,
      },
      pilotFix: fixId,
    })
  }

  const ranked = candidates
    .map((c) => ({ ...c, score: c.score + keywordBoost(request, c.title) + (4 - Math.min(c.priority, 3)) * 5 }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)

  const suggestions = ranked.map((c) => ({
    ...c,
    prompt: buildCursorApplyPrompt(c.rec, {
      repo: analysis.repo || { path: context.repoPath, slug: context.slug },
      profile,
      health: analysis.health,
      taskFile: `${context.slug || 'repo'}-${c.id}.md`,
    }),
  }))

  return {
    request,
    suggestions,
    profile: { frameworks: profile.summary?.frameworks, signals: (profile.signals || []).map((s) => s.id) },
    note: suggestions.length ? null : 'Nenhuma correspondência — tente termos como testes, CI, eslint, segurança',
  }
}

function tokenize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[\s,.;:!?/\\-]+/)
    .filter((t) => t.length > 2)
}

function scoreItem(text, tokens, category) {
  const lower = text.toLowerCase()
  let score = 0
  for (const t of tokens) {
    if (lower.includes(t)) score += 12
  }
  if (category && tokens.some((t) => category.includes(t))) score += 8
  return score
}

function keywordBoost(request, title) {
  const r = request.toLowerCase()
  const t = title.toLowerCase()
  if (r.split(' ').some((w) => w.length > 3 && t.includes(w))) return 15
  return 0
}

function findingAsRec(f) {
  return {
    id: f.id,
    title: f.title,
    problem: f.justification,
    suggestedUpgrade: f.justification,
    priority: f.priority,
    category: f.category,
    affectedAreas: f.affectedAreas,
    evidence: f.evidence,
  }
}

function mapPilotFromSignal(signal) {
  const m = {
    has_security_md: 'security-md',
    has_dependabot: 'dependabot',
    has_license: 'license-mit',
    has_eslint: 'eslint',
    has_editorconfig: 'editorconfig',
    has_env_example: 'env-example',
  }
  return m[signal] || null
}

function tokensMatchFix(tokens, fixId) {
  const parts = fixId.split('-')
  return parts.some((p) => tokens.includes(p))
}

function pickUpgradeHint(kw, profile) {
  const fw = profile.summary?.frameworks?.[0] || 'node'
  const hints = {
    has_tests_or_validar: 'Adicionar Vitest/Jest com script npm test',
    has_ci: 'Criar .github/workflows/ci.yml com test + build',
    has_eslint: 'Adicionar eslint.config.js flat config',
    has_security_md: 'Criar SECURITY.md na raiz',
    has_dependabot: 'Criar .github/dependabot.yml',
    has_license: 'Adicionar LICENSE MIT',
    has_typescript: 'Migrar gradualmente para TypeScript',
    structure_src: 'Extrair módulos em src/lib/',
  }
  return hints[kw.signal] || `Melhorar ${kw.keys[0]} para stack ${fw}`
}

export function listCatalogSnippets() {
  const dir = join(ROOT, 'packages', 'pattern-search', 'catalog')
  try {
    return readdirSync(dir).filter((f) => f.endsWith('.json'))
  } catch {
    return []
  }
}
