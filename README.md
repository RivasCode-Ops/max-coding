# Max Stack

**Max Stack** é um sistema local-first de auditoria, análise estrutural e evolução contínua de repositórios.

Repositório: [RivasCode-Ops/max-coding](https://github.com/RivasCode-Ops/max-coding)

## Uso rápido

```bash
npm install
npm run validar                              # checagem completa
npm start                                    # http://localhost:3847 (React UI)
npm run quick -- c:\_PROJETOS\Meu-Repo
npm run quick -- https://github.com/org/repo
npm run deep -- c:\_PROJETOS\Quadro-Negro
npm run validate-repo -- c:\_PROJETOS\Meu-Repo
npm run portfolio -- c:\_PROJETOS
npm run pr-comment -- RivasCode-Ops/Quadro-Negro 1   # comentário em PR (GitHub)
npm run apply-pilot -- c:\_PROJETOS\Quadro-Negro  # aplicar P1/P2
npm run verify -- c:\_PROJETOS\Quadro-Negro       # verificar pós-implementação
npm run report -- c:\_PROJETOS\Quadro-Negro      # exportar relatório markdown
npm run evolve -- c:\_PROJETOS\Meu-Repo          # evoluir (scan+pilot+verify)
npm run evolve -- c:\_PROJETOS\Meu-Repo --dry-run # preview evolução
npm run evolve-batch -- c:\_PROJETOS --dry-run  # preview evolve críticos do portfolio
npm run plan -- c:\_PROJETOS\Meu-Repo           # pacote plan (backlog + PR plan + QA)
npm run watch-portfolio -- c:\_PROJETOS 1800   # re-scan repos com alertas
npm run portfolio-history -- c:\_PROJETOS      # tendências de health no portfolio
npm run portfolio-digest -- c:\_PROJETOS       # relatório executivo do portfolio
npm run portfolio-heatmap -- c:\_PROJETOS 8    # heatmap 12 categorias × repos
npm run quality-signals -- c:\_PROJETOS\Meu-Repo # checklist testes, CI, docs, DX
npm run portfolio-goals                    # ver metas de health
npm run portfolio-goals -- set 75 90     # meta mín 75 · alvo 90
npm run notify-config                    # ver config de notificações
npm run notify-config -- test            # teste arquivo/webhook
npm run watch-schedule                   # status da tarefa Windows
npm run watch-schedule -- install c:\_PROJETOS 60
npm run portfolio-scorecard -- c:\_PROJETOS 10
npm run apply-plan -- c:\_PROJETOS\Meu-Repo --approve rec-001,rec-002 --verify
```

Ver [GITHUB-APP.md](./docs/GITHUB-APP.md) para configurar PAT ou GitHub App.

## V1 PRD — status (v0.28)

Snapshot consolidado: [docs/LEVANTAMENTO.md](./docs/LEVANTAMENTO.md)

| Requisito | Status |
|-----------|--------|
| Repo local + URL GitHub | ✅ clone em `data/repos/` |
| 12 categorias de saúde | ✅ |
| Achados tipados + evidência | ✅ confirmed / hypothesis / suggestion |
| 7 papéis (determinísticos) | ✅ pipeline por módulo |
| Padrões externos | ✅ catálogos vite / next / streamlit / node |
| SQLite normalizado | ✅ 9 entidades + feedback |
| UI React + TypeScript | ✅ `apps/web` |
| Backlog + checklist + PR plan | ✅ |
| GitHub Search API | ✅ Deep (opcional `GITHUB_TOKEN`) |
| Diff histórico | ✅ entre scans do mesmo repo |
| Gerador `.cursor/rules` | ✅ copiar ou aplicar na UI |
| **Fase 3 local** | ✅ structure, validate-repo, health trend, feedback, apply rules |
| **Fase 4 local** | ✅ git analyzer, portfolio, issues export, pre-commit hook |
| **Fase 5 cloud** | ✅ GitHub App/PAT, PR comments, webhook |
| **Fase 6 polish** | ✅ trend SVG, feedback stats, watch mode |
| **Fase 7 piloto** | ✅ apply-pilot P1/P2, Quadro-Negro 97/100 |
| **Fase 8 Cursor** | ✅ aplicar recomendações + busca por ação na UI |
| **Fase 9 Verify** | ✅ verificar implementação, tasks registry, apply batch P1/P2 |
| **Fase 10 Contexto** | ✅ repo ativo, sync PR, portfolio highlight, próximos passos |
| **Fase 11 Export** | ✅ relatório markdown + comparar repos no portfolio |
| **Fase 12 Evolve** | ✅ scan + pilot + verify em um fluxo |
| **Fase 13 Alertas** | ✅ alertas portfolio + monitorar repo na UI |
| **Fase 14 Batch** | ✅ evolve batch críticos + publicar issues no GitHub |
| **Fase 15 Chart** | ✅ gráfico de health do portfolio na UI |
| **Fase 16 Plan** | ✅ pacote plan (backlog + PR plan + checklist + QA gate) |
| **Fase 17 Watch** | ✅ monitorar portfolio + log SQLite + CLI/API |
| **Fase 18 History** | ✅ histórico multi-repo + sparklines na UI |
| **Fase 19 Digest** | ✅ relatório executivo exportável do portfolio |
| **Fase 20 Heatmap** | ✅ matriz 12 categorias × repos na UI |
| **Fase 21 Quality** | ✅ sinais de qualidade (testes, CI, docs, DX, segurança) |
| **Fase 22 Goals** | ✅ metas mín/alvo de health + alertas no portfolio |

### Fase 3 (local-first)

| Feature | CLI / API |
|---------|-----------|
| Análise estrutural (hotspots) | Deep scan automático |
| Validar repo (test/build/lint) | `npm run validate-repo -- <path>` · `POST /api/validate-repo` |
| Tendência de health | `GET /api/repositories/:slug/trend` |
| Feedback em recomendações | `POST /api/feedback` · botões na UI |
| Aplicar cursor rules | `POST /api/apply-rules` · botão na UI |

### Fase 4 (evolução contínua)

| Feature | CLI / API |
|---------|-----------|
| Análise git (90d) | Deep scan automático |
| Portfolio multi-repo | `npm run portfolio -- c:\_PROJETOS` · `GET /api/portfolio` |
| Export issues GitHub | `GET /api/analyses/:id/issues` · copiar na UI |
| Pre-commit hook (aviso) | `POST /api/install-hook` · botão na UI |

### Fase 5 (GitHub cloud)

| Feature | CLI / API |
|---------|-----------|
| GitHub App auth (JWT + installation) | `.env` — ver [GITHUB-APP.md](./docs/GITHUB-APP.md) |
| Comentário em PR | `npm run pr-comment -- owner/repo 123` · `POST /api/github/pr-comment` |
| Webhook pull_request | `POST /api/github/webhook` |

### Fase 6 (polish)

| Feature | CLI / API |
|---------|-----------|
| Gráfico SVG de trend | UI + `GET /api/repositories/:slug/trend/chart` |
| Stats de feedback | `GET /api/feedback/summary` · badge na UI |
| Watch mode (re-scan) | `npm run watch -- <path> [segundos]` |

### Fase 7 (piloto apply)

| Feature | CLI / API |
|---------|-----------|
| Aplicar P1/P2 automático | `npm run apply-pilot -- <path>` · `POST /api/apply-pilot` |
| Piloto Quadro-Negro | 88 → **97/100** (+9 pts) |

### Fase 8 (Cursor Agent)

| Feature | CLI / API |
|---------|-----------|
| Aplicar recomendação no Cursor | Botão na UI · `POST /api/cursor/apply` |
| Buscar melhor opção por ação | Campo na UI · `POST /api/suggest-action` |
| Tasks em `.cursor/max-stack/tasks/` | Prompt pronto para `@arquivo` no Agent |

### Fase 9 (Verify loop)

| Feature | CLI / API |
|---------|-----------|
| Verificar pós-implementação | `npm run verify -- <path>` · `POST /api/verify` |
| Listar tasks Cursor | `GET /api/cursor/tasks?path=` |
| Aplicar batch P1/P2 | Botão na UI · `POST /api/cursor/apply-batch` |
| Registro SQLite `cursor_tasks` | Histórico de applies + verdict QA |

### Fase 10 (contexto unificado)

| Feature | CLI / API |
|---------|-----------|
| Contexto do repo ativo | `GET /api/repo-context?path=` |
| Próximos passos sugeridos | Painel na UI após scan |
| Sync owner/repo → PR | Automático via git remote ou URL GitHub |
| Portfolio highlight | Linha destacada do repo ativo |
| Validar no scan | Checkbox na UI |

### Fase 11 (export & compare)

| Feature | CLI / API |
|---------|-----------|
| Relatório executivo markdown | `npm run report -- <path>` · `GET /api/analyses/:id/report` |
| Comparar dois repos | `POST /api/compare` · UI no portfolio |
| Copiar relatório / comparação | Botões na UI |

### Fase 12 (evolve workflow)

| Feature | CLI / API |
|---------|-----------|
| Evoluir repo (scan→pilot→verify) | `npm run evolve -- <path>` · `POST /api/evolve` |
| Preview evolução | `--dry-run` · botão **Preview evolução** |
| Re-scan portfolio | `POST /api/portfolio/rescan` · botão na UI |

### Fase 13 (alertas & watch UI)

| Feature | CLI / API |
|---------|-----------|
| Alertas de portfolio | `GET /api/portfolio/alerts?root=` |
| Monitorar repo | Checkbox na UI (re-scan automático) |
| Ação rápida em alerta | Botões Scan / Evoluir |

### Fase 14 (batch evolve + issues API)

| Feature | CLI / API |
|---------|-----------|
| Evoluir críticos em lote | `npm run evolve-batch -- [root] [--dry-run]` · `POST /api/portfolio/evolve-batch` |
| Publicar issues no GitHub | `POST /api/github/publish-issues` · botões na UI |
| Preview batch / issues | `--dry-run` · **Preview batch** / **Preview publicar** |

### Fase 15 (portfolio chart)

| Feature | CLI / API |
|---------|-----------|
| Gráfico de barras por repo | `GET /api/portfolio` (campo `chart`) |
| SVG exportável | `GET /api/portfolio/chart?format=svg` |

### Fase 16 (plan mode)

| Feature | CLI / API |
|---------|-----------|
| Pacote plan autorizado | `npm run plan -- <path> [analysisId]` |
| JSON + markdown | `GET /api/analyses/:id/plan` · `?format=md` |
| Gerar plano fresh | `POST /api/plan` · botão **Exportar plano** na UI |

### Fase 17 (watch portfolio)

| Feature | CLI / API |
|---------|-----------|
| Re-scan repos com alertas | `npm run watch-portfolio -- [root] [seg]` |
| Tick manual / preview | `POST /api/portfolio/watch` · `dryRun: true` |
| Log persistente | `GET /api/portfolio/watch/log` · UI **Monitorar portfolio** |

### Fase 18 (portfolio history)

| Feature | CLI / API |
|---------|-----------|
| Tendências por repo | `npm run portfolio-history -- [root]` |
| Histórico agregado | `GET /api/portfolio/history` · campo `history` no portfolio |
| Sparklines na UI | Painel **Histórico multi-repo** |

### Fase 19 (portfolio digest)

| Feature | CLI / API |
|---------|-----------|
| Relatório executivo | `npm run portfolio-digest -- [root]` |
| Markdown JSON | `GET /api/portfolio/digest` · `?format=md` |
| Copiar na UI | Botão **Exportar digest** |

### Fase 20 (category heatmap)

| Feature | CLI / API |
|---------|-----------|
| Matriz categorias × repos | `npm run portfolio-heatmap -- [root] [max]` |
| API + SVG | `GET /api/portfolio/heatmap` · `?format=svg` |
| UI | Tabela **Heatmap de categorias** no portfolio |

### Fase 21 (quality signals)

| Feature | CLI / API |
|---------|-----------|
| Checklist de qualidade | `npm run quality-signals -- <path>` |
| Por análise | campo `qualitySignals` no scan · `GET /api/quality-signals?path=` |
| UI + relatório | Painel **Sinais de qualidade** · exportar relatório |

### Fase 22 (portfolio goals)

| Feature | CLI / API |
|---------|-----------|
| Metas mín/alvo | `npm run portfolio-goals` · `npm run portfolio-goals -- set 75 90` |
| Persistência | `GET/POST /api/portfolio/goals` |
| Alertas + progresso | integrado em alertas/digest · UI **Metas de health** |

### Fase 23 (notifications)

| Feature | CLI / API |
|---------|-----------|
| Arquivo JSONL + webhook | `npm run notify-config` · `MAX_NOTIFY_FILE` · `MAX_NOTIFY_WEBHOOK_URL` |
| Watch portfolio | dispara em regressão (Δ≤−5), crítico ou falha de scan |
| API + UI | `GET/POST /api/notifications/config` · **Notificações** no portfolio |

### Fase 24 (watch schedule)

| Feature | CLI / API |
|---------|-----------|
| Task Scheduler Windows | `npm run watch-schedule` · `install` / `remove` |
| Tick único | `npm run watch-portfolio -- <root> --once` |
| API + UI | `GET /api/watch-schedule/status` · **Agendamento watch** |

### Fase 25 (scorecard ZIP)

| Feature | CLI / API |
|---------|-----------|
| Bundle exportável | `npm run portfolio-scorecard -- [root] [max]` |
| Conteúdo | digest.md · chart.svg · heatmap.svg · scorecards/*.md |
| Download | `GET /api/portfolio/scorecard` · UI **Scorecard ZIP** |

### Fase 26 (apply plan)

| Feature | CLI / API |
|---------|-----------|
| Fluxo autorizado | plan → aprovar itens → Cursor tasks → verify |
| CLI | `npm run apply-plan -- <path> --approve id1,id2 [--verify]` |
| API + UI | `GET .../plan-apply` · `POST /api/plan/apply` · **Aplicar plano** |

Ver [PRD-MAX-STACK-ALIGNMENT.md](./docs/PRD-MAX-STACK-ALIGNMENT.md).

## Arquitetura

`intake` → `scan-repo` → `pipeline` (papéis) → `findings` → SQLite + relatórios

## Dev

```bash
npm run dev:api          # API :3847
npm run dev:web          # Vite :5174 (proxy /api)
npm test
```
