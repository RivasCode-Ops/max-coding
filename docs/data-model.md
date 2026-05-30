# Modelo de dados MAX (SQLite V1.5)

Persistência local em `data/max.db` (não implementado na V1 CLI — artefatos em `reports/`).

## Tabelas

### repositories
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PK | |
| slug | TEXT UNIQUE | Nome normalizado |
| path | TEXT | Caminho local ou URL GitHub |
| last_scanned_at | TEXT ISO | |

### analyses
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PK | |
| repository_id | FK | |
| mode | TEXT | quick \| deep |
| health_overall | INTEGER | 0–100 |
| health_grade | TEXT | A–D |
| created_at | TEXT ISO | |

### findings
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PK | |
| analysis_id | FK | |
| category | TEXT | testes, ci_cd, … |
| severity | TEXT | confirmed \| hypothesis \| suggestion |
| title | TEXT | |
| evidence | TEXT JSON | arquivos/sinais |

### evidence_items
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PK | |
| finding_id | FK | |
| kind | TEXT | file \| signal \| snippet |
| ref | TEXT | |

### external_patterns
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PK | |
| catalog_id | TEXT | ex. practices-vite-kanban |
| pattern_id | TEXT | |
| source_repo | TEXT | |
| metadata | TEXT JSON | |

### recommendations
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | rec-001 |
| analysis_id | FK | |
| priority | INTEGER | |
| impact | TEXT | |
| effort | TEXT | |
| risk | TEXT | |
| payload | TEXT JSON | título, upgrade, refs |

### backlog_items
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PK | |
| recommendation_id | FK | |
| title | TEXT | |
| tasks | TEXT JSON | |
| status | TEXT | open \| done |

### analysis_runs
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PK | |
| analysis_id | FK | |
| agent | TEXT | Repo Scout, … |
| phase | TEXT | |
| started_at | TEXT | |
| finished_at | TEXT | |

### app_settings
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| key | TEXT PK | |
| value | TEXT JSON | |

## Migração V1 → V1.5

Importar JSON de `reports/<slug>/` para SQLite via script `packages/core/bin/import-reports.mjs` (futuro).
