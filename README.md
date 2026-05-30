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
npm run validate-repo -- c:\_PROJETOS\Meu-Repo   # test/build/lint controlado
```

## V1 PRD — status (v0.5)

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
| **Fase 3 local** | ✅ structure analyzer, validate-repo, health trend, feedback, apply rules |

### Fase 3 (local-first)

| Feature | CLI / API |
|---------|-----------|
| Análise estrutural (hotspots) | Deep scan automático |
| Validar repo (test/build/lint) | `npm run validate-repo -- <path>` · `POST /api/validate-repo` |
| Tendência de health | `GET /api/repositories/:slug/trend` |
| Feedback em recomendações | `POST /api/feedback` · botões na UI |
| Aplicar cursor rules | `POST /api/apply-rules` · botão na UI |

Ver [PRD-MAX-STACK-ALIGNMENT.md](./docs/PRD-MAX-STACK-ALIGNMENT.md).

## Arquitetura

`intake` → `scan-repo` → `pipeline` (papéis) → `findings` → SQLite + relatórios

## Dev

```bash
npm run dev:api          # API :3847
npm run dev:web          # Vite :5174 (proxy /api)
npm test
```
