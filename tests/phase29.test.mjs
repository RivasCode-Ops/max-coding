import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  APP_SHORTCUT_NAME,
  buildUrlShortcutContent,
  buildWindowsShortcutScript,
  desktopShortcutPath,
  getAppInstallPaths,
  getAppInstallStatus,
  installDesktopShortcut,
} from '../packages/core/lib/app-installer.mjs'

describe('Fase 29 — app installer', () => {
  it('getAppInstallPaths monta URL local', () => {
    const p = getAppInstallPaths({ port: 3847, host: '127.0.0.1' })
    assert.equal(p.url, 'http://127.0.0.1:3847')
    assert.match(p.launcher, /MaxStack\.cmd$/)
  })

  it('buildUrlShortcutContent gera InternetShortcut', () => {
    const c = buildUrlShortcutContent('http://127.0.0.1:3847')
    assert.match(c, /\[InternetShortcut\]/)
    assert.match(c, /URL=http:\/\/127\.0\.0\.1:3847/)
  })

  it('buildWindowsShortcutScript referencia launcher', () => {
    const s = buildWindowsShortcutScript('C:\\Desktop\\Max Stack.lnk', 'C:\\repo\\MaxStack.cmd', 'C:\\repo', 'test')
    assert.match(s, /WScript\.Shell/)
    assert.match(s, /MaxStack\.cmd/)
  })

  it('desktopShortcutPath usa nome do app', () => {
    assert.match(desktopShortcutPath(APP_SHORTCUT_NAME), /Max Stack/)
  })

  it('getAppInstallStatus retorna estrutura de atalhos', () => {
    const s = getAppInstallStatus()
    assert.ok(s.paths.url)
    assert.ok(s.shortcuts.launcher)
    assert.ok(s.shortcuts.url)
  })

  it('installDesktopShortcut dry-run no Windows ou url em outros OS', () => {
    const r = installDesktopShortcut({ dryRun: true })
    assert.equal(r.ok, true)
    assert.ok(r.dryRun || r.urlShortcut?.dryRun)
  })
})
