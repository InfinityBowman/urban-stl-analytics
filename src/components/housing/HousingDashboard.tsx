import { useEffect, useMemo, useState } from 'react'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { HousingKpiCards } from './HousingKpiCards'
import type { HousingData } from '@/lib/types'

type Metric = 'rent' | 'value'

export function HousingDashboard() {
  const [housing, setHousing] = useState<HousingData | null>(null)
  const [error, setError] = useState(false)
  const [metric, setMetric] = useState<Metric>('rent')

  useEffect(() => {
    fetch('/data/housing.json')
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
      .then(setHousing)
      .catch(() => setError(true))
  }, [])

  const topNeighborhoods = useMemo(() => {
    if (!housing) return []
    return Object.entries(housing.neighborhoods)
      .map(([, n]) => ({
        name: n.name,
        value: metric === 'rent' ? (n.medianRent ?? 0) : (n.medianHomeValue ?? 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [housing, metric])

  const bottomNeighborhoods = useMemo(() => {
    if (!housing) return []
    return Object.entries(housing.neighborhoods)
      .map(([, n]) => ({
        name: n.name,
        value: metric === 'rent' ? (n.medianRent ?? 0) : (n.medianHomeValue ?? 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => a.value - b.value)
      .slice(0, 10)
  }, [housing, metric])

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Failed to load housing data. Run the data pipeline with CENSUS_API_KEY set.
        </p>
      </div>
    )
  }

  if (!housing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading housing data...</p>
      </div>
    )
  }

  const metricLabel = metric === 'rent' ? 'Median Rent' : 'Median Home Value'
  const valueLabel = metric === 'rent' ? 'Rent ($)' : 'Home Value ($)'

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Housing Prices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Census ACS 5-Year estimates ({housing.year}) across St. Louis neighborhoods
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(['rent', 'value'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                metric === m
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'rent' ? 'Median Rent' : 'Home Value'}
            </button>
          ))}
        </div>
      </div>

      <HousingKpiCards housing={housing} />

      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Top 10 — Highest {metricLabel}
          </h3>
          <CategoryBarChart
            data={topNeighborhoods}
            horizontal
            height={320}
            valueLabel={valueLabel}
          />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Bottom 10 — Lowest {metricLabel}
          </h3>
          <CategoryBarChart
            data={bottomNeighborhoods}
            horizontal
            height={320}
            valueLabel={valueLabel}
          />
        </div>
      </div>
    </div>
  )
}
