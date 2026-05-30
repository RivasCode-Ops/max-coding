import type { PortfolioChartBar, PortfolioChartBuckets } from './types'

type Props = {
  bars: PortfolioChartBar[]
  buckets: PortfolioChartBuckets
  averageHealth: number
}

export default function PortfolioHealthChart({ bars, buckets, averageHealth }: Props) {
  if (!bars.length) {
    return <p className="note">Sem repos com health no portfolio.</p>
  }

  return (
    <div className="portfolio-chart-wrap">
      <p className="note">
        Média {averageHealth}/100 · {buckets.excellent} excelentes (≥90) · {buckets.good} ok (70–89) ·{' '}
        {buckets.attention} atenção (&lt;70)
      </p>
      <ul className="portfolio-bars">
        {bars.map((b) => (
          <li key={b.slug}>
            <span className="bar-label" title={b.slug}>
              {b.slug}
            </span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${b.health}%`, background: b.color }} />
            </div>
            <span className="bar-value">
              {b.health} {b.grade ? `(${b.grade})` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
