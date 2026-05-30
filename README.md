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
```

## V1 PRD — status

| Requisito | Status |
|-----------|--------|
| Repo local + URL GitHub | ✅ clone em `data/repos/` |
| 12 categorias de saúde | ✅ |
| Achados tipados + evidência | ✅ confirmed / hypothesis / suggestion |
| 7 papéis (determinísticos) | ✅ pipeline por módulo |
| Padrões externos | ✅ catálogos vite / next / streamlit / node |
| SQLite normalizado | ✅ 9 entidades |
| UI React + TypeScript | ✅ `apps/web` |
| Backlog + checklist + PR plan | ✅ |
| GitHub App / PR comments | ❌ Fase 3 |

Ver [PRD-MAX-STACK-ALIGNMENT.md](./docs/PRD-MAX-STACK-ALIGNMENT.md).

## Arquitetura

`intake` → `scan-repo` → `pipeline` (papéis) → `findings` → SQLite + relatórios

## Dev

```bash
npm run dev:api          # API :3847
npm run dev:web          # Vite :5174 (proxy /api)
npm test
```
