# Inspirações GitHub — Max Stack

> Índice geral: [workbench — ecossistema](https://github.com/RivasCode-Ops/workbench/blob/main/docs/GITHUB-INSPIRACOES-ECOSSISTEMA.md)  
> Orquestração: [agent-orchestration.md](agent-orchestration.md) · [gstack-mapping.md](gstack-mapping.md)

Max responde: *Como está o código do repo?* — inspirações focam em **auditoria, segurança e padrões**, não em produto financeiro ou pesquisa web.

---

## Orquestração e papéis (workbench + Cursor)

| Repo | Tag | O que aproveitar |
|------|-----|------------------|
| [garrytan/gstack](https://github.com/garrytan/gstack) | **Inspirar** | Skills `/review`, `/qa`, `/ship`, handoffs CEO → eng → QA |
| [anthropics/skills](https://github.com/anthropics/skills) | Inspirar | Formato SKILL.md portável (Cursor, Codex) |
| [marketplace/ecc-tools](https://github.com/marketplace/ecc-tools) | Inspirar | Guardrails de contexto (citado em COPY-PRODUTO) |

Max **não substitui** o workbench — complementa com scan automatizado após implementação.

---

## Segurança e saúde do repo (local-first)

| Repo | Tag | O que aproveitar |
|------|-----|------------------|
| [hematiteai/hematite](https://github.com/hematiteai/hematite) | **Adotar** | Pipeline local: secrets + deps + SAST, sem enviar código |
| [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) | Adotar | Detecção de segredos no CLI / CI |
| [google/osv-scanner](https://github.com/google/osv-scanner) | Adotar | Vulnerabilidades em dependências |
| [anchore/syft](https://github.com/anchore/syft) | Inspirar | SBOM (se expandir relatório) |
| [ast-grep/ast-grep](https://github.com/ast-grep/ast-grep) | Inspirar | SAST por padrões (via hematite) |

---

## Pattern hunter (produtos tipo Kanban)

| Repo | Tag | Uso no Max |
|------|-----|------------|
| [kanriapp/kanri](https://github.com/kanriapp/kanri) | Inspirar | Offline, tags, export |
| [mdiener21/kanvana](https://github.com/mdiener21/kanvana) | Inspirar | Swimlanes, activity log |
| [wekan/wekan](https://github.com/wekan/wekan) | Inspirar | Automação tipo IFTTT |

Ver também: [pattern-engine.md](pattern-engine.md), [docs/agents/pattern-hunter.md](agents/pattern-hunter.md).

---

## Não adotar no Max

| Repo | Motivo |
|------|--------|
| Calculadoras FIRE | Camada FREEDOM |
| Vane / Perplexica | Camada Cortana |
| firefly-iii | Escopo financeiro, não código |

---

## Próximos passos sugeridos

1. Documentar no README um comando opcional `hematite` / `gitleaks` pós-scan.  
2. Mapear 2–3 skills do gstack como atalhos no fluxo Max → workbench handoff.  
3. Manter comparador de repos externo sem fundir com Cortana.
