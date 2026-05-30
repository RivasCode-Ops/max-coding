/**
 * Gráfico de health do portfolio — Fase 15
 */

export function healthBarColor(health) {
  if (health >= 90) return '#22c55e'
  if (health >= 70) return '#38bdf8'
  if (health >= 50) return '#f59e0b'
  return '#ef4444'
}

export function buildPortfolioChartData(items, options = {}) {
  const limit = options.limit ?? 14
  const withHealth = items.filter((i) => typeof i.health === 'number')
  const bars = [...withHealth]
    .sort((a, b) => b.health - a.health)
    .slice(0, limit)
    .map((i) => ({
      slug: i.slug,
      health: i.health,
      grade: i.grade || gradeFromHealth(i.health),
      color: healthBarColor(i.health),
    }))

  const buckets = {
    excellent: withHealth.filter((i) => i.health >= 90).length,
    good: withHealth.filter((i) => i.health >= 70 && i.health < 90).length,
    attention: withHealth.filter((i) => i.health < 70).length,
  }

  const avg = withHealth.length
    ? Math.round(withHealth.reduce((s, i) => s + i.health, 0) / withHealth.length)
    : 0

  return {
    bars,
    buckets,
    averageHealth: avg,
    total: items.length,
    withHealth: withHealth.length,
  }
}

function gradeFromHealth(health) {
  if (health >= 90) return 'A'
  if (health >= 80) return 'B'
  if (health >= 70) return 'C'
  if (health >= 60) return 'D'
  return 'F'
}

export function portfolioChartSvg(chart, options = {}) {
  const width = options.width ?? 360
  const rowH = 18
  const pad = { top: 8, right: 12, bottom: 8, left: 96 }
  const barMaxW = width - pad.left - pad.right - 36
  const height = pad.top + pad.bottom + chart.bars.length * rowH

  if (!chart.bars.length) {
    return `<svg width="${width}" height="80" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" fill="#94a3b8" font-size="12" text-anchor="middle">Sem dados de health</text>
    </svg>`
  }

  const rows = chart.bars
    .map((b, i) => {
      const y = pad.top + i * rowH + 12
      const w = Math.max(2, (b.health / 100) * barMaxW)
      return `<text x="${pad.left - 6}" y="${y}" fill="#94a3b8" font-size="11" text-anchor="end">${b.slug.slice(0, 14)}</text>
      <rect x="${pad.left}" y="${y - 10}" width="${w}" height="12" rx="2" fill="${b.color}"/>
      <text x="${pad.left + w + 4}" y="${y}" fill="#e2e8f0" font-size="10">${b.health}</text>`
    })
    .join('')

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img">
    ${rows}
  </svg>`
}
