# Arquitetura — max-coding

## Visão de pacotes

```
max-coding/
├── packages/
│   ├── core/              # orquestração, tipos, export
│   ├── repo-scanner/      # intake + scan local
│   ├── pattern-search/    # GitHub + catálogo práticas (Fase 1)
│   └── recommender/       # compare + rank (Fase 1)
├── apps/web/              # (Fase 2) dashboard de relatórios
├── reports/               # saídas geradas (gitignore)
└── docs/
```

## Orquestração (gstack-adapted)

```
Orchestrator (core/run-audit)
  → Repo Scout (scanner)
  → Pattern Hunter (catalog)
  → Recommender (auditors + planner)
  → QA Verifier (verification.md template)
```

Ver `docs/agent-orchestration.md`.

## Fluxo de dados

| Etapa | Entrada | Saída |
|-------|---------|-------|
| Scan | `path` | `RepoProfile` |
| Extract | `RepoProfile` + arquivos | `InternalPatterns[]` |
| Search | stack + domain tags | `ExternalReference[]` |
| Recommend | profile + patterns + refs | `Recommendation[]` |
| Plan | recommendations | `BacklogItem[]` |

## RepoProfile (resumo)

```typescript
interface RepoProfile {
  slug: string
  path: string
  scannedAt: string
  stack: { languages: string[]; frameworks: string[]; packageManagers: string[] }
  structure: { hasSrc: boolean; hasTests: boolean; hasDocs: boolean; hasCi: boolean }
  scripts: Record<string, string>
  signals: string[]
}
```

## Integrações

| Sistema | Uso | Fase |
|---------|-----|------|
| Filesystem | scan local | 0 |
| Git | log, branch, remotes opcional | 1 |
| GitHub REST/Search | repos similares | 1 |
| Cursor rules | export `.mdc` sugerido | 2 |

## Guardrail Layer

- **Modo audit** (default): somente leitura + relatórios
- **Modo plan**: gera issues/tasks, não altera código
- **Modo apply** (futuro): patches atrás de confirmação explícita

## Decisões

- Monorepo npm workspaces na Fase 1
- TypeScript opcional — Fase 0 em ESM `.mjs` para velocidade
- Relatórios em `reports/` nunca commitados por padrão
