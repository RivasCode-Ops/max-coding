import { useEffect, useState } from 'react'
import { analyze, applyRules, getAnalysis, getStatus, getTrend, listHistory, sendFeedback, validateRepo } from './api'
import type { AnalysisResult, HistoryItem } from './types'
import './App.css'

export default function App() {
  const [repoPath, setRepoPath] = useState('c:\\_PROJETOS\\Quadro-Negro')
  const [status, setStatus] = useState('Conectando…')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [trend, setTrend] = useState<{ points: { health_overall: number; created_at: string }[]; trend: string; delta: number } | null>(null)
  const [validation, setValidation] = useState<AnalysisResult['repoValidation'] | null>(null)
  const [feedbackSent, setFeedbackSent] = useState<Record<string, 'up' | 'down'>>({})

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

  async function run(mode: 'quick' | 'deep', opts?: { validateRepo?: boolean; applyRules?: boolean }) {
    if (!repoPath.trim()) return alert('Informe caminho ou URL GitHub')
    setBusy(true)
    setValidation(null)
    try {
      const res = await analyze(repoPath.trim(), mode, opts)
      const data = { ...res.data, analysisId: res.data.analysisId ?? res.id }
      setResult(data)
      if (data.repo?.slug) {
        try {
          setTrend(await getTrend(data.repo.slug))
        } catch {
          setTrend(data.healthTrend || null)
        }
      }
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function runValidate() {
    if (!repoPath.trim()) return
    setBusy(true)
    try {
      setValidation(await validateRepo(repoPath.trim()))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function runApplyRules() {
    if (!result?.analysisId) return alert('Faça uma análise primeiro')
    setBusy(true)
    try {
      const applied = await applyRules(result.analysisId)
      alert(`Rules escritas em:\n${applied.written}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function feedback(recId: string, useful: boolean) {
    if (!result) return
    const fullId = result.analysisId ? `${result.analysisId}-${recId}` : recId
    try {
      await sendFeedback(fullId, result.analysisId, useful)
      setFeedbackSent((s) => ({ ...s, [recId]: useful ? 'up' : 'down' }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    }
  }

  async function load(id: number) {
    const row = await getAnalysis(id)
    const data = { ...row.data, analysisId: id }
    setResult(data)
    if (row.data?.repo?.path) setRepoPath(row.data.repo.path)
    if (row.slug) {
      try {
        setTrend(await getTrend(row.slug))
      } catch {
        setTrend(null)
      }
    }
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
          <button disabled={busy} className="secondary" onClick={runValidate}>
            Validar repo
          </button>
        </div>
        {busy && <p className="busy">Analisando…</p>}
        {validation && (
          <div className="validation">
            <strong>Validação:</strong>{' '}
            {validation.skipped ? validation.message : validation.ok ? 'OK' : 'Falhou'}
            <ul>
              {validation.results?.map((r) => (
                <li key={r.script} className={r.ok ? 'ok' : 'fail'}>
                  npm run {r.script} — {r.ok ? 'OK' : 'FAIL'} ({r.durationMs}ms)
                </li>
              ))}
            </ul>
          </div>
        )}
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

          {trend && trend.points.length > 0 && (
            <section className="card">
              <h2>Tendência de health</h2>
              <p>
                {trend.trend === 'up' && '↑ Subindo'}
                {trend.trend === 'down' && '↓ Caindo'}
                {trend.trend === 'stable' && '→ Estável'} · delta {trend.delta >= 0 ? '+' : ''}
                {trend.delta} pts
              </p>
              <table className="trend-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.points.map((p, i) => (
                    <tr key={i}>
                      <td>{new Date(p.created_at).toLocaleString('pt-BR')}</td>
                      <td>{p.health_overall}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {result.structure && (
            <section className="card">
              <h2>Estrutura ({result.structure.fileCount} arquivos)</h2>
              <p>{result.structure.totalLines.toLocaleString('pt-BR')} linhas de código</p>
              {result.structure.hotspots?.length > 0 && (
                <>
                  <strong>Hotspots:</strong>
                  <ul>
                    {result.structure.hotspots.map((h) => (
                      <li key={h.file}>
                        {h.file} — {h.lines} linhas · {h.imports} imports
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {result.repoValidation && !result.repoValidation.skipped && (
            <section className="card">
              <h2>Validação no repo</h2>
              <p className={result.repoValidation.ok ? 'ok-text' : 'fail-text'}>
                {result.repoValidation.ok ? 'Scripts OK' : 'Algum script falhou'}
              </p>
              <ul>
                {result.repoValidation.results.map((r) => (
                  <li key={r.script} className={r.ok ? 'ok' : 'fail'}>
                    npm run {r.script} — {r.ok ? 'OK' : 'FAIL'}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {result.scanDiff?.hasPrevious && (
            <section className="card">
              <h2>Diff vs scan anterior (#{result.scanDiff.previousAnalysisId})</h2>
              <p>
                Health: {result.scanDiff.healthDelta !== undefined && result.scanDiff.healthDelta >= 0 ? '+' : ''}
                {result.scanDiff.healthDelta} pts · {result.scanDiff.improved ? 'melhorou' : 'regrediu'}
              </p>
              {result.scanDiff.resolvedFindings && result.scanDiff.resolvedFindings.length > 0 && (
                <>
                  <strong>Resolvidos:</strong>
                  <ul>
                    {result.scanDiff.resolvedFindings.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </>
              )}
              {result.scanDiff.newFindings && result.scanDiff.newFindings.length > 0 && (
                <>
                  <strong>Novos:</strong>
                  <ul>
                    {result.scanDiff.newFindings.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {result.githubComparable && (
            <section className="card">
              <h2>GitHub Search</h2>
              <p className="note">Query: {result.githubComparable.query}</p>
              {result.githubComparable.note && <p className="note">{result.githubComparable.note}</p>}
              <ul>
                {result.githubComparable.items?.map((r) => (
                  <li key={r.fullName}>
                    <a href={r.url}>{r.fullName}</a> · ★ {r.stars}
                  </li>
                ))}
              </ul>
            </section>
          )}

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
                <div className="row feedback-row">
                  <button
                    type="button"
                    className={`tiny ${feedbackSent[r.id] === 'up' ? 'active' : ''}`}
                    onClick={() => feedback(r.id, true)}
                  >
                    Útil
                  </button>
                  <button
                    type="button"
                    className={`tiny secondary ${feedbackSent[r.id] === 'down' ? 'active' : ''}`}
                    onClick={() => feedback(r.id, false)}
                  >
                    Não útil
                  </button>
                </div>
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
          {result.cursorRules && (
            <section className="card">
              <h2>Cursor Rules (gerado)</h2>
              <p className="note">Copie ou aplique em .cursor/rules/ no repo analisado</p>
              <div className="row">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(result.cursorRules || '')
                    alert('Copiado!')
                  }}
                >
                  Copiar rules
                </button>
                <button type="button" className="secondary" disabled={busy} onClick={runApplyRules}>
                  Aplicar no repo
                </button>
              </div>
              <pre className="rules-preview">{result.cursorRules.slice(0, 1200)}…</pre>
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
