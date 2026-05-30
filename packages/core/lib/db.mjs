/**
 * SQLite local — node:sqlite (Node 22+), zero deps externas
 */
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('../../..', import.meta.url)))
const DATA_DIR = join(ROOT, 'data')
const DB_PATH = join(DATA_DIR, 'max.db')

let dbInstance = null

export function getDbPath() {
  return DB_PATH
}

export function getDb() {
  if (dbInstance) return dbInstance
  mkdirSync(DATA_DIR, { recursive: true })
  dbInstance = new DatabaseSync(DB_PATH)
  migrate(dbInstance)
  return dbInstance
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      path TEXT NOT NULL,
      last_scanned_at TEXT
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository_id INTEGER NOT NULL,
      mode TEXT NOT NULL,
      health_overall INTEGER,
      health_grade TEXT,
      recommendation_count INTEGER DEFAULT 0,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (repository_id) REFERENCES repositories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analyses_repo ON analyses(repository_id);
  `)
}

export function upsertRepository(db, slug, path) {
  const now = new Date().toISOString()
  const existing = db.prepare('SELECT id FROM repositories WHERE slug = ?').get(slug)
  if (existing) {
    db.prepare('UPDATE repositories SET path = ?, last_scanned_at = ? WHERE id = ?').run(path, now, existing.id)
    return existing.id
  }
  const result = db.prepare('INSERT INTO repositories (slug, path, last_scanned_at) VALUES (?, ?, ?)').run(slug, path, now)
  return Number(result.lastInsertRowid)
}

export function saveAnalysis(db, repoId, result) {
  const payload = JSON.stringify(result)
  const createdAt = result.generatedAt || new Date().toISOString()
  const insert = db.prepare(`
    INSERT INTO analyses (repository_id, mode, health_overall, health_grade, recommendation_count, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const info = insert.run(
    repoId,
    result.mode,
    result.health?.overall ?? 0,
    result.health?.grade ?? '?',
    (result.recommendations || []).length,
    payload,
    createdAt,
  )
  return Number(info.lastInsertRowid)
}

export function listAnalyses(db, limit = 30) {
  return db
    .prepare(
      `
    SELECT a.id, a.mode, a.health_overall, a.health_grade, a.recommendation_count, a.created_at,
           r.slug, r.path
    FROM analyses a
    JOIN repositories r ON r.id = a.repository_id
    ORDER BY a.created_at DESC
    LIMIT ?
  `,
    )
    .all(limit)
}

export function getAnalysis(db, id) {
  const row = db
    .prepare(
      `
    SELECT a.*, r.slug, r.path
    FROM analyses a
    JOIN repositories r ON r.id = a.repository_id
    WHERE a.id = ?
  `,
    )
    .get(id)
  if (!row) return null
  return { ...row, data: JSON.parse(row.payload) }
}

export function listRepositories(db) {
  return db
    .prepare(
      `
    SELECT r.*,
      (SELECT COUNT(*) FROM analyses WHERE repository_id = r.id) AS analysis_count,
      (SELECT health_overall FROM analyses WHERE repository_id = r.id ORDER BY created_at DESC LIMIT 1) AS last_health
    FROM repositories r
    ORDER BY r.last_scanned_at DESC
  `,
    )
    .all()
}

export function dbExists() {
  return existsSync(DB_PATH)
}
