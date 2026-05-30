import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, createHmac } from 'node:crypto'
import { formatPrComment } from '../packages/core/lib/pr-comment.mjs'
import { signAppJwt, verifyWebhookSignature } from '../packages/core/lib/github-auth.mjs'

describe('Fase 5 — PR comment format', () => {
  it('gera markdown com health e achados', () => {
    const md = formatPrComment(
      {
        mode: 'quick',
        health: { summary: '88/100 (A)' },
        findings: [{ findingType: 'confirmed', title: 'Sem CI' }],
        recommendations: [{ priority: 1, title: 'Adicionar GitHub Actions' }],
        executiveSummary: { stack: 'vite+react', topGaps: ['ci_cd'] },
        checklist: [{ item: 'Rodar testes' }],
      },
      { ownerRepo: 'org/repo', pullNumber: 7 },
    )
    assert.ok(md.includes('88/100'))
    assert.ok(md.includes('Sem CI'))
    assert.ok(md.includes('org/repo'))
  })
})

describe('Fase 5 — webhook signature', () => {
  it('valida HMAC sha256', () => {
    const secret = 'test-secret'
    const payload = '{"action":"opened"}'
    const sig = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`
    assert.equal(verifyWebhookSignature(payload, sig, secret), true)
    assert.equal(verifyWebhookSignature(payload, 'sha256=bad', secret), false)
  })
})

describe('Fase 5 — App JWT', () => {
  it('assina JWT RS256', () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const pem = privateKey.export({ type: 'pkcs1', format: 'pem' })
    const jwt = signAppJwt('12345', pem)
    assert.match(jwt, /^eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+$/)
  })
})
