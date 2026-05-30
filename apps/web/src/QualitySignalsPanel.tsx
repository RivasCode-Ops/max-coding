import type { QualitySignals } from './types'

type Props = {
  quality: QualitySignals
}

export default function QualitySignalsPanel({ quality }: Props) {
  const summary = quality.summary ?? { passed: 0, total: 0, pct: 0 }
  return (
    <div className="quality-signals-wrap">
      <p className="note">
        {summary.passed}/{summary.total} sinais ok ({summary.pct}%)
      </p>
      <ul className="quality-groups">
        {quality.groups.map((g) => (
          <li key={g.id}>
            <strong>{g.label}</strong> — {g.passed}/{g.total} ({g.pct}%)
          </li>
        ))}
      </ul>
      <ul className="quality-checks">
        {quality.checks.map((c) => (
          <li key={c.id} className={c.ok ? 'ok' : 'gap'}>
            {c.ok ? '✓' : '○'} {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
