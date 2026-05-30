import type { PortfolioHeatmap } from './types'

type Props = {
  heatmap: PortfolioHeatmap
}

export default function PortfolioHeatmapPanel({ heatmap }: Props) {
  if (!heatmap.columns.length) {
    return <p className="note">Sem repos para heatmap.</p>
  }

  return (
    <div className="portfolio-heatmap-wrap">
      <p className="note">
        {heatmap.summary?.repoCount ?? heatmap.columns.length} repos · fraquezas:{' '}
        {(heatmap.summary?.weakestCategories ?? []).map((w) => w.label).join(', ') || '—'}
      </p>
      <div className="heatmap-scroll">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th>Categoria</th>
              {heatmap.columns.map((c) => (
                <th key={c.slug} title={c.slug}>
                  {c.slug.slice(0, 8)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.rows.map((row) => (
              <tr key={row.id}>
                <td className="heatmap-label" title={row.label}>
                  {row.label}
                </td>
                {row.cells.map((cell) => (
                  <td key={`${row.id}-${cell.slug}`}>
                    <span
                      className="heatmap-cell"
                      style={{ background: cell.color }}
                      title={`${cell.slug}: ${cell.pct}%`}
                    >
                      {cell.pct}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
