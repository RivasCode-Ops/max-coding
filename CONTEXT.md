# CONTEXT — MAX

## Problema

Repositórios crescem sem revisão sistemática de **padrões reais** (internos e externos). Reviewers olham diff; falta um loop contínuo de “o que este repo deveria adotar que repos maduros da mesma stack já fazem?”.

## Solução

**MAX** (repo `max-coding`) = auditor técnico evolutivo: análise + comparação + sugestão de melhoria contínua com health score e evidência.

## Usuário alvo

- Desenvolvedor solo ou time pequeno usando Cursor/agentes
- Mantenedores que querem backlog de melhoria técnica priorizado, não lista genérica

## Fora de escopo (v1)

- Execução automática de patches em produção sem aprovação
- Substituir CI/CD ou SAST enterprise
- Análise de repos privados sem token/credencial explícita

## Diferencial vs ECC Tools

ECC forte em **contexto interno** → skills/hooks para agentes no mesmo repo.  
max-coding adiciona **busca externa** (catálogo/GitHub) + **comparador** + **orquestração multi-papel** (modelo [gstack](https://github.com/garrytan/gstack), rodando no Cursor).

## Orquestração

Ver `docs/agent-orchestration.md`. CLI: `npm run quick -- <path>` · `npm run deep -- <path>`.

## Stack inicial (proposta)

- Node.js 20+ / TypeScript ou ESM puro nos pacotes
- CLI primeiro; `apps/web` opcional na Fase 2
- Saída: JSON + Markdown + template de issues

## Primeiro repo piloto sugerido

`Quadro-Negro` ou `simulador-troca-moto` em `_PROJETOS` — tamanho controlado, stack clara (Vite/Streamlit).
