/**
 * SQLite Max Stack — schema PRD normalizado
 */
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
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
      source TEXT DEFAULT 'local',
      url TEXT,
      last_scanned_at TEXT
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository_id INTEGER NOT NULL,
      mode TEXT NOT NULL,
      health_overall INTEGER,
      health_grade TEXT,
      finding_count INTEGER DEFAULT 0,
      recommendation_count INTEGER DEFAULT 0,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (repository_id) REFERENCES repositories(id)
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      analysis_id INTEGER NOT NULL,
      category TEXT,
      severity TEXT,
      finding_type TEXT,
      title TEXT,
      justification TEXT,
      source_role TEXT,
      payload TEXT,
      FOREIGN KEY (analysis_id) REFERENCES analyses(id)
    );

    CREATE TABLE IF NOT EXISTS evidence_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      finding_id TEXT NOT NULL,
      kind TEXT,
      ref TEXT,
      FOREIGN KEY (finding_id) REFERENCES findings(id)
    );

    CREATE TABLE IF NOT EXISTS external_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      catalog_id TEXT,
      source_repo TEXT,
      url TEXT,
      metadata TEXT,
      FOREIGN KEY (analysis_id) REFERENCES analyses(id)
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      analysis_id INTEGER NOT NULL,
      priority INTEGER,
      impact TEXT,
      effort TEXT,
      risk TEXT,
      payload TEXT,
      FOREIGN KEY (analysis_id) REFERENCES analyses(id)
    );

    CREATE TABLE IF NOT EXISTS backlog_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      title TEXT,
      tasks TEXT,
      status TEXT DEFAULT 'open',
      FOREIGN KEY (analysis_id) REFERENCES analyses(id)
    );

    CREATE TABLE IF NOT EXISTS analysis_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      agent TEXT,
      phase TEXT,
      started_at TEXT,
      finished_at TEXT,
      metadata TEXT,
      FOREIGN KEY (analysis_id) REFERENCES analyses(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at DESC);
  `)

  try {
    db.exec(`ALTER TABLE repositories ADD COLUMN source TEXT DEFAULT 'local'`)
  } catch {
    /* coluna existe */
  }
  try {
    db.exec(`ALTER TABLE analyses ADD COLUMN finding_count INTEGER DEFAULT 0`)
  } catch {
    /* exists */
  }
}

export function upsertRepository(db, intake) {
  const now = new Date().toISOString()
  const existing = db.prepare('SELECT id FROM repositories WHERE slug = ?').get(intake.slug)
  if (existing) {
    db.prepare(
      'UPDATE repositories SET path = ?, source = ?, url = ?, last_scanned_at = ? WHERE id = ?',
    ).run(intake.path, intake.source, intake.url, now, existing.id)
    return existing.id
  }
  const result = db
    .prepare('INSERT INTO repositories (slug, path, source, url, last_scanned_at) VALUES (?, ?, ?, ?, ?)')
    .run(intake.slug, intake.path, intake.source, intake.url, now)
  return Number(result.lastInsertRowid)
}

export function saveAnalysisFull(db, repoId, result) {
  const payload = JSON.stringify(result)
  const createdAt = result.generatedAt || new Date().toISOString()
  const info = db
    .prepare(
      `INSERT INTO analyses (repository_id, mode, health_overall, health_grade, finding_count, recommendation_count, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      repoId,
      result.mode,
      result.health?.overall ?? 0,
      result.health?.grade ?? '?',
      (result.findings || []).length,
      (result.recommendations || []).length,
      payload,
      createdAt,
    )
  const analysisId = Number(info.lastInsertRowid)

  const insFinding = db.prepare(
    `INSERT INTO findings (id, analysis_id, category, severity, finding_type, title, justification, source_role, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const insEvidence = db.prepare(`INSERT INTO evidence_items (finding_id, kind, ref) VALUES (?, ?, ?)`)
  for (const f of result.findings || []) {
    const fid = `${analysisId}-${f.id}`
    insFinding.run(
      fid,
      analysisId,
      f.category,
      f.severity,
      f.findingType,
      f.title,
      f.justification,
      f.sourceRole,
      JSON.stringify(f),
    )
    for (const e of f.evidence || []) {
      insEvidence.run(fid, e.kind || 'signal', e.ref)
    }
  }

  const insPattern = db.prepare(
    `INSERT INTO external_patterns (analysis_id, catalog_id, source_repo, url, metadata) VALUES (?, ?, ?, ?, ?)`,
  )
  for (const p of result.externalPatterns || []) {
    insPattern.run(analysisId, p.catalogId, p.sourceRepo, p.url, JSON.stringify(p))
  }

  const insRec = db.prepare(
    `INSERT INTO recommendations (id, analysis_id, priority, impact, effort, risk, payload) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
  for (const r of result.recommendations || []) {
    insRec.run(`${analysisId}-${r.id}`, analysisId, r.priority, r.impact, r.effort, r.risk, JSON.stringify(r))
  }

  const insBacklog = db.prepare(
    `INSERT INTO backlog_items (analysis_id, title, tasks, status) VALUES (?, ?, ?, 'open')`,
  )
  for (const b of result.backlog || []) {
    insBacklog.run(analysisId, b.title, JSON.stringify(b.tasks || []))
  }

  const insRun = db.prepare(
    `INSERT INTO analysis_runs (analysis_id, agent, phase, started_at, finished_at, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
  )
  for (const run of result.runs || []) {
    insRun.run(analysisId, run.agent, run.phase, run.startedAt, run.finishedAt, JSON.stringify(run))
  }

  return analysisId
}

export function listAnalyses(db, limit = 30) {
  return db
    .prepare(
      `SELECT a.id, a.mode, a.health_overall, a.health_grade, a.finding_count, a.recommendation_count, a.created_at,
              r.slug, r.path, r.source, r.url
       FROM analyses a JOIN repositories r ON r.id = a.repository_id
       ORDER BY a.created_at DESC LIMIT ?`,
    )
    .all(limit)
}

export function getAnalysis(db, id) {
  const row = db
    .prepare(
      `SELECT a.*, r.slug, r.path, r.source, r.url FROM analyses a
       JOIN repositories r ON r.id = a.repository_id WHERE a.id = ?`,
    )
    .get(id)
  if (!row) return null
  const data = JSON.parse(row.payload)
  const findings = db.prepare('SELECT * FROM findings WHERE analysis_id = ?').all(id)
  return { ...row, data, findings }
}

export function listRepositories(db) {
  return db
    .prepare(
      `SELECT r.*,
        (SELECT COUNT(*) FROM analyses WHERE repository_id = r.id) AS analysis_count,
        (SELECT health_overall FROM analyses WHERE repository_id = r.id ORDER BY created_at DESC LIMIT 1) AS last_health
       FROM repositories r ORDER BY r.last_scanned_at DESC`,
    )
    .all()
}

export function dbExists() {
  return existsSync(DB_PATH)
}

// compat
export function saveAnalysis(db, repoId, result) {
  return saveAnalysisFull(db, repoId, result)
}
