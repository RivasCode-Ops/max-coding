# MAX — copy oficial do produto

Repositório: [RivasCode-Ops/max-coding](https://github.com/RivasCode-Ops/max-coding)  
Nome do produto: **MAX** (stack MAX)

## Definição curta

**MAX** é um auditor técnico evolutivo de repositórios que detecta padrões, encontra lacunas e sugere melhorias contínuas para aumentar qualidade, segurança, performance e maturidade do software.

## Copy-base

MAX é um sistema de auditoria e evolução contínua de código. Ele lê repositórios locais ou remotos, entende a stack, identifica padrões, compara a estrutura atual com referências melhores do GitHub e sugere upgrades, refactors e implementações que aumentam qualidade, segurança, desempenho e saúde do software.

## Missão

Transformar repositórios em **diagnósticos acionáveis** e **planos de melhoria contínua**.

De: *“tenho esse código, mas não sei o que está faltando”*  
Para: *“aqui está o estado, os padrões, os riscos, as melhorias prioritárias e o que implementar a seguir”*

## Capacidades (V1 → V1.5)

| # | Capacidade | Status implementação |
|---|------------|-------------------|
| 1 | Ler repo local | ✅ `npm run scan` / `audit` |
| 2 | Detectar stack | ✅ Repo Scout |
| 3 | Mapear estrutura | ✅ profile.json |
| 4 | Sinais de qualidade (testes, CI, docs, DX) | ✅ parcial |
| 5 | Detectar gaps prováveis | ✅ recommender |
| 6 | Padrões externos (catálogo OSS) | ✅ Pattern Hunter |
| 7 | Comparar vs referências | ✅ |
| 8 | Recomendações priorizadas | ✅ impacto/esforço/risco |
| 9 | Backlog + roadmap | ✅ backlog.json |
| 10 | Patches/PR plan (sob autorização) | ✅ plan mode (Fase 16) |

## Modos de análise

| Modo | CLI | Escopo |
|------|-----|--------|
| **Quick Scan** | `npm run quick -- <path>` | Perfil + health score resumido |
| **Deep Analysis** | `npm run deep -- <path>` | Quick + padrões OSS + recomendações + handoff |

## Categorias avaliadas

documentação · estrutura · arquitetura · qualidade · testes · CI/CD · segurança · dependências · performance · DX · governança · maturidade operacional

## Papéis internos (gstack-inspired)

Repo Scout · Pattern Hunter · Architecture Auditor · Security Auditor · Performance Reviewer · Patch Planner · QA Verifier

Ver [gstack-mapping.md](./gstack-mapping.md).

## Regras do produto

- Não inventar problemas sem evidência (arquivo/sinal observável)
- Separar: **risco confirmado** · **hipótese** · **melhoria sugerida**
- Não aplicar mudanças no repo alvo sem autorização (modo audit default)
- Histórico de análises em `reports/` e (V1.5) SQLite

## Inspirações conceituais (não dependências)

- [ECC Tools](https://github.com/marketplace/ecc-tools) — guardrails e contexto portátil
- [gstack](https://github.com/garrytan/gstack) — papéis especializados
- RepoAnalyzer / Repo Doctor — health score e categorias
- [Guardrails](https://github.com/apps/guardrails) — qualidade contínua

## Stack alvo (produto MAX)

- **V1 atual:** Node ESM, CLI, relatórios JSON/Markdown
- **V1.5:** SQLite local (`data/max.db`)
- **V2 UI:** React + TypeScript em `apps/web/`

## Fora de escopo V1

Edição automática agressiva · deploy automático · multi-tenant enterprise · execução irrestrita de comandos

---

Prompt mestre completo para Cursor: ver seção “Copy para codar” no histórico do projeto ou `docs/prd.md`.
