import { useEffect, useState } from 'react'
import { analyze, applyPilot, applyRules, compareRepos, cursorApply, cursorApplyBatch, evolvePortfolioBatch, evolveRepo, getAnalysis, getAnalysisFeedback, getAnalysisPlan, getAnalysisReport, getPortfolio, getPortfolioAlerts, getPortfolioWatchLog, getRepoContext, getStatus, getTrend, installHook, listCursorTasks, listHistory, postPrComment, publishIssuesToGithub, rescanPortfolio, runPortfolioWatch, sendFeedback, suggestAction, validateRepo, verifyImplementation } from './api'
import type { ActionSuggestion, AnalysisResult, CursorTaskFile, EvolveBatchResult, EvolveResult, FeedbackRecStats, FeedbackSummary, HistoryItem, IssuesPublishResult, PortfolioAlert, PortfolioAlertsSummary, PortfolioChart, PortfolioHistory, PortfolioItem, PortfolioSummary, RepoCompareResult, RepoContext, VerificationReport, WatchLogEntry } from './types'
import HealthTrendChart from './HealthTrendChart'
import PortfolioHealthChart from './PortfolioHealthChart'
import PortfolioHistoryPanel from './PortfolioHistoryPanel'
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
  const [portfolioRoot, setPortfolioRoot] = useState('c:\\_PROJETOS')
  const [portfolio, setPortfolio] = useState<{
    summary: PortfolioSummary
    items: PortfolioItem[]
    chart?: PortfolioChart
    history?: PortfolioHistory
  } | null>(null)
  const [prOwnerRepo, setPrOwnerRepo] = useState('RivasCode-Ops/Quadro-Negro')
  const [prNumber, setPrNumber] = useState('1')
  const [prPreview, setPrPreview] = useState<string | null>(null)
  const [githubAuth, setGithubAuth] = useState<string>('')
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null)
  const [recFeedback, setRecFeedback] = useState<Record<string, FeedbackRecStats>>({})
  const [actionRequest, setActionRequest] = useState('')
  const [suggestions, setSuggestions] = useState<ActionSuggestion[] | null>(null)
  const [suggestNote, setSuggestNote] = useState<string | null>(null)
  const [cursorMsg, setCursorMsg] = useState<string | null>(null)
  const [cursorTasks, setCursorTasks] = useState<CursorTaskFile[]>([])
  const [verifyReport, setVerifyReport] = useState<VerificationReport | null>(null)
  const [repoContext, setRepoContext] = useState<RepoContext | null>(null)
  const [validateOnScan, setValidateOnScan] = useState(false)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [compareTarget, setCompareTarget] = useState('')
  const [compareResult, setCompareResult] = useState<RepoCompareResult | null>(null)
  const [evolveResult, setEvolveResult] = useState<EvolveResult | null>(null)
  const [portfolioAlerts, setPortfolioAlerts] = useState<{ alerts: PortfolioAlert[]; summary: PortfolioAlertsSummary } | null>(null)
  const [watchOn, setWatchOn] = useState(false)
  const [watchInterval, setWatchInterval] = useState(300)
  const [watchLog, setWatchLog] = useState<{ at: string; health: string; delta?: number }[]>([])
  const [batchEvolveResult, setBatchEvolveResult] = useState<EvolveBatchResult | null>(null)
  const [issuesPublishResult, setIssuesPublishResult] = useState<IssuesPublishResult | null>(null)
  const [portfolioWatchOn, setPortfolioWatchOn] = useState(false)
  const [portfolioWatchInterval, setPortfolioWatchInterval] = useState(600)
  const [portfolioWatchLog, setPortfolioWatchLog] = useState<WatchLogEntry[]>([])
  const [portfolioWatchSummary, setPortfolioWatchSummary] = useState<string | null>(null)

  async function loadRecFeedback(analysisId: number) {
    try {
      const fb = await getAnalysisFeedback(analysisId)
      setRecFeedback(fb.stats ?? {})
    } catch {
      setRecFeedback({})
    }
  }

  async function loadCursorTasks(path: string) {
    try {
      const r = await listCursorTasks(path)
      setCursorTasks(r.tasks)
    } catch {
      setCursorTasks([])
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function refreshHistory() {
    try {
      const s = await getStatus()
      setStatus(`Max Stack online · ${s.db} análises · v${s.version}`)
      if (s.github) {
        const parts = []
        if (s.github.app) parts.push('App')
        if (s.github.pat) parts.push('PAT')
        if (s.github.webhook) parts.push('Webhook')
        setGithubAuth(parts.length ? parts.join('+') : 'sem auth GitHub')
      }
      if (s.feedback) setFeedbackSummary(s.feedback)
      const h = await listHistory()
      setHistory(h.items)
    } catch {
      setStatus('Offline — rode npm start na raiz do max-coding')
    }
  }

  async function refreshPortfolio() {
    try {
      const p = await getPortfolio(portfolioRoot)
      setPortfolio({ summary: p.summary, items: p.items, chart: p.chart, history: p.history })
      const a = await getPortfolioAlerts(portfolioRoot)
      setPortfolioAlerts({ alerts: a.alerts, summary: a.summary })
    } catch {
      setPortfolio(null)
      setPortfolioAlerts(null)
    }
  }

  useEffect(() => {
    if (!watchOn || !repoPath.trim()) return
    let cancelled = false
    async function tick() {
      if (busy || cancelled) return
      try {
        const res = await analyze(repoPath.trim(), 'quick')
        const data = { ...res.data, analysisId: res.data.analysisId ?? res.id }
        if (cancelled) return
        setWatchLog((log) =>
          [
            {
              at: new Date().toISOString(),
              health: data.health.summary,
              delta: data.scanDiff?.healthDelta,
            },
            ...log,
          ].slice(0, 8),
        )
        setResult(data)
        if (data.repo?.slug) {
          setActiveSlug(data.repo.slug)
          await loadRepoContext(data.repo.path, data.analysisId)
        }
        if (data.scanDiff?.healthDelta != null && data.scanDiff.healthDelta <= -5) {
          setPortfolioAlerts((prev) =>
            prev
              ? {
                  ...prev,
                  alerts: [
                    {
                      level: 'warning',
                      slug: data.repo.slug,
                      path: data.repo.path,
                      code: 'watch-regression',
                      message: `Monitor: health caiu ${data.scanDiff!.healthDelta} pts`,
                      action: 'scan',
                      health: data.health.overall,
                    },
                    ...prev.alerts,
                  ].slice(0, 20),
                }
              : prev,
          )
        }
      } catch {
        /* ignore watch errors */
      }
    }
    tick()
    const id = setInterval(tick, watchInterval * 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [watchOn, watchInterval, repoPath])

  useEffect(() => {
    if (!portfolioWatchOn || !portfolioRoot.trim()) return
    let cancelled = false

    async function loadLog() {
      try {
        const log = await getPortfolioWatchLog(12)
        if (!cancelled) setPortfolioWatchLog(log.items)
      } catch {
        /* ignore */
      }
    }

    async function tick() {
      if (busy || cancelled) return
      try {
        const run = await runPortfolioWatch(portfolioRoot.trim(), false, 5)
        if (cancelled) return
        setPortfolioWatchSummary(run.summary)
        await refreshPortfolio()
        await loadLog()
      } catch {
        /* ignore watch errors */
      }
    }

    loadLog()
    tick()
    const id = setInterval(tick, portfolioWatchInterval * 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [portfolioWatchOn, portfolioWatchInterval, portfolioRoot])

  async function refresh() {
    await refreshHistory()
    await refreshPortfolio()
  }

  async function loadRepoContext(path: string, analysisId?: number) {
    try {
      const ctx = await getRepoContext(path, analysisId)
      setRepoContext(ctx)
      setActiveSlug(ctx.slug)
      if (ctx.ownerRepo) setPrOwnerRepo(ctx.ownerRepo)
    } catch {
      setRepoContext(null)
    }
  }

  async function run(mode: 'quick' | 'deep', opts?: { validateRepo?: boolean; applyRules?: boolean }) {
    if (!repoPath.trim()) return alert('Informe caminho ou URL GitHub')
    setBusy(true)
    setValidation(null)
    setVerifyReport(null)
    try {
      const res = await analyze(repoPath.trim(), mode, {
        ...opts,
        validateRepo: opts?.validateRepo ?? validateOnScan,
      })
      const data = { ...res.data, analysisId: res.data.analysisId ?? res.id }
      setResult(data)
      if (data.repo?.path) await loadRepoContext(data.repo.path, data.analysisId)
      if (data.analysisId) await loadRecFeedback(data.analysisId)
      if (data.repo?.path) await loadCursorTasks(data.repo.path)
      if (data.repoValidation && !data.repoValidation.skipped) {
        setValidation(data.repoValidation)
      }
      if (data.repo?.slug) {
        try {
          setTrend(await getTrend(data.repo.slug))
        } catch {
          setTrend(data.healthTrend || null)
        }
      }
      await refreshHistory()
      refreshPortfolio()
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

  async function runPrComment(dryRun: boolean) {
    const n = Number(prNumber)
    if (!prOwnerRepo.trim() || !n) return alert('Informe owner/repo e número do PR')
    setBusy(true)
    try {
      const res = await postPrComment(prOwnerRepo.trim(), n, 'quick', dryRun)
      if (dryRun) {
        setPrPreview(res.preview || '')
      } else {
        alert(`Comentário publicado!\n${res.commentUrl || ''}`)
        setPrPreview(null)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro — configure GITHUB_TOKEN ou App (ver docs/GITHUB-APP.md)')
    } finally {
      setBusy(false)
    }
  }

  async function runApplyPilot(dryRun: boolean) {
    const path = result?.repo?.path || repoPath.trim()
    if (!path) return
    setBusy(true)
    try {
      const r = await applyPilot(path, dryRun)
      if (dryRun) {
        alert(`Plano: ${r.applied.planned.join(', ') || 'nada a aplicar'}`)
      } else {
        alert(`Health: ${r.before.health.summary} → ${r.after.health.summary} (${r.delta >= 0 ? '+' : ''}${r.delta})`)
        await run('quick')
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function runInstallHook() {
    const path = result?.repo?.path || repoPath.trim()
    if (!path) return
    setBusy(true)
    try {
      const r = await installHook(path)
      alert(`Hook instalado:\n${r.written}`)
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
      if (result.analysisId) await loadRecFeedback(result.analysisId)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    }
  }

  async function runCursorApply(recommendationId: string, autoPilot = false) {
    const path = result?.repo?.path || repoPath.trim()
    if (!path) return alert('Informe o repositório')
    setBusy(true)
    setCursorMsg(null)
    try {
      const r = await cursorApply(path, recommendationId, result?.analysisId, autoPilot)
      const hint = r.cursorHint || `@.cursor/max-stack/tasks/`
      await navigator.clipboard.writeText(hint.startsWith('@') ? hint : r.prompt)
      const lines = [
        r.written?.relative ? `Task: ${r.written.relative}` : 'Prompt gerado',
        r.cursorHint,
        'Referência copiada — abra Cursor Agent (Ctrl+I) e cole ou use @arquivo',
      ]
      if (r.pilotFix) lines.push(autoPilot ? `Pilot aplicado: ${r.pilotFix}` : `Pilot disponível: ${r.pilotFix}`)
      setCursorMsg(lines.join('\n'))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function runSuggestAction() {
    const path = result?.repo?.path || repoPath.trim()
    const request = actionRequest.trim()
    if (!path || !request) return alert('Informe repo e o que deseja fazer')
    setBusy(true)
    setSuggestions(null)
    setSuggestNote(null)
    setCursorMsg(null)
    try {
      const res = await suggestAction(path, request, result?.analysisId)
      setSuggestions(res.suggestions)
      setSuggestNote(res.note || null)
      if (res.suggestions.length === 0 && res.note) {
        alert(res.note)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function applySuggestion(s: ActionSuggestion, autoPilot = false) {
    await runCursorApply(s.id, autoPilot || Boolean(s.pilotFix && s.kind === 'pilot'))
  }

  async function runEvolve(dryRun: boolean) {
    const path = result?.repo?.path || repoPath.trim()
    if (!path) return
    setBusy(true)
    setEvolveResult(null)
    try {
      const r = await evolveRepo(path, dryRun)
      setEvolveResult(r)
      if (!dryRun && r.final?.analysisId) {
        await load(r.final.analysisId)
      } else if (r.context) {
        setRepoContext(r.context)
      }
      await refreshHistory()
      refreshPortfolio()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function handleAlertAction(alert: PortfolioAlert) {
    setRepoPath(alert.path)
    setActiveSlug(alert.slug)
    if (alert.action === 'evolve') await runEvolve(false)
    else await run('quick')
  }

  async function runPortfolioRescan() {
    setBusy(true)
    try {
      const p = await rescanPortfolio(portfolioRoot)
      setPortfolio({ summary: p.summary, items: p.items })
      await refreshPortfolio()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function runBatchEvolve(dryRun: boolean) {
    if (!portfolioAlerts?.summary.critical) {
      return alert('Nenhum alerta crítico no portfolio')
    }
    setBusy(true)
    setBatchEvolveResult(null)
    try {
      const r = await evolvePortfolioBatch(portfolioRoot, dryRun, 3)
      setBatchEvolveResult(r)
      await refreshPortfolio()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function runPublishIssues(dryRun: boolean) {
    if (!result?.analysisId) return alert('Faça uma análise primeiro')
    const ownerRepo = repoContext?.ownerRepo || result.repo?.ownerRepo || prOwnerRepo.trim() || undefined
    setBusy(true)
    setIssuesPublishResult(null)
    try {
      const r = await publishIssuesToGithub(result.analysisId, ownerRepo, dryRun)
      setIssuesPublishResult(r)
      if (!dryRun && r.count) {
        alert(`${r.count} issue(s) criada(s) em ${r.ownerRepo}`)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function runCompare() {
    const pathA = result?.repo?.path || repoPath.trim()
    if (!pathA || !compareTarget) return alert('Selecione repo ativo e um alvo no portfolio')
    const target = portfolio?.items.find((p) => p.slug === compareTarget)
    if (!target) return alert('Repo alvo não encontrado')
    setBusy(true)
    setCompareResult(null)
    try {
      setCompareResult(await compareRepos(pathA, target.path))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function exportReport() {
    if (!result?.analysisId) return alert('Faça uma análise primeiro')
    setBusy(true)
    try {
      const r = await getAnalysisReport(result.analysisId)
      await navigator.clipboard.writeText(r.markdown)
      alert(`Relatório copiado! (${r.slug})`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function exportPlan() {
    if (!result?.analysisId) return alert('Faça uma análise Deep primeiro')
    setBusy(true)
    try {
      const r = await getAnalysisPlan(result.analysisId)
      await navigator.clipboard.writeText(r.markdown)
      alert(`Plano (modo plan) copiado! (${r.slug}) — revise antes de aplicar`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function runContextAction(action: string) {
    switch (action) {
      case 'apply-batch':
        return runApplyBatch()
      case 'apply-pilot':
        return runApplyPilot(false)
      case 'validate':
        return runValidate()
      case 'cursor-batch':
        return runApplyBatch()
      case 'pr-preview':
        return runPrComment(true)
      case 'verify':
        return runVerify()
      default:
        return
    }
  }

  async function runApplyBatch() {
    const path = result?.repo?.path || repoPath.trim()
    if (!path) return
    setBusy(true)
    try {
      const r = await cursorApplyBatch(path, result?.analysisId, 2)
      await loadCursorTasks(path)
      alert(`${r.count} task(s) P1/P2 criadas em .cursor/max-stack/tasks/`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function runVerify() {
    const path = result?.repo?.path || repoPath.trim()
    if (!path) return
    setBusy(true)
    setVerifyReport(null)
    try {
      const report = await verifyImplementation(path, result?.analysisId)
      setVerifyReport(report)
      setResult((prev) =>
        prev && report.after.health?.categories
          ? { ...prev, health: report.after.health as AnalysisResult['health'] }
          : prev,
      )
      await loadCursorTasks(path)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  async function load(id: number) {
    const row = await getAnalysis(id)
    const data = { ...row.data, analysisId: id }
    setResult(data)
    if (id) await loadRecFeedback(id)
    if (row.data?.repo?.path) {
      setRepoPath(row.data.repo.path)
      await loadCursorTasks(row.data.repo.path)
      await loadRepoContext(row.data.repo.path, id)
    }
    if (row.slug) {
      setActiveSlug(row.slug)
      try {
        setTrend(await getTrend(row.slug))
      } catch {
        setTrend(null)
      }
    }
  }

  return (
    <div className="layout">
      {busy && (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="loading-box">
            <p>Analisando repositório…</p>
            <small className="note">Pode levar até 1 minuto em Deep Scan</small>
          </div>
        </div>
      )}
      <header>
        <h1>Max Stack</h1>
        <p>Auditoria local-first de repositórios</p>
        <span className="badge">{status}</span>
        {githubAuth && <span className="badge secondary-badge">GitHub: {githubAuth}</span>}
        {feedbackSummary && feedbackSummary.total > 0 && (
          <span className="badge secondary-badge">
            Feedback: {feedbackSummary.usefulPct}% útil ({feedbackSummary.total})
          </span>
        )}
      </header>

      <section className="card">
        <label>Repositório (local ou GitHub)</label>
        <input
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
          placeholder="c:\projeto ou https://github.com/org/repo"
        />
        <label className="checkbox-row">
          <input type="checkbox" checked={validateOnScan} onChange={(e) => setValidateOnScan(e.target.checked)} />
          Validar scripts (test/build/lint) junto com o scan
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={watchOn} onChange={(e) => setWatchOn(e.target.checked)} />
          Monitorar repo (re-scan automático)
        </label>
        {watchOn && (
          <div className="watch-row">
            <label>Intervalo (seg)</label>
            <select value={watchInterval} onChange={(e) => setWatchInterval(Number(e.target.value))}>
              <option value={60}>60</option>
              <option value={300}>300 (5 min)</option>
              <option value={900}>900 (15 min)</option>
              <option value={3600}>3600 (1 h)</option>
            </select>
          </div>
        )}
        {watchLog.length > 0 && (
          <ul className="watch-log">
            {watchLog.map((w, i) => (
              <li key={i}>
                {new Date(w.at).toLocaleTimeString('pt-BR')} — {w.health}
                {w.delta != null && ` (Δ ${w.delta >= 0 ? '+' : ''}${w.delta})`}
              </li>
            ))}
          </ul>
        )}
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
          <button disabled={busy} className="secondary" onClick={() => runApplyPilot(true)}>
            Preview P1/P2
          </button>
          <button disabled={busy} className="secondary" onClick={() => runApplyPilot(false)}>
            Aplicar P1/P2
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

      {repoContext && (
        <section className="card active-repo">
          <h2>Repo ativo</h2>
          <p>
            <strong>{repoContext.slug}</strong> · {repoContext.source}
            {repoContext.url && (
              <>
                {' '}
                · <a href={repoContext.url}>{repoContext.ownerRepo || repoContext.url}</a>
              </>
            )}
          </p>
          {repoContext.nextActions.length > 0 && (
            <>
              <p className="note">Próximos passos sugeridos com base no scan:</p>
              <ul className="next-actions">
                {repoContext.nextActions.map((a) => (
                  <li key={a.id}>
                    <strong>{a.title}</strong>
                    <span className="note"> — {a.detail}</span>
                    {a.action !== 'info' && (
                      <button type="button" className="tiny secondary" disabled={busy} onClick={() => runContextAction(a.action)}>
                        Executar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="row">
            <button type="button" className="cursor-btn" disabled={busy} onClick={() => runEvolve(false)}>
              Evoluir repo
            </button>
            <button type="button" className="secondary" disabled={busy} onClick={() => runEvolve(true)}>
              Preview evolução
            </button>
          </div>
          {evolveResult && (
            <div className={`verify-box verdict-${(evolveResult.verification?.verdict || 'stable').toLowerCase()}`}>
              <strong>{evolveResult.summary}</strong>
              {evolveResult.pilot?.planned?.length ? (
                <p className="note">Pilot: {evolveResult.pilot.planned.join(', ')}</p>
              ) : null}
              {evolveResult.verification?.checklist && (
                <ul>
                  {evolveResult.verification.checklist.map((c) => (
                    <li key={c.id} className={c.ok ? 'ok' : 'fail'}>
                      {c.label}: {c.detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      <section className="card">
        <h2>Comentário em PR (GitHub App)</h2>
        <p className="note">
          Requer GITHUB_TOKEN ou GitHub App — ver docs/GITHUB-APP.md
          {repoContext?.ownerRepo && prOwnerRepo === repoContext.ownerRepo && (
            <> · sincronizado com repo ativo</>
          )}
        </p>
        <label>owner/repo</label>
        <input value={prOwnerRepo} onChange={(e) => setPrOwnerRepo(e.target.value)} placeholder="RivasCode-Ops/Quadro-Negro" />
        <label>Número do PR</label>
        <input value={prNumber} onChange={(e) => setPrNumber(e.target.value)} placeholder="1" />
        <div className="row">
          <button type="button" disabled={busy} onClick={() => runPrComment(true)}>
            Preview
          </button>
          <button type="button" className="secondary" disabled={busy} onClick={() => runPrComment(false)}>
            Publicar comentário
          </button>
        </div>
        {prPreview && <pre className="rules-preview">{prPreview}</pre>}
      </section>

      <section className="card">
        <h2>Portfolio</h2>
        <label>Pasta raiz</label>
        <input value={portfolioRoot} onChange={(e) => setPortfolioRoot(e.target.value)} />
        <button type="button" className="secondary" disabled={busy} onClick={() => refresh()}>
          Atualizar portfolio
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={runPortfolioRescan}>
          Re-scan portfolio
        </button>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={portfolioWatchOn}
            onChange={(e) => setPortfolioWatchOn(e.target.checked)}
          />
          Monitorar portfolio (alertas)
        </label>
        {portfolioWatchOn && (
          <div className="watch-row">
            <span>Intervalo</span>
            <select value={portfolioWatchInterval} onChange={(e) => setPortfolioWatchInterval(Number(e.target.value))}>
              <option value={300}>5 min</option>
              <option value={600}>10 min</option>
              <option value={1800}>30 min</option>
              <option value={3600}>1 h</option>
            </select>
            <button
              type="button"
              className="tiny secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  const run = await runPortfolioWatch(portfolioRoot, true, 5)
                  setPortfolioWatchSummary(run.summary)
                } catch (e) {
                  alert(e instanceof Error ? e.message : 'Erro')
                } finally {
                  setBusy(false)
                }
              }}
            >
              Preview watch
            </button>
          </div>
        )}
        {portfolioWatchSummary && <p className="hint">{portfolioWatchSummary}</p>}
        {portfolioWatchLog.length > 0 && (
          <ul className="watch-log">
            {portfolioWatchLog.map((w, i) => (
              <li key={`${w.slug}-${w.at}-${i}`}>
                {new Date(w.at).toLocaleTimeString('pt-BR')} · {w.slug} · {w.message || '—'}
                {w.health_delta != null ? ` · Δ ${w.health_delta >= 0 ? '+' : ''}${w.health_delta}` : ''}
              </li>
            ))}
          </ul>
        )}
        {portfolioAlerts && portfolioAlerts.summary.total > 0 && (
          <div className="alerts-box">
            <strong>
              Alertas: {portfolioAlerts.summary.critical} críticos · {portfolioAlerts.summary.warning} avisos ·{' '}
              {portfolioAlerts.summary.info} info
            </strong>
            {portfolioAlerts.summary.critical > 0 && (
              <div className="row">
                <button type="button" className="cursor-btn" disabled={busy} onClick={() => runBatchEvolve(false)}>
                  Evoluir críticos (até 3)
                </button>
                <button type="button" className="secondary" disabled={busy} onClick={() => runBatchEvolve(true)}>
                  Preview batch
                </button>
              </div>
            )}
            {batchEvolveResult && (
              <div className="batch-box">
                <strong>{batchEvolveResult.summary}</strong>
                <ul className="batch-log">
                  {batchEvolveResult.results.map((r) => (
                    <li key={r.slug} className={r.ok ? 'ok' : 'fail'}>
                      {r.slug}: {r.ok ? r.summary : r.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ul className="alerts-list">
              {portfolioAlerts.alerts.slice(0, 8).map((a) => (
                <li key={`${a.slug}-${a.code}`} className={`alert-${a.level}`}>
                  <strong>{a.slug}</strong> — {a.message}
                  <button type="button" className="tiny secondary" disabled={busy} onClick={() => handleAlertAction(a)}>
                    {a.action === 'evolve' ? 'Evoluir' : 'Scan'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {portfolio && (
          <>
            <p>
              {portfolio.summary.total} repos · média {portfolio.summary.averageHealth}/100 ·{' '}
              {portfolio.summary.needsAttention.length} precisam atenção (&lt;70)
            </p>
            {portfolio.chart && (
              <PortfolioHealthChart
                bars={portfolio.chart.bars}
                buckets={portfolio.chart.buckets}
                averageHealth={portfolio.chart.averageHealth}
              />
            )}
            {portfolio.history && (
              <>
                <h3 className="subhead">Histórico multi-repo</h3>
                <PortfolioHistoryPanel
                  repos={portfolio.history.repos}
                  summary={portfolio.history.summary}
                  onSelect={(path, slug) => {
                    setRepoPath(path)
                    setActiveSlug(slug)
                  }}
                />
              </>
            )}
            {activeSlug && portfolio.items.length > 1 && (
              <div className="compare-row">
                <label>Comparar {activeSlug} com</label>
                <select value={compareTarget} onChange={(e) => setCompareTarget(e.target.value)}>
                  <option value="">— selecione —</option>
                  {portfolio.items
                    .filter((p) => p.slug !== activeSlug)
                    .map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.slug} ({p.health != null ? `${p.health}/100` : '—'})
                      </option>
                    ))}
                </select>
                <button type="button" className="secondary" disabled={busy || !compareTarget} onClick={runCompare}>
                  Comparar
                </button>
              </div>
            )}
            {compareResult && (
              <div className="compare-box">
                <strong>{compareResult.summary}</strong>
                <p className="note">
                  {compareResult.a.slug} {compareResult.a.health} vs {compareResult.b.slug} {compareResult.b.health}
                </p>
                {compareResult.categoryCompare.length > 0 && (
                  <ul>
                    {compareResult.categoryCompare.slice(0, 6).map((c) => (
                      <li key={c.id}>
                        {c.id}: {c.delta >= 0 ? '+' : ''}
                        {c.delta}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className="tiny secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(compareResult.markdown || '')
                    alert('Comparação copiada!')
                  }}
                >
                  Copiar comparação
                </button>
              </div>
            )}
            <table className="trend-table">
              <thead>
                <tr>
                  <th>Repo</th>
                  <th>Health</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {portfolio.items.slice(0, 12).map((p) => (
                  <tr key={p.slug} className={p.slug === activeSlug ? 'portfolio-active' : ''}>
                    <td>{p.slug}</td>
                    <td>{p.health != null ? `${p.health}/100` : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="link"
                        onClick={() => {
                          setRepoPath(p.path)
                          setActiveSlug(p.slug)
                        }}
                      >
                        analisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {result && (
        <>
          <section className="card">
            <h2>Resumo</h2>
            <div className="row">
              <button type="button" className="tiny secondary" disabled={busy || !result.analysisId} onClick={exportReport}>
                Exportar relatório
              </button>
              <button type="button" className="tiny secondary" disabled={busy || !result.analysisId} onClick={exportPlan} title="Backlog + PR plan + checklist — sem apply automático">
                Exportar plano
              </button>
            </div>
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
              {(result.health.categories || []).map((c) => (
                <li key={c.id} className={c.status}>
                  {c.label || c.id}: {c.status} ({c.score}/{c.weight})
                </li>
              ))}
            </ul>
          </section>

          {trend && trend.points.length > 0 && (
            <section className="card">
              <h2>Tendência de health</h2>
              <HealthTrendChart points={trend.points} trend={trend.trend} delta={trend.delta} />
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
                {(result.repoValidation.results || []).map((r) => (
                  <li key={r.script} className={r.ok ? 'ok' : 'fail'}>
                    npm run {r.script} — {r.ok ? 'OK' : 'FAIL'}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {result.gitHistory?.available && result.gitHistory.metrics && (
            <section className="card">
              <h2>Git (90 dias)</h2>
              <p>{result.gitHistory.metrics.commitCount} commits</p>
              {result.gitHistory.metrics.topFiles?.length > 0 && (
                <ul>
                  {result.gitHistory.metrics.topFiles.map((f) => (
                    <li key={f.file}>
                      {f.file} — {f.count} commits
                    </li>
                  ))}
                </ul>
              )}
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
            <h2>O que você quer fazer?</h2>
            <p className="note">
              Descreva a ação desejada — Max busca recomendações, achados e gaps do projeto e sugere implementações.
            </p>
            <textarea
              className="action-input"
              rows={3}
              value={actionRequest}
              onChange={(e) => setActionRequest(e.target.value)}
              placeholder="Ex.: adicionar testes, configurar CI, melhorar segurança, refatorar main.js…"
            />
            <div className="row">
              <button type="button" disabled={busy} onClick={runSuggestAction}>
                Buscar melhor opção
              </button>
            </div>
            {suggestNote && !suggestions?.length && <p className="note">{suggestNote}</p>}
            {suggestions && suggestions.length > 0 && (
              <ul className="suggestions">
                {suggestions.map((s) => (
                  <li key={`${s.kind}-${s.id}`} className="suggestion-item">
                    <div className="suggestion-head">
                      <strong>
                        [{s.kind}] {s.title}
                      </strong>
                      <span className="suggestion-score">score {s.score}</span>
                    </div>
                    {s.subtitle && <p className="note">{s.subtitle}</p>}
                    {s.written?.relative && <small className="note">Task: {s.written.relative}</small>}
                    <div className="row feedback-row">
                      <button type="button" className="tiny cursor-btn" disabled={busy} onClick={() => applySuggestion(s)}>
                        Aplicar no Cursor
                      </button>
                      {s.pilotFix && (
                        <button
                          type="button"
                          className="tiny secondary"
                          disabled={busy}
                          onClick={() => applySuggestion(s, true)}
                        >
                          + pilot ({s.pilotFix})
                        </button>
                      )}
                      <button
                        type="button"
                        className="tiny secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(s.prompt)
                          alert('Prompt copiado!')
                        }}
                      >
                        Copiar prompt
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {cursorMsg && <pre className="cursor-msg">{cursorMsg}</pre>}
          </section>

          <section className="card">
            <h2>Recomendações ({result.recommendations?.length || 0})</h2>
            <div className="row">
              <button type="button" className="tiny cursor-btn" disabled={busy} onClick={runApplyBatch}>
                Aplicar todas P1/P2 no Cursor
              </button>
              <button type="button" className="tiny secondary" disabled={busy} onClick={runVerify}>
                Verificar implementação
              </button>
            </div>
            {verifyReport && (
              <div className={`verify-box verdict-${verifyReport.verdict.toLowerCase()}`}>
                <strong>{verifyReport.verdict}</strong> — {verifyReport.summary}
                <ul>
                  {verifyReport.checklist.map((c) => (
                    <li key={c.id} className={c.ok ? 'ok' : 'fail'}>
                      {c.label}: {c.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.recommendations?.map((r) => (
              <article key={r.id} className="rec">
                <strong>
                  [P{r.priority}] {r.title}
                </strong>
                <p>{r.suggestedUpgrade || r.problem}</p>
                <div className="row feedback-row">
                  <button
                    type="button"
                    className="tiny cursor-btn"
                    disabled={busy}
                    onClick={() => runCursorApply(r.id)}
                  >
                    Aplicar no Cursor
                  </button>
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
                  {recFeedback?.[r.id] && (recFeedback[r.id].useful > 0 || recFeedback[r.id].notUseful > 0) && (
                    <span className="note rec-stats">
                      👍 {recFeedback[r.id].useful} · 👎 {recFeedback[r.id].notUseful}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </section>

          {cursorTasks.length > 0 && (
            <section className="card">
              <h2>Tasks Cursor ({cursorTasks.length})</h2>
              <p className="note">Arquivos em .cursor/max-stack/tasks/ — referencie no Agent com @arquivo</p>
              <ul className="suggestions">
                {cursorTasks.map((t) => (
                  <li key={t.filename} className="suggestion-item">
                    <strong>{t.title}</strong>
                    <small className="note">{t.relative} · {new Date(t.modifiedAt).toLocaleString('pt-BR')}</small>
                    <div className="row feedback-row">
                      <button
                        type="button"
                        className="tiny secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(t.cursorHint)
                          alert('Referência copiada!')
                        }}
                      >
                        Copiar @{t.filename}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

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

          {result.issuesMarkdown && (
            <section className="card">
              <h2>Issues GitHub (sugeridas)</h2>
              <div className="row">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(result.issuesMarkdown || '')
                    alert('Issues copiadas!')
                  }}
                >
                  Copiar issues
                </button>
                <button type="button" className="cursor-btn" disabled={busy || !result.analysisId} onClick={() => runPublishIssues(false)}>
                  Publicar no GitHub
                </button>
                <button type="button" className="secondary" disabled={busy || !result.analysisId} onClick={() => runPublishIssues(true)}>
                  Preview publicar
                </button>
              </div>
              {issuesPublishResult && (
                <div className="batch-box">
                  <strong>
                    {issuesPublishResult.dryRun ? 'Preview' : 'Publicado'} — {issuesPublishResult.ownerRepo} ({issuesPublishResult.count})
                  </strong>
                  <ul className="batch-log">
                    {issuesPublishResult.issues.map((i) => (
                      <li key={i.title}>
                        {i.title}
                        {i.url ? ` → ${i.url}` : i.preview ? ' (preview)' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <pre className="rules-preview">{result.issuesMarkdown.slice(0, 900)}…</pre>
            </section>
          )}

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
                <button type="button" className="secondary" disabled={busy} onClick={runInstallHook}>
                  Instalar pre-commit hook
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
