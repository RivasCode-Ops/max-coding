# HANDOFF — max-coding

**Atualizado:** 2026-05-28  
**Fase:** 1 parcial (audit pipeline + gstack mapping)

## Feito

- Mapeamento [gstack → max-coding](./docs/gstack-mapping.md)
- Orquestração multi-papel + prompts em `docs/agents/`
- CLI `npm run audit -- <path>` (Scout → Hunt → Audit → Plan → VERIFY checklist)
- Catálogo `practices-vite-kanban.json` (Kanri, Kanvana, Wekan)
- `.cursor/rules/max-coding.mdc` atualizado

## Comando principal

```bash
cd c:\_PROJETOS\max-coding
npm run audit -- c:\_PROJETOS\Quadro-Negro
```

Ler saída: `reports/quadro-negro/handoff.json` e `report-*.md`

## Próximo

1. GitHub search API no Pattern Hunter (refs dinâmicas)
2. Catálogos: `practices-next.md`, `practices-streamlit.json`
3. `gh auth login` + push repo RivasCode-Ops/max-coding

## Modo Cursor

Abrir workspace `max-coding`; ao implementar no Quadro-Negro, usar `@docs/agents/qa-verifier.md` após cada item P1.
