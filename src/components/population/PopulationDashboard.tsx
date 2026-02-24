import { useEffect, useMemo, useState } from 'react'
import { PopulationKpiGrid } from './PopulationKpiGrid'
import { PopulationChangeTable } from './PopulationChangeTable'
import { RaceBreakdownChart } from './RaceBreakdownChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import type { NeighborhoodDemographics } from '@/lib/types'

type Tab = 'overview' | 'change' | 'demographics'

export function PopulationDashboard() {
  const [demographics, setDemographics] = useState<Record<
    string,
    NeighborhoodDemographics
  > | null>(null)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')

  useEffect(() => {
    fetch('/data/demographics.json')
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
      .then(setDemographics)
      .catch(() => setError(true))
  }, [])

  const topByPop = useMemo(() => {
    if (!demographics) return []
    return Object.entries(demographics)
      .map(([, d]) => ({ name: d.name, value: d.population['2020'] ?? 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [demographics])

  const topGrowing = useMemo(() => {
    if (!demographics) return []
    return Object.entries(demographics)
      .filter(([, d]) => d.population['2010'] > 0 && d.popChange10to20 > 0)
      .map(([, d]) => ({
        name: d.name,
        value: Math.round(d.popChange10to20 * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [demographics])

  const topDeclining = useMemo(() => {
    if (!demographics) return []
    return Object.entries(demographics)
      .filter(([, d]) => d.population['2010'] > 0 && d.popChange10to20 < 0)
      .map(([, d]) => ({
        name: d.name,
        value: Math.round(Math.abs(d.popChange10to20) * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [demographics])

  const topVacancyRate = useMemo(() => {
    if (!demographics) return []
    return Object.entries(demographics)
      .filter(([, d]) => d.housing.totalUnits > 0)
      .map(([, d]) => ({
        name: d.name,
        value: Math.round(d.housing.vacancyRate * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [demographics])

  const housingKpis = useMemo(() => {
    if (!demographics) return null
    const hoods = Object.values(demographics)
    const totalUnits = hoods.reduce((s, h) => s + h.housing.totalUnits, 0)
    const occupied = hoods.reduce((s, h) => s + h.housing.occupied, 0)
    const vacant = hoods.reduce((s, h) => s + h.housing.vacant, 0)
    return { totalUnits, occupied, vacant }
  }, [demographics])

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Failed to load demographics data. Run the data pipeline first.
        </p>
      </div>
    )
  }

  if (!demographics) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading population data...</p>
      </div>
    )
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'change', label: 'Change 2010\u21922020' },
    { id: 'demographics', label: 'Demographics' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Population Trends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Census data across 79 St. Louis neighborhoods
        </p>
      </div>

      <PopulationKpiGrid demographics={demographics} />

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Top 10 by Population (2020)
            </h3>
            <CategoryBarChart data={topByPop} horizontal height={350} valueLabel="Population" />
          </div>
        </div>
      )}

      {tab === 'change' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-emerald-500">
                Top 10 Growing (%)
              </h3>
              <CategoryBarChart
                data={topGrowing}
                horizontal
                height={320}
                valueLabel="Growth %"
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-red-400">
                Top 10 Declining (%)
              </h3>
              <CategoryBarChart
                data={topDeclining}
                horizontal
                height={320}
                valueLabel="Decline %"
              />
            </div>
          </div>
          <PopulationChangeTable demographics={demographics} />
        </div>
      )}

      {tab === 'demographics' && (
        <div className="space-y-6">
          <RaceBreakdownChart demographics={demographics} />

          {housingKpis && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted px-3 py-2">
                <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Housing Units
                </div>
                <div className="text-lg font-bold">
                  {housingKpis.totalUnits.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Occupied
                </div>
                <div className="text-lg font-bold">
                  {housingKpis.occupied.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vacant
                </div>
                <div className="text-lg font-bold">
                  {housingKpis.vacant.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Top 10 by Housing Vacancy Rate
            </h3>
            <CategoryBarChart
              data={topVacancyRate}
              horizontal
              height={350}
              valueLabel="Vacancy %"
            />
          </div>
        </div>
      )}
    </div>
  )
}
