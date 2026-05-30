/**
 * Registro de tasks Cursor — Fase 9
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export function listCursorTasks(repoPath) {
  const dir = join(repoPath, '.cursor', 'max-stack', 'tasks')
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((filename) => {
      const full = join(dir, filename)
      const stat = statSync(full)
      const content = readFileSync(full, 'utf8')
      const titleMatch = content.match(/^#\s*Max Stack[^:]*:\s*(.+)$/m)
      return {
        filename,
        relative: `.cursor/max-stack/tasks/${filename}`,
        title: titleMatch?.[1]?.trim() || filename.replace(/\.md$/, ''),
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        cursorHint: `@.cursor/max-stack/tasks/${filename}`,
      }
    })
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
}

export function saveCursorTaskRecord(db, record) {
  const createdAt = record.createdAt || new Date().toISOString()
  db.prepare(
    `INSERT INTO cursor_tasks (repo_slug, repo_path, task_id, recommendation_id, title, relative_path, status, pilot_fix, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.repoSlug,
    record.repoPath,
    record.taskId,
    record.recommendationId ?? null,
    record.title ?? null,
    record.relativePath ?? null,
    record.status || 'pending',
    record.pilotFix ?? null,
    createdAt,
  )
  return { ...record, createdAt, status: record.status || 'pending' }
}

export function listCursorTaskRecords(db, repoSlug, limit = 20) {
  return db
    .prepare(
      `SELECT * FROM cursor_tasks WHERE repo_slug = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(repoSlug, limit)
}

export function updateCursorTaskStatus(db, id, status) {
  db.prepare(`UPDATE cursor_tasks SET status = ?, verified_at = ? WHERE id = ?`).run(
    status,
    status === 'verified' ? new Date().toISOString() : null,
    id,
  )
}
