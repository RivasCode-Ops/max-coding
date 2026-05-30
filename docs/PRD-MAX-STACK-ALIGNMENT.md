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
