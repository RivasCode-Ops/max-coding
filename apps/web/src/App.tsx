import { useEffect, useState } from 'react'
import { analyze, getAnalysis, getStatus, listHistory } from './api'
import type { AnalysisResult, HistoryItem } from './types'
import './App.css'

export default function App() {
  const [repoPath, setRepoPath] = useState('c:\\_PROJETOS\\Quadro-Negro')
  const [status, setStatus] = useState('Conectando…')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    try {
      const s = await getStatus()
      setStatus(`Max Stack online · ${s.db} análises · v${s.version}`)
      const h = await listHistory()
      setHistory(h.items)
    } catch {
      setStatus('Offline — rode npm start na raiz do max-coding')
    }
  }

  async function run(mode: 'quick' | 'deep') {
    if (!repoPath.trim()) return alert('Informe caminho ou URL GitHub')
    setBusy(true)
    try {
      const res = await analyze(repoPath.trim(), mode)
      setResult(res.data)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function load(id: number) {
    const row = await getAnalysis(id)
    setResult(row.data)
    if (row.data?.repo?.path) setRepoPath(row.data.repo.path)
  }

  return (
    <div className="layout">
      <header>
        <h1>Max Stack</h1>
        <p>Auditoria local-first de repositórios</p>
        <span className="badge">{status}</span>
      </header>

      <section className="card">
        <label>Repositório (local ou GitHub)</label>
        <input
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
          placeholder="c:\projeto ou https://github.com/org/repo"
        />
        <div className="row">
          <button disabled={busy} onClick={() => run('quick')}>
            Quick Scan
          </button>
          <button disabled={busy} className="secondary" onClick={() => run('deep')}>
            Deep Analysis
          </button>
        </div>
        {busy && <p className="busy">Analisando…</p>}
      </section>

      {result && (
        <>
          <section className="card">
            <h2>Resumo</h2>
            <p className="score">{result.health.summary}</p>
            <p>
              <strong>{result.repo.slug}</strong> · {result.repo.source || 'local'}
              {result.repo.url && (
                <>
                  {' '}
                  · <a href={result.repo.url}>{result.repo.url}</a>
                </>
              )}
            </p>
            {result.executiveSummary && (
              <ul>
                <li>Stack: {result.executiveSummary.stack}</li>
                {result.executiveSummary.topGaps?.map((g) => (
                  <li key={g}>Gap: {g}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>Health por categoria (12)</h2>
            <ul className="cats">
              {result.health.categories.map((c) => (
                <li key={c.id} className={c.status}>
                  {c.label || c.id}: {c.status} ({c.score}/{c.weight})
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Achados ({result.findings?.length || 0})</h2>
            {result.findings?.map((f) => (
              <article key={f.id} className={`finding ${f.findingType}`}>
                <strong>
                  [{f.findingType}] {f.title}
                </strong>
                <span className="role">{f.sourceRole}</span>
                <p>{f.justification}</p>
                <small>Evidência: {f.evidence?.map((e) => e.ref).join(', ')}</small>
              </article>
            ))}
          </section>

          {result.externalPatterns?.length > 0 && (
            <section className="card">
              <h2>Padrões externos</h2>
              <ul>
                {result.externalPatterns.map((p, i) => (
                  <li key={i}>
                    <a href={p.url}>{p.sourceRepo}</a> ({p.catalogId})
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <h2>Recomendações ({result.recommendations?.length || 0})</h2>
            {result.recommendations?.map((r) => (
              <article key={r.id} className="rec">
                <strong>
                  [P{r.priority}] {r.title}
                </strong>
                <p>{r.suggestedUpgrade || r.problem}</p>
              </article>
            ))}
          </section>

          <section className="card">
            <h2>Backlog</h2>
            <ul>
              {result.backlog?.map((b) => (
                <li key={b.id}>
                  [P{b.priority}] {b.title}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Checklist</h2>
            <ul>
              {result.checklist?.map((c) => (
                <li key={c.id}>{c.item}</li>
              ))}
            </ul>
          </section>

          {result.prPlan && (
            <section className="card">
              <h2>PR Plan (sugerido)</h2>
              <p className="note">{result.prPlan.note}</p>
              <ol>
                {result.prPlan.commits?.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <section className="card">
        <h2>Histórico</h2>
        <ul className="history">
          {history.map((h) => (
            <li key={h.id}>
              <button type="button" className="link" onClick={() => load(h.id)}>
                {h.slug}
              </button>{' '}
              · {h.mode} · {h.health_overall}/100 ({h.health_grade}) · {new Date(h.created_at).toLocaleString('pt-BR')}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
