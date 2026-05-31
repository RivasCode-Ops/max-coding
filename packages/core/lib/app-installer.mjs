/**
 * Instalação do app local — Fase 29
 * Atalho na área de trabalho (Windows) para abrir Max Stack sem Cursor
 */
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
export const APP_SHORTCUT_NAME = 'Max Stack'
export const APP_URL_SHORTCUT_NAME = 'Max Stack (link)'
export const DEFAULT_PORT = 3847

export function getAppInstallPaths(options = {}) {
  const root = resolve(options.root || REPO_ROOT)
  const port = Number(options.port || process.env.MAX_PORT || DEFAULT_PORT)
  const host = String(options.host || process.env.MAX_HOST || '127.0.0.1')
  const url = `http://${host}:${port}`
  const launcher = join(root, 'MaxStack.cmd')
  return {
    root,
    port,
    host,
    url,
    launcher,
    launcherExists: existsSync(launcher),
  }
}

export function desktopDir() {
  return join(homedir(), 'Desktop')
}

export function desktopShortcutPath(name = APP_SHORTCUT_NAME) {
  if (process.platform === 'win32') return join(desktopDir(), `${name}.lnk`)
  if (process.platform === 'darwin') return join(desktopDir(), `${name}.webloc`)
  return join(desktopDir(), `${name}.desktop`)
}

export function desktopUrlShortcutPath(name = APP_URL_SHORTCUT_NAME) {
  return join(desktopDir(), `${name}.url`)
}

export function buildWindowsShortcutScript(shortcutPath, targetPath, workingDir, description) {
  const esc = (s) => String(s).replace(/'/g, "''")
  return `$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('${esc(shortcutPath)}')
$Shortcut.TargetPath = '${esc(targetPath)}'
$Shortcut.WorkingDirectory = '${esc(workingDir)}'
$Shortcut.Description = '${esc(description)}'
$Shortcut.Save()`
}

export function buildUrlShortcutContent(url) {
  return `[InternetShortcut]\r\nURL=${url}\r\n`
}

export function getAppInstallStatus(options = {}) {
  const paths = getAppInstallPaths(options)
  const launcherShortcut = desktopShortcutPath(options.shortcutName)
  const urlShortcut = desktopUrlShortcutPath(options.urlShortcutName)
  const supported = process.platform === 'win32'

  return {
    platform: process.platform,
    supported,
    paths,
    shortcuts: {
      launcher: {
        path: launcherShortcut,
        installed: existsSync(launcherShortcut),
        name: options.shortcutName || APP_SHORTCUT_NAME,
      },
      url: {
        path: urlShortcut,
        installed: existsSync(urlShortcut),
        name: options.urlShortcutName || APP_URL_SHORTCUT_NAME,
      },
    },
    ready: paths.launcherExists,
    message: supported
      ? paths.launcherExists
        ? 'Pronto para instalar atalho na área de trabalho'
        : 'MaxStack.cmd não encontrado na raiz do projeto'
      : 'Use npm run app ou abra o link no navegador',
  }
}

export function installUrlShortcut(options = {}) {
  const paths = getAppInstallPaths(options)
  const target = desktopUrlShortcutPath(options.urlShortcutName)
  const content = buildUrlShortcutContent(paths.url)

  if (options.dryRun) {
    return { ok: true, dryRun: true, shortcut: target, url: paths.url, content }
  }

  writeFileSync(target, content, 'utf8')
  return { ok: true, shortcut: target, url: paths.url }
}

export function installDesktopShortcut(options = {}) {
  const status = getAppInstallStatus(options)

  if (process.platform !== 'win32') {
    const urlOnly = installUrlShortcut({ ...options, dryRun: options.dryRun })
    return {
      ok: urlOnly.ok,
      supported: false,
      platform: process.platform,
      urlShortcut: urlOnly,
      status: getAppInstallStatus(options),
      message: 'Atalho .url criado (abre o link no navegador)',
    }
  }

  if (!status.paths.launcherExists) {
    return { ok: false, reason: 'launcher-missing', path: status.paths.launcher, status }
  }

  const shortcutPath = desktopShortcutPath(options.shortcutName)
  const script = buildWindowsShortcutScript(
    shortcutPath,
    status.paths.launcher,
    status.paths.root,
    'Max Stack — auditoria local (sem Cursor)',
  )

  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      shortcut: shortcutPath,
      target: status.paths.launcher,
      url: status.paths.url,
      script,
      status,
    }
  }

  const result = spawnSync('powershell', ['-NoProfile', '-Command', script], { encoding: 'utf8' })
  if (result.status !== 0) {
    return {
      ok: false,
      reason: (result.stderr || result.stdout || 'powershell-failed').trim(),
      status,
    }
  }

  const urlShortcut = installUrlShortcut(options)

  return {
    ok: true,
    shortcut: shortcutPath,
    target: status.paths.launcher,
    url: status.paths.url,
    urlShortcut,
    status: getAppInstallStatus(options),
    message: 'Atalhos criados na área de trabalho',
  }
}
