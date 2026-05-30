# Roadmap — max-coding

## Fase 0 — Fundação (atual)

- [x] README, CONTEXT, HANDOFF
- [x] PRD, architecture, pattern-engine, recommendation-model
- [x] Esqueleto `packages/*`
- [x] Scanner CLI mínimo (perfil JSON)
- [ ] `git init` + push GitHub quando `gh auth` ok

## Fase 1 — MVP auditor (em progresso)

- [x] `repo-scanner` CLI
- [x] Catálogo vite-kanban + recommender rules
- [x] `npm run audit` + handoff.json
- [x] Mapeamento gstack + agent prompts
- [ ] GitHub search API
- [ ] Piloto completo Quadro-Negro (apply P1 no repo alvo)

## Fase 2 — Agente + DX

- [ ] Gerador de `.cursor/rules` a partir do perfil (estilo ECC)
- [ ] `apps/web` — visualizar relatórios
- [ ] Feedback loop (útil/não útil) nas recomendações
- [ ] Histórico de scans (diff entre versões do repo)

## Fase 3 — Evolução contínua

- [ ] Hooks git pre-commit opcionais (só aviso)
- [ ] Comparação multi-repo (portfolio `_PROJETOS`)
- [ ] Integração issue tracker (GitHub Issues template)

## Prioridade imediata (esta semana)

1. Scan completo Quadro-Negro → `reports/quadro-negro/`
2. Catálogo estático de 10 práticas por stack (Vite, Next, Streamlit)
3. 5 recomendações reais para Quadro-Negro com referência OSS citada
