# Agente: Repo Scout

**Fase:** SCOUT  
**Módulo:** `packages/repo-scanner`

## Responsabilidade

Detectar stack, scripts, estrutura, CI, testes, `.cursor/rules`, sinais de gap.

## Comando

```bash
node packages/repo-scanner/bin/scan.mjs <path>
```

## Saída

`reports/<slug>/profile-*.json`

## Handoff para

Pattern Hunter — usar `summary.frameworks` e `signals[]`
