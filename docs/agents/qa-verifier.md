# Agente: QA Verifier

**Fase:** VERIFY

## Responsabilidade

Antes de aceitar upgrade no repo alvo:

- [ ] `npm run build` (ou equivalente) passa
- [ ] Testes novos cobrem comportamento prometido
- [ ] Nenhum secret/credencial no diff
- [ ] Recomendação ainda relevante vs `profile` atual

## Saída

`verification.md` com APPROVED / REJECTED por item de backlog

## Guardrail

Em modo **audit**, QA Verifier só documenta — não aplica patches.
