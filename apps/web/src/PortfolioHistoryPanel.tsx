import type { PortfolioHistoryRepo, PortfolioHistorySummary } from './types'

type Props = {
  repos: PortfolioHistoryRepo[]
  summary: PortfolioHistorySummary
  onSelect?: (path: string, slug: string) => void
}

function trendLabel(trend: string, delta: number) {
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  const sign = delta >= 0 ? '+' : ''
  return `${arrow} ${sign}${delta} pts`
}

function sparkline(points: PortfolioHistoryRepo['points'], trend: string) {
  const width = 100
  const height = 28
  if (!points.length) return null
  const values = points.map((p) => p.health)
  const min = Math.max(0, Math.min(...values) - 3)
  const max = Math.min(100, Math.max(...values) + 3)
  const range = max - min || 1
  const pad = 2
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const coords = points.map((p, i) => {
    const x = pad + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
    const y = pad + innerH - ((p.health - min) / range) * innerH
    return `${x},${y}`
  })
  const stroke = trend === 'down' ? '#ef4444' : trend === 'up' ? '#22c55e' : '#38bdf8'
  return (
    <svg width={width} height={height} className="history-spark" role="img" aria-hidden>
      <polyline points={coords.join(' ')} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  )
}

export default function PortfolioHistoryPanel({ repos, summary, onSelect }: Props) {
  if (!repos.length) {
    return <p className="note">Sem histórico (rode 2+ scans por repo no SQLite).</p>
  }

  return (
    <div className="portfolio-history-wrap">
      <p className="note">
        {summary.tracked} repos · ↑{summary.improving} · ↓{summary.declining} · →{summary.stable} ·{' '}
        {summary.withHistory} com evolução
      </p>
      <table className="history-table">
        <thead>
          <tr>
            <th>Repo</th>
            <th>Atual</th>
            <th>Tendência</th>
            <th>Histórico</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {repos.map((r) => (
            <tr key={r.slug} className={`trend-${r.trend}`}>
              <td>{r.slug}</td>
              <td>{r.currentHealth}/100</td>
              <td>{trendLabel(r.trend, r.delta)}</td>
              <td>{sparkline(r.points, r.trend)}</td>
              <td>
                {onSelect && (
                  <button type="button" className="link" onClick={() => onSelect(r.path, r.slug)}>
                    abrir
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
