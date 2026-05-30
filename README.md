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
```

Ver [GITHUB-APP.md](./docs/GITHUB-APP.md) para configurar PAT ou GitHub App.

## V1 PRD — status (v0.11)

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

Ver [PRD-MAX-STACK-ALIGNMENT.md](./docs/PRD-MAX-STACK-ALIGNMENT.md).

## Arquitetura

`intake` → `scan-repo` → `pipeline` (papéis) → `findings` → SQLite + relatórios

## Dev

```bash
npm run dev:api          # API :3847
npm run dev:web          # Vite :5174 (proxy /api)
npm test
```
