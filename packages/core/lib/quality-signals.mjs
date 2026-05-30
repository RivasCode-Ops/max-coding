/**
 * Sinais de qualidade explícitos — Fase 21
 * Testes, CI, docs, DX, segurança e governança a partir do profile
 */

export function buildQualitySignals(profile) {
  const ids = new Set((profile.signals || []).map((s) => s.id))
  const has = (id) => ids.has(id)
  const script = (name) => Boolean(profile.stack?.scripts?.[name])

  const checks = [
    { id: 'readme', group: 'docs', label: 'README', ok: has('has_readme') },
    { id: 'contributing', group: 'docs', label: 'CONTRIBUTING', ok: has('has_contributing') },
    { id: 'ci', group: 'ci_cd', label: 'CI (GitHub Actions)', ok: has('has_ci') },
    { id: 'tests_files', group: 'testes', label: 'Arquivos de teste / validar', ok: has('has_tests_or_validar') },
    {
      id: 'test_script',
      group: 'testes',
      label: 'Script npm test',
      ok: script('test') && !has('gap_no_test_script'),
    },
    { id: 'build_script', group: 'ci_cd', label: 'Script build', ok: script('build') || has('has_build_script') },
    { id: 'eslint', group: 'dx', label: 'ESLint', ok: has('has_eslint') },
    { id: 'prettier', group: 'dx', label: 'Prettier', ok: has('has_prettier') },
    { id: 'typescript', group: 'dx', label: 'TypeScript', ok: has('has_typescript') },
    { id: 'editorconfig', group: 'dx', label: 'EditorConfig', ok: has('has_editorconfig') },
    { id: 'cursor_rules', group: 'dx', label: 'Cursor rules', ok: has('has_cursor_rules') },
    { id: 'env_example', group: 'dx', label: '.env.example', ok: has('has_env_example') },
    { id: 'security_md', group: 'seguranca', label: 'SECURITY.md', ok: has('has_security_md') },
    { id: 'dependabot', group: 'seguranca', label: 'Dependabot', ok: has('has_dependabot') },
    { id: 'license', group: 'governanca', label: 'LICENSE', ok: has('has_license') },
    { id: 'docker', group: 'ops', label: 'Docker / Compose', ok: has('has_docker') || has('has_docker_compose') },
  ]

  const passed = checks.filter((c) => c.ok).length
  const groups = summarizeByGroup(checks)

  return {
    checks,
    groups,
    summary: {
      passed,
      total: checks.length,
      pct: checks.length ? Math.round((passed / checks.length) * 100) : 0,
    },
  }
}

function summarizeByGroup(checks) {
  const byGroup = new Map()
  for (const c of checks) {
    if (!byGroup.has(c.group)) byGroup.set(c.group, { id: c.group, passed: 0, total: 0 })
    const g = byGroup.get(c.group)
    g.total++
    if (c.ok) g.passed++
  }
  return [...byGroup.values()].map((g) => ({
    ...g,
    label: groupLabel(g.id),
    pct: g.total ? Math.round((g.passed / g.total) * 100) : 0,
  }))
}

function groupLabel(id) {
  const labels = {
    docs: 'Documentação',
    testes: 'Testes',
    ci_cd: 'CI/CD',
    dx: 'Developer experience',
    seguranca: 'Segurança',
    governanca: 'Governança',
    ops: 'Operações',
  }
  return labels[id] || id
}

export function formatQualitySignalsMarkdown(quality) {
  const lines = [
    '## Sinais de qualidade',
    '',
    `**${quality.summary.passed}/${quality.summary.total}** ok (${quality.summary.pct}%)`,
    '',
  ]
  for (const g of quality.groups) {
    lines.push(`### ${g.label} — ${g.passed}/${g.total}`, '')
    for (const c of quality.checks.filter((x) => x.group === g.id)) {
      lines.push(`- [${c.ok ? 'x' : ' '}] ${c.label}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
