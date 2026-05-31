# HANDOFF — max-coding (MAX)

**Atualizado:** 2026-05-30  
**Versão:** v0.29 · **PRD:** fases 3–27 concluídas (V1 em v0.24, V2 em v0.29)

## Feito

- Scanner local/GitHub, 12 categorias, findings, pipeline por papéis, SQLite (`data/max.db`)
- CLI: `quick`, `deep`, `audit`, `plan`, `apply-plan`, `portfolio`, `evolve`, `evolve-batch`, digest/heatmap/history/goals/quality/scorecard
- Watch: `watch-portfolio`, `watch-schedule` (Windows), notificações (`notify-config`)
- UI React (`npm start` → http://localhost:3847) — portfolio, apply plan, qualidade agregada
- Catálogos OSS + GitHub Search opcional (Deep)
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
npm run apply-plan -- c:\_PROJETOS\Meu-Repo --approve rec-001 --verify
npm run portfolio -- c:\_PROJETOS
npm run portfolio-quality -- c:\_PROJETOS 12
npm run watch-schedule -- install c:\_PROJETOS 60
```

Audit no alvo: ler `reports/<slug>/handoff.json` e `report-*.md`

## Próximo (pós-v0.29)

1. Tag/release **`v0.29`** no GitHub (bloco V2 fechado)
2. Uso operacional em `c:\_PROJETOS` (watch agendado + metas + scorecard)
3. Novo roadmap V3 (E2E, CI, notificações ricas) — não há Fase 28 no PRD

## Modo Cursor

Workspace `max-coding`; ao implementar no repo **alvo**, ler `handoff.json` e usar `@docs/agents/qa-verifier.md` após cada item P1. Não apply automático em modo audit.
