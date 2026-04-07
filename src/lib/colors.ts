// Choropleth color scale, 7 stops from low to high.
export const CHORO_COLORS = [
  '#1a1f35',
  '#1b3a5c',
  '#1a6b6a',
  '#2f9e4f',
  '#85c531',
  '#f5c542',
  '#f94144',
]

export function dynamicBreaks(values: Array<number>, steps = CHORO_COLORS.length) {
  const max = Math.max(...values, 1)
  const raw = Array.from({ length: steps }, (_, i) => Math.round(max * (i / steps)))
  // Mapbox "step" expressions require strictly ascending input values.
  // When max is small, rounding can produce duplicates, so deduplicate and
  // keep ascending order so the expression is always valid.
  const unique = [...new Set(raw)].sort((a, b) => a - b)
  // Pad back to the expected length with ascending values beyond max
  while (unique.length < steps) {
    unique.push(unique[unique.length - 1] + 1)
  }
  return unique
}

// Category chart colors
export const CATEGORY_COLORS = [
  '#4f6ef7',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#e11d48',
  '#0ea5e9',
  '#d946ef',
  '#fbbf24',
  '#10b981',
  '#f43f5e',
  '#7c3aed',
  '#2dd4bf',
  '#fb923c',
]

// Crime choropleth scale
export const CRIME_COLORS = [
  '#1a1f35',
  '#4a1942',
  '#7a1b3a',
  '#a8332b',
  '#d4601a',
  '#f5a623',
  '#f94144',
]

// Demographics choropleth scale
export const DEMO_COLORS = [
  '#1a1f35',
  '#1e2d5c',
  '#234480',
  '#2b5ea2',
  '#3b82f6',
  '#7c3aed',
  '#a855f7',
]

// Vacancy triage colors, low (red) to high (green), 5 stops.
export const VACANCY_COLORS = ['#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641']

const VACANCY_LABELS = ['Bottom 20%', 'Lower', 'Middle', 'Upper', 'Top 20%']

// Compute percentile-based breaks from an array of scores
export function percentileBreaks(scores: Array<number>, buckets = 5): Array<number> {
  if (scores.length === 0) return Array.from({ length: buckets }, () => 0)
  const sorted = [...scores].sort((a, b) => a - b)
  return Array.from({ length: buckets }, (_, i) => {
    const idx = Math.min(Math.floor((i / buckets) * sorted.length), sorted.length - 1)
    return sorted[idx]
  })
}

// Build legend items from percentile breaks
export function vacancyLegendItems(breaks: Array<number>) {
  return VACANCY_COLORS.map((color, i) => {
    const lo = breaks[i] ?? 0
    const hi = i < breaks.length - 1 ? (breaks[i + 1] ?? 100) - 1 : 100
    return { color, label: `${VACANCY_LABELS[i]} (${lo}–${hi})` }
  }).reverse()
}

// Equity score severity
export function equitySeverity(score: number) {
  if (score < 30) return 'high' as const
  if (score < 60) return 'medium' as const
  return 'low' as const
}
