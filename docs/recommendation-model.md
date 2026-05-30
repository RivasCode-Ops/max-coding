# Recommendation Model — max-coding

## Schema `Recommendation`

```json
{
  "id": "rec-001",
  "category": "testes",
  "title": "Adicionar script de teste automatizado",
  "problem": "package.json não define test; regressões manuais only",
  "referencePattern": "Repos Vite maduros usam vitest + smoke e2e",
  "references": [
    { "repo": "kanriapp/kanri", "url": "https://github.com/kanriapp/kanri" }
  ],
  "suggestedUpgrade": "Adicionar vitest e 3 testes: persistência, filtros, export JSON",
  "impact": "alto",
  "effort": "medio",
  "risk": "baixo",
  "priority": 1,
  "affectedAreas": ["package.json", "src/"],
  "executionMode": "recommendation"
}
```

## Categorias

`arquitetura` | `performance` | `seguranca` | `testes` | `dx` | `observabilidade` | `documentacao` | `infraestrutura` | `qualidade` | `padronizacao`

## Escalas

| Campo | Valores |
|-------|---------|
| impact | baixo, medio, alto |
| effort | baixo, medio, alto |
| risk | baixo, medio, alto |
| priority | 1 (urgente) … 5 (backlog) |
| executionMode | `recommendation` \| `plan` \| `apply` (v2) |

## Cálculo de prioridade (heurística v1)

```
score = impactWeight + referenceWeight - effortWeight - riskWeight
priority = bucket(score) → 1..5
```

Pesos iniciais:
- impact alto +3, medio +2, baixo +1
- 3+ refs externas +2
- effort alto -2, medio -1
- risk alto -2

## Formato de saída humana (Markdown)

```markdown
### [P1] testes — Adicionar script de teste automatizado

**Problema:** ...
**Referência:** kanriapp/kanri
**Upgrade:** ...
**Impacto:** alto · **Esforço:** medio · **Risco:** baixo
**Áreas:** package.json, src/
```

## Guardrails

- Toda recomendação deve citar **evidência interna** (path ou sinal)
- Referência externa é **inspiracional**, não ordem de copiar código
- `apply` proibido na v1 sem flag `--i-understand-apply`
