# Agente: Patch Planner

**Fase:** PLAN

## Responsabilidade

- Ordenar `recommendations.json` por priority (1 = urgente)
- Agrupar em sprint sugerida (S1: P1–P2, S2: resto)
- Gerar `report.md` legível + `backlog.json` machine-readable

## Formato backlog item

```json
{
  "id": "rec-001",
  "title": "...",
  "priority": 1,
  "tasks": ["passo 1", "passo 2"],
  "acceptance": ["critério verificável"]
}
```

## Handoff para

QA Verifier — nada mergeable sem checklist VERIFY
