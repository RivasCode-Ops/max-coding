import type { QualitySignals } from './types'

type Props = {
  quality: QualitySignals
}

export default function QualitySignalsPanel({ quality }: Props) {
  return (
    <div className="quality-signals-wrap">
      <p className="note">
        {quality.summary.passed}/{quality.summary.total} sinais ok ({quality.summary.pct}%)
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
