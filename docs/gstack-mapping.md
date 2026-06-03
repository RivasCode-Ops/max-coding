# gstack → max-coding (mapeamento de papéis)

Referência comportamental: [garrytan/gstack](https://github.com/garrytan/gstack) — papéis especializados, workflow por fases e handoffs.  
**Não** copiamos tools/skills do gstack literalmente; adaptamos a **auditoria evolutiva de repositórios** no Cursor.

## Princípio

| gstack (idea) | max-coding (adaptação) |
|---------------|------------------------|
| Agente único genérico | Pipeline multi-papel com handoff explícito |
| CEO / Eng Manager | **Orchestrator** — define fase, modo (audit/plan/apply) |
| Product / Design | **Pattern Hunter** + catálogo OSS (referências UX/arquitetura) |
| QA | **QA Verifier** — valida recomendações com evidência + testes |
| Doc Engineer | **Report Writer** — Markdown/JSON em `reports/` |
| Release Manager | **Patch Planner** — backlog priorizado, não deploy cego |

## Papéis max-coding

| Papel | Módulo | Entrada | Saída | Inspiração gstack |
|-------|--------|---------|-------|-------------------|
| **Orchestrator** | `packages/core` | path repo, modo | `handoff.json`, fase atual | Eng Manager / workflow |
| **Repo Scout** | `repo-scanner` | path | `profile.json` | codebase discovery |
| **Pattern Hunter** | `pattern-search` | profile | `references.json` | research / benchmarks |
| **Architecture Auditor** | `recommender` | profile + refs | recs `arquitetura`, `qualidade` | tech lead review |
| **Performance Reviewer** | `recommender` | profile | recs `performance`, `dx` | perf / DX focus |
| **Security & Guardrail Auditor** | `recommender` + rules | profile | recs `seguranca`, modo execução | safety rails |
| **Patch Planner** | `recommender` | recommendations | `backlog.json`, `report.md` | sprint / release planning |
| **QA Verifier** | manual + `validar`/tests alvo | backlog item | aceite / rejeição | QA gate |

## O que NÃO importar do gstack

- Dependência de Claude Code como runtime (Cursor é first-class)
- Papéis de produto comercial (CEO) sem repo under analysis
- Execução automática de patch sem guardrail
- Stack fixa web-only — max-coding é agnóstico (Vite, Next, Streamlit, Python)

## Uso no Cursor

1. Abrir repo **max-coding** ou repo alvo + apontar scan
2. Regras `.cursor/rules/` + `AGENTS.md` (ver `00-core-max-stack.mdc`)
3. Invocar papel: `@docs/agents/repo-scout.md` etc. ou rodar CLI `npm run audit -- <path>`
4. Ler `reports/<slug>/handoff.json` antes de implementar no repo alvo

## Compatibilidade Claude Code / Codex / Gemini

Mesmos artefatos (`profile.json`, `recommendations.json`, `handoff.json`) servem qualquer CLI que leia arquivos — gstack como **modelo de processo**, não vendor lock-in.
