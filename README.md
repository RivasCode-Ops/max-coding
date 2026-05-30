# MAX

**MAX** é um auditor técnico evolutivo de repositórios que detecta padrões, encontra lacunas e sugere melhorias contínuas para aumentar qualidade, segurança, performance e maturidade do software.

Repositório: [RivasCode-Ops/max-coding](https://github.com/RivasCode-Ops/max-coding)

MAX lê repositórios locais (GitHub remoto na V1.5), entende a stack, identifica padrões internos e externos, compara com referências do ecossistema e gera diagnósticos acionáveis com prioridade, evidência e impacto.

## Missão

Transformar repositórios em **diagnósticos acionáveis** e **planos de melhoria contínua**.

## Modos de análise

| Modo | Comando | Saída |
|------|---------|-------|
| **Quick Scan** | `npm run quick -- <path>` | Health score + sinais principais |
| **Deep Analysis** | `npm run deep -- <path>` | Quick + padrões OSS + recomendações + backlog |

```bash
npm run quick -- c:\_PROJETOS\Quadro-Negro
npm run deep -- c:\_PROJETOS\Quadro-Negro
```

Relatórios em `reports/<slug>/` (gitignored).

## Health score

Pontuação 0–100 por categorias: testes, CI/CD, DX, estrutura, documentação, stack, dependências e scripts. Grades A–D.

## Arquitetura (monorepo)

| Pacote | Papel |
|--------|-------|
| `packages/repo-scanner` | **Repo Scout** — perfil do repositório |
| `packages/pattern-search` | **Pattern Hunter** — catálogo de práticas OSS |
| `packages/recommender` | **Auditors + Patch Planner** — recomendações |
| `packages/core` | **Orchestrator** — Quick Scan e Deep Analysis |
| `apps/web` | UI React+TS (V2 — placeholder) |

## Papéis internos (gstack-inspired)

Orchestrator · Repo Scout · Pattern Hunter · Architecture Auditor · Security Auditor · Performance Reviewer · Patch Planner · QA Verifier

Ver [docs/gstack-mapping.md](./docs/gstack-mapping.md).

## Documentação

- [docs/COPY-PRODUTO.md](./docs/COPY-PRODUTO.md) — copy oficial e status V1
- [docs/prd.md](./docs/prd.md) — PRD
- [docs/data-model.md](./docs/data-model.md) — schema SQLite (V1.5)
- [docs/agents/](./docs/agents/) — prompts por papel

## Regras

- Não inventar problemas sem evidência (arquivo/sinal observável)
- Separar risco confirmado · hipótese · melhoria sugerida
- Modo **audit** (default): só relatório — não editar repo alvo sem autorização

## Status V1

- Quick Scan e Deep Analysis via CLI
- Health score por categorias
- Catálogo OSS vite-kanban + recomendações priorizadas
- Handoff multi-agente (`handoff.json`)
- SQLite e UI React: roadmap V1.5/V2

## Inspirações (não dependências)

- [gstack](https://github.com/garrytan/gstack) — papéis especializados
- [ECC Tools](https://ecc.tools/platforms) — guardrails portáveis
- RepoAnalyzer / Repo Doctor — health score e categorias
- [Guardrails](https://github.com/apps/guardrails) — qualidade contínua
