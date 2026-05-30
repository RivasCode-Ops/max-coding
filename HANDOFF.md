# HANDOFF — max-coding (MAX)

**Atualizado:** 2026-05-30  
**Versão:** v0.24 · **PRD V1:** fases 3–22 concluídas

## Feito (V1 consolidada)

- Scanner local/GitHub, 12 categorias, findings, pipeline por papéis, SQLite (`data/max.db`)
- CLI: `quick`, `deep`, `audit`, `plan`, `portfolio`, `evolve`, `evolve-batch`, `watch-portfolio`, digest/heatmap/history/goals
- UI React (`npm start` → http://localhost:3847)
- Catálogos OSS (vite, next, streamlit, node) + GitHub Search opcional (Deep)
- Portfolio multi-repo, alertas, gráficos, metas de health, qualidade (16 sinais)
- Modos: **audit** (default, só relatório) · **plan** (backlog + PR plan) · apply só com autorização

Referência única: [docs/LEVANTAMENTO.md](./docs/LEVANTAMENTO.md) · detalhe por fase: [docs/PRD-MAX-STACK-ALIGNMENT.md](./docs/PRD-MAX-STACK-ALIGNMENT.md)

## Comandos principais

```bash
cd c:\_PROJETOS\max-coding
npm run validar
npm start
npm run quick -- c:\_PROJETOS\Meu-Repo
npm run audit -- c:\_PROJETOS\Quadro-Negro
npm run plan -- c:\_PROJETOS\Meu-Repo
npm run portfolio -- c:\_PROJETOS
```

Audit no alvo: ler `reports/<slug>/handoff.json` e `report-*.md`

## Próximo (pós-v0.24, não bloqueia o marco)

1. Roadmap V2 (notificações externas, cron, apply genérico de backlog)
2. Uso operacional estável em `c:\_PROJETOS` + `gh auth` em produção
3. Manter docs alinhados a cada marco (`v0.25` = docs/fixes menores)

## Modo Cursor

Workspace `max-coding`; ao implementar no repo **alvo**, ler `handoff.json` e usar `@docs/agents/qa-verifier.md` após cada item P1. Não apply automático em modo audit.
