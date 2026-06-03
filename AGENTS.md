# AGENTS.md — Max Stack

Orientação para agentes de código neste repositório (`max-coding`).

**Produto:** Max Stack · **Repo:** [RivasCode-Ops/max-coding](https://github.com/RivasCode-Ops/max-coding)

## Visão geral

| Item | Valor |
|------|--------|
| Stack | Node.js ESM, SQLite, React + TypeScript (Vite), monorepo `packages/*` + `apps/web` |
| Idioma | Português nas respostas; código e nomes técnicos em inglês quando já existirem |
| Runtime local | API + UI em `http://127.0.0.1:3847` (`npm start`) |

## Leitura por tarefa

| Situação | Documento |
|----------|-----------|
| Sempre | Este arquivo + `.cursor/rules/00-core-max-stack.mdc` |
| Planejar antes de codar | `.cursor/rules/02-planning-first.mdc` |
| Papéis do pipeline | `docs/agent-orchestration.md`, `docs/gstack-mapping.md` |
| Prompt por papel | `docs/agents/*.md` |
| PRD / fases entregues | `docs/PRD-MAX-STACK-ALIGNMENT.md` |
| GitHub App / PAT | `docs/GITHUB-APP.md` |
| Arquitetura | `docs/architecture.md` |

## Comandos (raiz)

| Ação | Comando |
|------|---------|
| Validar tudo | `npm run validar` |
| Servidor UI | `npm start` |
| Testes | `npm test` |
| Build web | `npm run build:web` |
| Scan rápido | `npm run quick -- <path>` |
| Scan profundo | `npm run deep -- <path>` |
| Evoluir repo | `npm run evolve -- <path>` |
| Self-scan | `npm run quick -- .` (repo max-coding) |

## Project Rules (`.cursor/rules/`)

| Arquivo | Escopo |
|---------|--------|
| `00-core-max-stack.mdc` | alwaysApply — produto, CLI, modos audit/plan/apply |
| `01-coding-standards.mdc` | alwaysApply — diff mínimo, convenções |
| `02-planning-first.mdc` | alwaysApply — plano antes de implementar |
| `03-security-review.mdc` | globs — auth, API, GitHub |
| `04-testing-validar.mdc` | globs — testes e `validar.mjs` |

Regras aninhadas:

| Pasta | Arquivo |
|-------|---------|
| `apps/web/` | `.cursor/rules/react-ui.mdc` |
| `packages/core/` | `.cursor/rules/node-core.mdc` |

## Pipeline multi-papel (gstack-inspired)

```
INTAKE → SCOUT → HUNT → AUDIT → PLAN → VERIFY → (APPLY no repo alvo)
```

- **Neste repo (max-coding):** implementar features do produto Max Stack.
- **Repo alvo auditado:** modo **audit** default — não editar sem pedido explícito; usar `reports/<slug>/handoff.json`.

## Prompts operacionais (Composer / Agent)

| Fase | Prompt sugerido |
|------|-----------------|
| Planejamento | Analise `#arquivo` e `@Recommended`. Crie plano passo a passo. **Não escreva código ainda.** |
| Execução | Implemente **apenas o passo N** do plano. Diff mínimo. |
| Revisão | Revise como reviewer sênior: bugs, segurança, regressões, escopo. |
| Memória | Transforme este erro recorrente em uma Project Rule pequena em `.cursor/rules/`. |
| Validação | Rode `npm run validar` ou testes afetados antes de considerar concluído. |

## Sessões paralelas (recomendado)

- **Sessão A:** arquitetura / plano / escopo
- **Sessão B:** implementação (um passo por vez)
- **Sessão C:** revisão e validação

## Limites

- Diff mínimo; reutilizar módulos existentes em `packages/core/lib/`.
- Sem commit, push ou PR sem pedido explícito.
- Sem segredos no repo (`.env`, tokens).
- Não editar repos **alvos** de auditoria a partir deste workspace, salvo tarefa explícita de apply/pilot.

## Erro recorrente → evolução

Se o agente errar duas vezes no mesmo padrão (naming, rota API, teste, etc.), adicione ou ajuste uma rule em `.cursor/rules/` — pequena, acionável, versionada no git.
