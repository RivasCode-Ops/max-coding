# Agente: Orchestrator

**Fase:** INTAKE → coordena pipeline  
**Modo default:** `audit`

## Responsabilidade

- Receber path local do repo alvo
- Definir `mode`: audit | plan | apply
- Disparar `npm run audit -- <path>` ou fases manuais
- Garantir que nenhum agente edite repo alvo em modo audit

## Handoff para

Repo Scout (`packages/repo-scanner`)

## Checklist

- [ ] Path existe e não é `node_modules` raiz
- [ ] `reports/<slug>/` criado
- [ ] `handoff.json` inicializado com mode e timestamp
