# Pattern Engine — max-coding

## Três níveis de padrão

### Nível 1 — Interno (repo atual)

Fontes:
- Árvore de diretórios e naming
- `package.json` / `pyproject.toml` / `requirements.txt`
- Presença de: `tests/`, `.github/workflows`, `eslint`, `prettier`, `validar.py`
- `.cursor/rules/*.mdc`
- Git: frequência de commits, áreas mais tocadas (Fase 1)

Saída: `InternalPattern { id, signal, evidence[], strength }`

Exemplos de sinais:
- `has_vite` — evidence: `vite.config.*`
- `no_test_script` — evidence: package.json sem script `test`
- `local_first_storage` — evidence: localStorage/IndexedDB no código

### Nível 2 — Externo (GitHub)

Queries construídas a partir do perfil:
- Linguagem + framework: `language:JavaScript vite kanban`
- Domínio: `productivity board offline`
- Filtros: stars > N, pushed último ano

Saída: `ExternalReference { repo, url, stars, topics[], matchedPatterns[] }`

Repos de referência já mapeados para produtividade/Kanban:
- [kanriapp/kanri](https://github.com/kanriapp/kanri) — offline, tags, due dates
- [mdiener21/kanvana](https://github.com/mdiener21/kanvana) — swimlanes, calendar, activity log
- [wekan/wekan](https://github.com/wekan/wekan) — automação IFTTT

### Nível 3 — Catálogo fixo

Regras de engenharia independentes de repo:
- Todo app JS: lint + test script + CI mínima
- Dados locais: export/import JSON documentado
- Streamlit: `session_state` antes de widgets; escape `$` em Markdown

Arquivo futuro: `packages/pattern-search/catalog/practices.json`

## Comparator (gap)

Para cada prática P:
- `present` = sinal interno confirma
- `reference_count` = quantos refs externos têm P
- `gap_score` = reference_count alto && !present → prioridade alta

## ECC-like: agent guidance

Quando `reference_count >= 2` e gap confirmado:
- Gerar snippet para `.cursor/rules` (Fase 2)
- Nunca copiar código verbatim de OSS — só padrão + link
