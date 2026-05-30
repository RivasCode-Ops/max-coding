/**
 * Pontos de health para gráfico SVG (Fase 6)
 */
export function buildTrendChartData(points, options = {}) {
  const width = options.width ?? 320
  const height = options.height ?? 100
  const pad = { top: 12, right: 12, bottom: 24, left: 32 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  if (!points?.length) {
    return { width, height, empty: true, polyline: '', dots: [] }
  }

  const values = points.map((p) => p.health_overall ?? 0)
  const min = Math.max(0, Math.min(...values) - 5)
  const max = Math.min(100, Math.max(...values) + 5)
  const range = max - min || 1

  const dots = points.map((p, i) => {
    const x = pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
    const y = pad.top + innerH - ((p.health_overall - min) / range) * innerH
    return { x, y, value: p.health_overall, date: p.created_at }
  })

  const polyline = dots.map((d) => `${d.x},${d.y}`).join(' ')

  return {
    width,
    height,
    empty: false,
    polyline,
    dots,
    min,
    max,
    pad,
    innerW,
    innerH,
  }
}

export function trendChartSvg(points, options = {}) {
  const chart = buildTrendChartData(points, options)
  if (chart.empty) {
    return `<svg width="${chart.width}" height="${chart.height}" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" fill="#94a3b8" font-size="12" text-anchor="middle">Sem histórico</text>
    </svg>`
  }

  const gridY = [chart.min, Math.round((chart.min + chart.max) / 2), chart.max]
  const gridLines = gridY
    .map((v) => {
      const y = chart.pad.top + chart.innerH - ((v - chart.min) / (chart.max - chart.min || 1)) * chart.innerH
      return `<line x1="${chart.pad.left}" y1="${y}" x2="${chart.pad.left + chart.innerW}" y2="${y}" stroke="#334155" stroke-width="1"/>`
    })
    .join('')

  const dots = chart.dots
    .map((d) => `<circle cx="${d.x}" cy="${d.y}" r="4" fill="#38bdf8"/>`)
    .join('')

  return `<svg width="${chart.width}" height="${chart.height}" xmlns="http://www.w3.org/2000/svg" role="img">
    ${gridLines}
    <polyline points="${chart.polyline}" fill="none" stroke="#38bdf8" stroke-width="2"/>
    ${dots}
    <text x="${chart.pad.left - 4}" y="${chart.pad.top + 4}" fill="#64748b" font-size="10" text-anchor="end">${chart.max}</text>
    <text x="${chart.pad.left - 4}" y="${chart.pad.top + chart.innerH}" fill="#64748b" font-size="10" text-anchor="end">${chart.min}</text>
  </svg>`
}
