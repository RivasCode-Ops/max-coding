# Roadmap — max-coding (MAX)

**Atualizado:** 2026-05-30 · **Marco atual:** v0.24 (V1 PRD fechado)

Ver entregas por fase em [PRD-MAX-STACK-ALIGNMENT.md](./PRD-MAX-STACK-ALIGNMENT.md) e snapshot em [LEVANTAMENTO.md](./LEVANTAMENTO.md).

## Fase 0 — Fundação

- [x] README, CONTEXT, HANDOFF
- [x] PRD, architecture, pattern-engine, recommendation-model
- [x] Esqueleto `packages/*`
- [x] Repo no GitHub (RivasCode-Ops/max-coding)

## Fase 1 — MVP auditor

- [x] `repo-scanner` CLI
- [x] Catálogos + recommender
- [x] `npm run audit` + handoff.json
- [x] Mapeamento gstack + agent prompts
- [x] GitHub search API (Deep, token opcional)
- [x] Piloto Quadro-Negro (apply P1 sob autorização)

## Fase 2 — Agente + DX (entregue na V1)

- [x] `.cursor/rules` a partir do perfil
- [x] `apps/web` — UI React + TypeScript
- [x] Feedback loop (útil/não útil)
- [x] Histórico de scans + diff entre versões

## Fase 3 — Evolução contínua (entregue na V1)

- [x] Portfolio multi-repo (`_PROJETOS`)
- [x] Issues export + publicar GitHub
- [x] Watch portfolio, digest, heatmap, metas, evolve batch

## V2 / pós-v0.24 (planejar, não implementado)

- [ ] Notificações externas (e-mail, Slack, etc.)
- [ ] Serviço agendado (cron / daemon) para watch
- [ ] Apply genérico de backlog (além de pilot/cursor/evolve)
- [ ] Hooks git pre-commit opcionais (só aviso)
- [ ] AST / análise semântica profunda
- [ ] SaaS multi-tenant · auto-merge

## Convenção de versão

| Tag | Uso |
|-----|-----|
| `v0.24` | Marco V1 consolidado |
| `v0.25` / `v0.24.x` | Docs, correções pequenas |
| `v0.3.0` | Início de expansão V2 |
