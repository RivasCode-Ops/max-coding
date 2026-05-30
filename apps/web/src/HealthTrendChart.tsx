import type { HealthTrendPoint } from './types'

type Props = {
  points: HealthTrendPoint[]
  trend?: string
  delta?: number
}

export default function HealthTrendChart({ points, trend, delta }: Props) {
  if (!points?.length) {
    return <p className="note">Sem histórico de scans para gráfico.</p>
  }

  const width = 360
  const height = 120
  const pad = { top: 14, right: 14, bottom: 28, left: 36 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const values = points.map((p) => p.health_overall)
  const min = Math.max(0, Math.min(...values) - 5)
  const max = Math.min(100, Math.max(...values) + 5)
  const range = max - min || 1

  const dots = points.map((p, i) => {
    const x = pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
    const y = pad.top + innerH - ((p.health_overall - min) / range) * innerH
    return { x, y, ...p }
  })

  const polyline = dots.map((d) => `${d.x},${d.y}`).join(' ')
  const gridValues = [max, Math.round((min + max) / 2), min]

  return (
    <div className="trend-chart-wrap">
      {trend != null && (
        <p className="trend-label">
          {trend === 'up' && '↑ Subindo'}
          {trend === 'down' && '↓ Caindo'}
          {trend === 'stable' && '→ Estável'}
          {delta != null && (
            <>
              {' '}
              · {delta >= 0 ? '+' : ''}
              {delta} pts
            </>
          )}
        </p>
      )}
      <svg width={width} height={height} className="trend-chart" role="img" aria-label="Gráfico de health">
        {gridValues.map((v) => {
          const y = pad.top + innerH - ((v - min) / range) * innerH
          return (
            <g key={v}>
              <line x1={pad.left} y1={y} x2={pad.left + innerW} y2={y} stroke="#334155" strokeWidth={1} />
              <text x={pad.left - 6} y={y + 4} fill="#64748b" fontSize={10} textAnchor="end">
                {v}
              </text>
            </g>
          )
        })}
        <polyline points={polyline} fill="none" stroke="#38bdf8" strokeWidth={2} />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={4} fill="#38bdf8">
            <title>
              {d.health_overall}/100 — {new Date(d.created_at).toLocaleString('pt-BR')}
            </title>
          </circle>
        ))}
      </svg>
    </div>
  )
}
