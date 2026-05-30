# Max Stack — alinhamento PRD × estado atual × plano

**Produto:** Max Stack · **Repositório:** [max-coding](https://github.com/RivasCode-Ops/max-coding)

## Sua demanda vs minha leitura

| Ponto do PRD | Sua intenção | Minha coordenação |
|--------------|--------------|-------------------|
| Nome **Max Stack** | Posicionamento do produto | ✅ Adotar na UI/docs; repo `max-coding` permanece |
| V1 completa | Tudo do PRD funcional | ✅ V1 + Fases 3–5 local/cloud entregues |
| Papéis gstack (7 agentes) | Especialização real | ⚠️ **Diferente:** módulos determinísticos por papel (sem 7 chamadas LLM) — mais rápido, local, rastreável |
| React + TypeScript UI | Interface V1 | ✅ Vite + React + TS em `apps/web`; API Node existente |
| SQLite schema completo | 9 entidades | ✅ Normalizar tabelas; manter `payload` JSON como cache de compatibilidade |
| GitHub URL | Ingestão remota | ✅ Clone raso em `data/repos/<slug>`; Quick pode usar API metadata |
| Busca padrões externos | Comparativo OSS | ⚠️ **V1:** catálogos estáticos por stack + diff; busca GitHub API opcional com `GITHUB_TOKEN` na Fase 2 |
| Achados tipados | confirmed / hypothesis / suggestion | ✅ Motor de findings com evidência obrigatória |
| 12 categorias | Health por categoria | ✅ Expandir de 8 → 12 no scanner + analisadores |

## O que já existe (~V1.5 parcial)

- Quick / Deep CLI + `npm start` + `validar`
- SQLite (simplificado)
- Health score 8 categorias
- Catálogo vite-kanban
- UI vanilla (não React)

## Plano de execução (esta entrega)

### Bloco A — Fundação PRD V1
1. `intake.mjs` — local + URL GitHub
2. Scanner expandido (Docker, linters, SECURITY, idiomas)
3. `categories.mjs` + `findings.mjs` — 12 categorias, achados tipados
4. `pipeline.mjs` — fases por papel (Scout → Hunters → Auditors → Planner → Verifier)
5. SQLite normalizado (findings, evidence, recommendations, runs)
6. Catálogos Next + Streamlit + Node API

### Bloco B — Interface V1 PRD
7. React + TypeScript (`apps/web`) — todas as seções do PRD
8. API estendida (`/api/analyze`, findings, patterns, backlog)
9. Relatório executivo + técnico + checklist + PR plan (template)

### Bloco C — Fase 3 local (v0.5) ✅

- `structure-analyzer.mjs` — arquivos grandes, imports, hotspots (Deep)
- `repo-validator.mjs` — `npm test/build/lint` controlado
- `health-trend.mjs` — tendência por repo no SQLite
- `apply-rules.mjs` — escreve `.cursor/rules/` no alvo
- Feedback útil/não útil em recomendações (SQLite + UI)

### Bloco D — ~~Fora do escopo~~ → entregue na Fase 5

### Bloco E — Fase 4 local (v0.6) ✅

- `git-analyzer.mjs` — commits, hotspots, inatividade (Deep)
- `portfolio.mjs` — visão multi-repo (`_PROJETOS`)
- `issues-export.mjs` — templates de issues GitHub
- `hook-generator.mjs` — pre-commit opcional (aviso health)

### Bloco F — Fase 5 cloud (v0.7) ✅

- `github-auth.mjs` — App JWT, installation token, PAT, webhook HMAC
- `github-api.mjs` — REST client
- `github-pr-checkout.mjs` — checkout HEAD do PR
- `pr-comment.mjs` — markdown + POST comment
- `github-webhook.mjs` — `pull_request` → scan + comment
- Guia: [GITHUB-APP.md](./GITHUB-APP.md)

### Bloco G — Fora do escopo (enterprise)
- Multi-tenant SaaS, sandbox irrestrito, auto-merge PRs

### Bloco H — Fase 6 polish (v0.8) ✅

- `trend-chart.mjs` + `HealthTrendChart.tsx` — gráfico SVG
- `feedback-stats.mjs` — resumo global e por análise
- `watch.mjs` — re-scan periódico CLI

### Bloco I — Fase 7 piloto (v0.9) ✅

- `apply-pilot.mjs` — SECURITY, dependabot, LICENSE, ESLint, editorconfig, .env.example
- `npm run apply-pilot` + API/UI
- Quadro-Negro: modularização `board-ui.js` + health **97/100**

### Bloco J — Fase 8 Cursor (v0.10) ✅

- `cursor-apply.mjs` — prompts + tasks `.cursor/max-stack/tasks/`
- `action-suggester.mjs` — busca por ação do usuário
- UI botão **Aplicar no Cursor** + campo **O que você quer fazer?**

### Bloco K — Fase 9 Verify (v0.11) ✅

- `verify-apply.mjs` — re-scan + validate-repo + verdict QA
- `task-registry.mjs` — listagem tasks + SQLite `cursor_tasks`
- `apply-batch` P1/P2 · UI **Verificar implementação**

### Bloco L — Fase 10 Contexto (v0.12) ✅

- `repo-context.mjs` — git remote, owner/repo, next actions
- UI **Repo ativo** + sync PR + portfolio highlight
- Checkbox validar scripts no scan

### Bloco M — Fase 11 Export (v0.13) ✅

- `report-export.mjs` — relatório executivo markdown
- `repo-compare.mjs` — comparar health/categorias/recs entre repos
- `npm run report` + UI exportar + comparar no portfolio

### Bloco N — Fase 12 Evolve (v0.14) ✅

- `evolve-repo.mjs` — scan → apply-pilot → verify → relatório
- `npm run evolve` + UI **Evoluir repo**
- `POST /api/portfolio/rescan` — re-scan multi-repo

### Bloco O — Fase 13 Alertas (v0.15) ✅

- `portfolio-alerts.mjs` — health baixo, regressão, scan stale
- `GET /api/portfolio/alerts`
- UI monitorar repo + painel de alertas

### Bloco P — Fase 14 Batch (v0.16) ✅

- `evolve-batch.mjs` — evolve até N repos com alertas críticos
- `issues-publish.mjs` — criar issues via GitHub REST API
- `npm run evolve-batch` + UI **Evoluir críticos**
- `POST /api/github/publish-issues` + UI **Publicar no GitHub**

### Bloco Q — Fase 15 Chart (v0.17) ✅

- `portfolio-chart.mjs` — barras de health + buckets (excelente/ok/atenção)
- `GET /api/portfolio/chart` · SVG opcional
- UI `PortfolioHealthChart` no portfolio

### Bloco R — Fase 16 Plan (v0.18) ✅

- `plan-package.mjs` — backlog + PR plan + checklist + gate QA (sem apply automático)
- `npm run plan` · `GET /api/analyses/:id/plan` · `POST /api/plan`
- UI **Exportar plano** (modo plan, revisão humana obrigatória)

### Bloco S — Fase 17 Watch portfolio (v0.19) ✅

- `portfolio-watch.mjs` — re-scan de repos com alertas (crítico/regressão/stale)
- `watch_log` SQLite · `npm run watch-portfolio`
- `POST /api/portfolio/watch` · `GET /api/portfolio/watch/log`
- UI **Monitorar portfolio** + log persistente

### Bloco T — Fase 18 History (v0.20) ✅

- `portfolio-history.mjs` — tendências de health por repo (SQLite)
- `GET /api/portfolio/history` · campo `history` em `GET /api/portfolio`
- `npm run portfolio-history` · UI painel com sparklines

### Bloco U — Fase 19 Digest (v0.21) ✅

- `portfolio-digest.mjs` — relatório executivo markdown do portfolio
- `npm run portfolio-digest` · `GET /api/portfolio/digest`
- UI **Exportar digest** no portfolio

## Métricas de sucesso V1 (PRD)

- [x] Repo local **ou** GitHub público
- [x] 12 categorias com score
- [x] Achados com evidência e tipo
- [x] Recomendações + backlog + checklist + PR plan
- [x] Histórico SQLite normalizado
- [x] UI React com histórico e deep/quick
- [x] Fase 3 local (structure, validate, trend, feedback, apply rules)
- [x] Fase 4 local (git, portfolio, issues export, pre-commit hook)
- [x] Fase 5 cloud (GitHub App, PR comments, webhook)
- [x] Fase 6 polish (trend chart, feedback stats, watch)
- [x] Fase 7 piloto (apply-pilot, Quadro-Negro 97/100)
- [x] Fase 8 Cursor (apply + suggest-action)
- [x] Fase 9 Verify (QA loop + batch + task registry)
- [x] Fase 10 Contexto (repo ativo + next actions + sync PR)
- [x] Fase 11 Export (relatório + comparar repos)
- [x] Fase 12 Evolve (scan + pilot + verify)
- [x] Fase 13 Alertas (portfolio alerts + watch UI)
- [x] Fase 14 Batch (evolve batch + publish issues GitHub)
- [x] Fase 15 Chart (gráfico health portfolio)
- [x] Fase 16 Plan (pacote plan + API/CLI/UI, apply sob autorização)
- [x] Fase 17 Watch portfolio (re-scan alertas + log SQLite + UI)
- [x] Fase 18 History (histórico multi-repo + sparklines na UI)
- [x] Fase 19 Digest (relatório executivo do portfolio)
