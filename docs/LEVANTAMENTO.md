# Max Stack — levantamento: o que já tem e o que falta

**Atualizado:** 2026-05-30 · **Versão produto:** v0.29 · **Repo:** [RivasCode-Ops/max-coding](https://github.com/RivasCode-Ops/max-coding)

Documento de referência única. Para detalhe de cada fase, ver [PRD-MAX-STACK-ALIGNMENT.md](./PRD-MAX-STACK-ALIGNMENT.md) e [README.md](../README.md).

---

## Resumo executivo

| Dimensão | Situação |
|----------|----------|
| **PRD V1 + V2 (fases 3–27)** | ✅ Fechado — marco V1 em v0.24; bloco V2 (23–27) em v0.29 |
| **Produto local-first** | ✅ Scanner, SQLite, UI React, portfolio, GitHub opcional |
| **Apply no repo alvo** | ⚠️ Só com autorização (`apply-pilot`, `apply-plan`, Cursor, `evolve`) — nunca automático em audit |
| **7 agentes LLM (gstack)** | ⚠️ Papéis são **módulos determinísticos** + prompts Cursor, não 7 chamadas de modelo |
| **Roadmap numérico** | ✅ Encerrado em Fase 27 — próximo trabalho é operação ou novo roadmap |

---

## O que já tem (por área)

### Núcleo técnico

| Item | Status | Onde |
|------|--------|------|
| Intake local + URL GitHub | ✅ | `packages/core/lib/intake.mjs` |
| Scanner + perfil | ✅ | `packages/repo-scanner` |
| 12 categorias de health | ✅ | `packages/core/lib/categories.mjs` |
| Achados tipados + evidência | ✅ | `packages/core/lib/findings.mjs` |
| Pipeline por papéis (Scout → … → Verifier) | ✅ | `packages/core/lib/pipeline.mjs` |
| Quick / Deep / Audit CLI | ✅ | `run-quick`, `run-audit`, `analyze` |
| SQLite normalizado | ✅ | `data/max.db` — repos, analyses, findings, feedback, watch_log, etc. |
| Catálogos OSS (vite, next, streamlit, node) | ✅ | `packages/core/catalogs/` |
| GitHub Search (Deep, opcional) | ✅ | `GITHUB_TOKEN` / App |
| Diff entre scans | ✅ | `scan-diff.mjs` |

### Repo único (análise + evolução)

| Item | Status | CLI / UI |
|------|--------|----------|
| Health + categorias + recomendações | ✅ | Quick / Deep |
| Relatório executivo markdown | ✅ | `npm run report` · Exportar relatório |
| Modo plan (backlog + PR plan + QA) | ✅ | `npm run plan` · Exportar plano |
| Apply plan (aprovar → Cursor → verify) | ✅ | `npm run apply-plan` · `PlanApplyPanel` |
| Sinais de qualidade (16 checks) | ✅ | `npm run quality-signals` · painel na UI |
| Validar test/build/lint | ✅ | `validate-repo` |
| Tendência de health (gráfico) | ✅ | `HealthTrendChart` |
| Apply rules / pilot P1-P2 | ✅ | UI + `apply-pilot` |
| Cursor: aplicar rec + tasks | ✅ | `cursor-apply`, batch P1/P2 |
| Verificar implementação | ✅ | `verify` |
| Busca por ação do usuário | ✅ | Campo na UI |
| Comparar 2 repos | ✅ | Portfolio + comparar |
| Evoluir (scan → pilot → verify) | ✅ | `npm run evolve` |
| Watch repo (re-scan UI) | ✅ | Checkbox monitorar |
| Feedback útil/não útil | ✅ | Por recomendação |
| Git: histórico, hotspots | ✅ | Deep |
| Issues markdown + publicar GitHub | ✅ | Export + API publish |
| PR comment + webhook | ✅ | Fase 5 cloud |

### Portfolio (`_PROJETOS` ou raiz configurável)

| Item | Status | CLI / UI |
|------|--------|----------|
| Descoberta multi-repo + merge SQLite | ✅ | `portfolio` |
| Gráfico de barras (health) | ✅ | Fase 15 |
| Alertas (crítico, regressão, stale) | ✅ | Fase 13 |
| Evolve batch (críticos) | ✅ | `evolve-batch` |
| Watch portfolio + log SQLite | ✅ | Fase 17 |
| Histórico multi-repo (sparklines) | ✅ | Fase 18 |
| Digest executivo markdown | ✅ | Fase 19 |
| Heatmap 12 categorias × repos | ✅ | Fase 20 |
| Metas mín/alvo de health | ✅ | Fase 22 |
| Notificações (arquivo / webhook) | ✅ | Fase 23 · `notify-config` |
| Agendamento watch (Windows) | ✅ | Fase 24 · `watch-schedule` |
| Scorecard ZIP (digest + SVGs) | ✅ | Fase 25 · `portfolio-scorecard` |
| Qualidade agregada no portfolio | ✅ | Fase 27 · `portfolio-quality` |
| Re-scan portfolio | ✅ | UI / API |

### Qualidade e operação

| Item | Status |
|------|--------|
| `npm run validar` (self-scan + fases 3–27) | ✅ |
| `npm test` (27 suites de teste) | ✅ |
| UI React build (`apps/web`) | ✅ |
| API local `:3847` | ✅ |
| Guia GitHub App/PAT | ✅ [GITHUB-APP.md](./GITHUB-APP.md) |

### Comandos CLI disponíveis (índice)

```
scan · quick · deep · audit · start · validar · validate-repo
portfolio · portfolio-history · portfolio-digest · portfolio-heatmap · portfolio-goals
portfolio-scorecard · portfolio-quality
watch · watch-portfolio · watch-schedule
notify-config · apply-plan · apply-pilot · verify · report · plan · evolve · evolve-batch
pr-comment · quality-signals
```

---

## Fases entregues (3 → 27)

| Fase | v | Tema |
|------|---|------|
| 3 | 0.5 | Structure, validate-repo, trend, feedback, apply rules |
| 4 | 0.6 | Git, portfolio, issues export, pre-commit hook |
| 5 | 0.7 | GitHub App, PR comments, webhook |
| 6 | 0.8 | Trend chart, feedback stats, watch CLI |
| 7 | 0.9 | Apply-pilot, piloto Quadro-Negro |
| 8 | 0.10 | Cursor apply + suggest-action |
| 9 | 0.11 | Verify loop, task registry, apply batch |
| 10 | 0.12 | Repo contexto, sync PR |
| 11 | 0.13 | Export relatório, comparar repos |
| 12 | 0.14 | Evolve workflow |
| 13 | 0.15 | Alertas portfolio + watch UI |
| 14 | 0.16 | Evolve batch + publish issues |
| 15 | 0.17 | Gráfico health portfolio |
| 16 | 0.18 | Plan mode (pacote autorizado) |
| 17 | 0.19 | Watch portfolio + log |
| 18 | 0.20 | Histórico multi-repo |
| 19 | 0.21 | Digest portfolio |
| 20 | 0.22 | Heatmap categorias |
| 21 | 0.23 | Quality signals |
| 22 | 0.24 | Metas de health (**marco V1**) |
| 23 | 0.25 | Notificações watch (JSONL / webhook) |
| 24 | 0.26 | Task Scheduler Windows + `--once` |
| 25 | 0.27 | Scorecard ZIP |
| 26 | 0.28 | Apply plan na UI |
| 27 | 0.29 | Qualidade agregada no portfolio |

**Não há Fase 28+ definida no PRD** — bloco V2 encerrado; próximo trabalho é operação ou novo roadmap.

---

## O que falta (lacunas reais)

### Produto / funcional

| Lacuna | Prioridade | Notas |
|--------|------------|--------|
| **Fase 28+ no PRD** | — | Roadmap numérico encerrado em v0.29 |
| **7 agentes como LLM separados** | Baixa (decisão) | Por design: pipeline local, não gstack plug-and-play |
| **Apply automático no repo alvo** | Fora escopo | Regra do produto: audit default, apply só com autorização |
| **Notificações email/Slack/desktop** | Baixa V3 | Fase 23 cobre arquivo + webhook HTTP |
| **Agendamento Linux/macOS** | Baixa | Fase 24 é Windows (`schtasks`); outros OS manual/cron |
| **Heatmap no digest** | Baixa | Digest tem metas/alertas; heatmap na UI/API separada |
| **AST / análise profunda de código** | V3+ | PRD original marca fora de escopo V1/V2 |
| **Multi-tenant SaaS** | Fora escopo | Bloco G enterprise |
| **Auto-merge PRs** | Fora escopo | Bloco G |

### Operação / uso real (não é código faltando)

| Lacuna | Notas |
|--------|--------|
| Rodar `evolve-batch` / `watch-portfolio` em produção em `c:\_PROJETOS` | Ferramentas existem; falta rotina operacional |
| Instalar `watch-schedule` e testar notificações em regressão real | Fase 23–24 prontas; falta config em produção |
| GitHub App/PAT em todos os repos | Configuração manual ([GITHUB-APP.md](./GITHUB-APP.md)) |
| Piloto contínuo Quadro-Negro e outros críticos | Evolve/verify/apply-plan disponíveis; execução no **repo alvo** |
| Feedback de usuários em escala | Mecanismo existe; volume depende do uso |

### Documentação e DX

| Item | Status |
|------|--------|
| `HANDOFF.md`, `roadmap.md`, `prd.md` | ✅ Alinhados na v0.24; atualizar marco v0.29 se necessário |
| GitHub Release v0.24 / v0.29 | ⚠️ Tags podem existir; releases dependem de `gh auth` |
| E2E UI (Playwright) | ❌ Não implementado |
| CI GitHub Actions cobrindo `npm run validar` | ⚠️ Verificar workflow em PRs |

---

## Fora de escopo (explícito no PRD)

- Multi-tenant SaaS  
- Sandbox irrestrito / execução de comandos sem limite  
- Auto-merge de PRs  
- Edição agressiva automática no repo alvo  

---

## Sugestões de próximo trabalho

### Higiene (sem feature nova)

1. Tag anotada **`v0.29`** + GitHub Release com notas V2 (fases 23–27).  
2. Reiniciar `npm start` para API **0.29.0** na UI.  
3. Rotina operacional em `c:\_PROJETOS` (watch agendado + metas + digest semanal).

### V3 — candidatos (não planejados no PRD)

| Ideia | Descrição |
|-------|-----------|
| **Agendamento cross-platform** | cron/systemd além de Windows |
| **Notificações ricas** | Slack/email/desktop |
| **E2E UI** | Playwright sobre fluxos portfolio + apply-plan |
| **CI no max-coding** | `npm run validar` em todo PR |

### Uso recomendado agora (sem codar)

```bash
npm run validar
npm start
npm run portfolio-quality -- c:\_PROJETOS 12
npm run portfolio-scorecard -- c:\_PROJETOS 10
npm run watch-schedule -- install c:\_PROJETOS 60
npm run portfolio-digest -- c:\_PROJETOS
```

---

## Mapa mental

```mermaid
flowchart TB
  subgraph feito [Entregue V1 + V2]
    A[Scan Quick/Deep]
    B[SQLite + UI React]
    C[Portfolio 13-22]
    D[GitHub opcional]
    E[Evolve Verify Cursor Apply-plan]
    F[V2: Notify Schedule Scorecard Quality]
  end
  subgraph falta_prod [Falta produto]
    G[V3 roadmap]
    H[Notificações email/Slack]
  end
  subgraph falta_ops [Falta operação]
    I[Rotina _PROJETOS]
    J[GitHub auth produção]
  end
  A --> B
  B --> C
  B --> D
  B --> E
  C --> F
```

---

## Referências

- [PRD-MAX-STACK-ALIGNMENT.md](./PRD-MAX-STACK-ALIGNMENT.md) — blocos A–AC  
- [README.md](../README.md) — comandos e tabelas por fase  
- [COPY-PRODUTO.md](./COPY-PRODUTO.md) — capacidades 1–10  
- [gstack-mapping.md](./gstack-mapping.md) — papéis vs pipeline  
