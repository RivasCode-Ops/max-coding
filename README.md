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
```

Ver [GITHUB-APP.md](./docs/GITHUB-APP.md) para configurar PAT ou GitHub App.

## V1 PRD — status (v0.17)

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

Ver [PRD-MAX-STACK-ALIGNMENT.md](./docs/PRD-MAX-STACK-ALIGNMENT.md).

## Arquitetura

`intake` → `scan-repo` → `pipeline` (papéis) → `findings` → SQLite + relatórios

## Dev

```bash
npm run dev:api          # API :3847
npm run dev:web          # Vite :5174 (proxy /api)
npm test
```
