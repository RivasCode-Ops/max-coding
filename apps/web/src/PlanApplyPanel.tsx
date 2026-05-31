import { useEffect, useMemo, useState } from 'react'
import { applyPlanItems, getPlanApplyView } from './api'
import type { PlanApplyResult, PlanApplyView, VerificationReport } from './types'

type Props = {
  analysisId: number
  repoPath?: string
  busy: boolean
  setBusy: (v: boolean) => void
  standaloneMode?: boolean
  onTasksCreated?: () => void
  onVerified?: (report: VerificationReport) => void
}

export default function PlanApplyPanel({
  analysisId,
  busy,
  setBusy,
  standaloneMode = true,
  onTasksCreated,
  onVerified,
}: Props) {
  const [view, setView] = useState<PlanApplyView | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [lastRun, setLastRun] = useState<PlanApplyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const v = await getPlanApplyView(analysisId)
        if (cancelled) return
        setView(v)
        const initial: Record<string, boolean> = {}
        for (const item of v.items) {
          const pick = standaloneMode ? item.localApplyable : item.applyable
          if (pick && item.suggested) initial[item.backlogId] = true
        }
        setSelected(initial)
        setError(null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro ao carregar plano')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [analysisId, standaloneMode])

  const approvedIds = useMemo(
    () => Object.entries(selected).filter(([, on]) => on).map(([id]) => id),
    [selected],
  )

  async function run(verifyAfter: boolean) {
    if (!approvedIds.length) return alert('Selecione ao menos um item do backlog')
    setBusy(true)
    setLastRun(null)
    try {
      const mode = standaloneMode ? 'local' : 'cursor'
      const run = await applyPlanItems(analysisId, approvedIds, verifyAfter, false, mode)
      setLastRun(run)
      if (run.apply.count && !standaloneMode) onTasksCreated?.()
      if (run.verify) onVerified?.(run.verify)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBusy(false)
    }
  }

  if (error) return <p className="note">{error}</p>
  if (!view) return <p className="note">Carregando plano…</p>
  if (!view.items.length) return <p className="note">Backlog vazio nesta análise.</p>

  return (
    <div className="plan-apply-wrap">
      <p className="note">
        {standaloneMode
          ? 'Modo local: aplica fixes automáticos (SECURITY, LICENSE, ESLint, etc.) sem Cursor.'
          : view.authorization.notice}
      </p>
      <ul className="plan-apply-list">
        {view.items.map((item) => {
          const canApply = standaloneMode ? item.localApplyable : item.applyable
          return (
            <li key={item.backlogId} className={canApply ? '' : 'disabled'}>
              <label className="inline-check">
                <input
                  type="checkbox"
                  disabled={!canApply || busy}
                  checked={Boolean(selected[item.backlogId])}
                  onChange={(e) => setSelected((s) => ({ ...s, [item.backlogId]: e.target.checked }))}
                />
                <strong>P{item.priority}</strong> {item.title}
                {item.pilotFix && standaloneMode && (
                  <span className="note"> · fix local: {item.pilotFix}</span>
                )}
                {!canApply && standaloneMode && <span className="note"> (sem fix automático)</span>}
                {!item.applyable && !standaloneMode && <span className="note"> (sem rec Cursor)</span>}
              </label>
            </li>
          )
        })}
      </ul>
      <div className="row">
        <button type="button" className="cursor-btn" disabled={busy || !approvedIds.length} onClick={() => run(false)}>
          {standaloneMode ? 'Aplicar localmente' : 'Aplicar aprovados (Cursor)'}
        </button>
        <button type="button" className="secondary" disabled={busy || !approvedIds.length} onClick={() => run(true)}>
          Aplicar + verificar
        </button>
      </div>
      {lastRun && (
        <div className="batch-box">
          <strong>{lastRun.summary}</strong>
          <ul className="batch-log">
            {lastRun.apply.applied.map((a) => (
              <li key={a.backlogId} className="ok">
                {a.title}
                {a.result && 'summary' in a.result && a.result.summary ? ` → ${a.result.summary}` : ''}
                {!standaloneMode && a.result && 'written' in a.result && a.result.written
                  ? ` → ${a.result.written.relative}`
                  : ''}
              </li>
            ))}
            {lastRun.apply.skipped
              .filter((s) => s.reason !== 'not-approved')
              .map((s) => (
                <li key={`skip-${s.title}`} className="fail">
                  {s.title}: {s.reason}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
