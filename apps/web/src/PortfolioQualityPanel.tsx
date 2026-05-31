import type { PortfolioQualityReport } from './types'

type Props = {
  report: PortfolioQualityReport
}

export default function PortfolioQualityPanel({ report }: Props) {
  return (
    <div className="portfolio-quality-wrap">
      <p className="note">
        {report.summary.repoCount} repos · média {report.summary.averagePct}% · fracos:{' '}
        {report.summary.weakestChecks.map((c) => c.label).join(', ') || '—'}
      </p>
      <table className="history-table">
        <thead>
          <tr>
            <th>Repo</th>
            <th>Sinais</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {report.repos.slice(0, 12).map((r) => (
            <tr key={r.slug}>
              <td>{r.slug}</td>
              <td>
                {r.passed}/{r.total}
              </td>
              <td>{r.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {report.summary.weakestChecks.length > 0 && (
        <>
          <h3 className="subhead">Adoção por sinal (portfolio)</h3>
          <ul className="quality-checks">
            {report.summary.weakestChecks.map((c) => (
              <li key={c.id} className={c.pct >= 70 ? 'ok' : 'gap'}>
                {c.pct}% — {c.label} ({c.passed}/{c.total} repos)
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
