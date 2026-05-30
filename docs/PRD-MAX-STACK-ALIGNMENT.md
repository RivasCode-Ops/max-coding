# Max Stack — alinhamento PRD × estado atual × plano

**Produto:** Max Stack · **Repositório:** [max-coding](https://github.com/RivasCode-Ops/max-coding)

## Sua demanda vs minha leitura

| Ponto do PRD | Sua intenção | Minha coordenação |
|--------------|--------------|-------------------|
| Nome **Max Stack** | Posicionamento do produto | ✅ Adotar na UI/docs; repo `max-coding` permanece |
| V1 completa | Tudo do PRD funcional | ✅ Escopo V1 abaixo; Fase 3 (GitHub App, PR comments) fica **fora** como no PRD |
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

### Bloco D — Fora do escopo (Fase 3 PRD cloud)
- GitHub App, comentários em PR, execução sandbox irrestrita, multi-tenant

## Métricas de sucesso V1 (PRD)

- [x] Repo local **ou** GitHub público
- [x] 12 categorias com score
- [x] Achados com evidência e tipo
- [x] Recomendações + backlog + checklist + PR plan
- [x] Histórico SQLite normalizado
- [x] UI React com histórico e deep/quick
- [x] Fase 3 local (structure, validate, trend, feedback, apply rules)
