#!/usr/bin/env node
/**
 * Max Stack App — launcher local (sem Cursor)
 * Duplo-clique em MaxStack.cmd ou: npm run app
 */
import { spawn } from 'node:child_process'
import { exec } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const PORT = Number(process.env.MAX_PORT || 3847)
const HOST = process.env.MAX_HOST || '127.0.0.1'
const URL = `http://${HOST}:${PORT}`

console.log('')
console.log('Max Stack — app local (funciona sem Cursor)')
console.log(`Abrindo ${URL} …`)
console.log('Feche esta janela ou Ctrl+C para parar o servidor.')
console.log('')

const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['start'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, MAX_STANDALONE: '1' },
})

function openBrowser() {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${URL}"`
      : process.platform === 'darwin'
        ? `open "${URL}"`
        : `xdg-open "${URL}"`
  exec(cmd, () => {})
}

waitForServer(120000).then(openBrowser).catch(() => {
  console.error(`Servidor não respondeu em ${URL} — verifique erros acima (npm install · npm start).`)
})

function waitForServer(maxMs) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      fetch(`${URL}/api/status`)
        .then((r) => (r.ok ? resolve() : schedule()))
        .catch(() => schedule())
    }
    const schedule = () => {
      if (Date.now() - start > maxMs) reject(new Error('timeout'))
      else setTimeout(tick, 800)
    }
    tick()
  })
}

child.on('exit', (code) => process.exit(code ?? 0))

process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
