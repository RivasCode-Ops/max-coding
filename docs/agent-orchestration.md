# Orquestração de agentes — max-coding

Workflow inspirado em [gstack](https://github.com/garrytan/gstack), adaptado para **auditoria evolutiva** no Cursor.

## Fases

```
INTAKE → SCOUT → HUNT → AUDIT → PLAN → VERIFY → (APPLY*)
```

| Fase | Papel | Ação | Artefato |
|------|-------|------|----------|
| 1 INTAKE | Orchestrator | Validar path, modo `audit\|plan\|apply` | `handoff.json` |
| 2 SCOUT | Repo Scout | Scan filesystem + manifests | `profile.json` |
| 3 HUNT | Pattern Hunter | Catálogo + (futuro) GitHub search | `references.json` |
| 4 AUDIT | Architecture + Perf + Security | Gerar gaps vs referências | `recommendations.json` |
| 5 PLAN | Patch Planner | Priorizar, agrupar por sprint | `report.md`, `backlog.json` |
| 6 VERIFY | QA Verifier | Checklist de validação humana | `verification.md` |
| 7 APPLY* | Dev agent | Só com flag explícita no repo alvo | PR / commits |

\* APPLY fora do max-coding na v1 — max-coding só entrega plano.

## Handoff entre fases

Cada fase **append** em `reports/<slug>/handoff.json`:

```json
{
  "repo": { "slug": "quadro-negro", "path": "..." },
  "mode": "audit",
  "phase": "PLAN",
  "completed": ["INTAKE", "SCOUT", "HUNT", "AUDIT"],
  "artifacts": {
    "profile": "profile-....json",
    "references": "references-....json",
    "recommendations": "recommendations-....json",
    "report": "report-....md"
  },
  "nextAgent": "QA Verifier",
  "instructions": "Validar P1–P3 com build/test no repo alvo"
}
```

## Modos de execução (Guardrail Layer)

| Modo | Permite | Proibido |
|------|---------|----------|
| **audit** (default) | scan, report, recomendações | editar repo alvo |
| **plan** | + backlog, issues template | apply código |
| **apply** | agente no repo alvo altera código | apply sem VERIFY |

## Comando unificado

```bash
npm run audit -- c:\_PROJETOS\Quadro-Negro
```

Equivalente a: Scout → Hunt (catálogo) → Audit → Plan.

## Prompts por papel

Ver `docs/agents/*.md` — colar ou referenciar no Cursor ao handoff manual.
