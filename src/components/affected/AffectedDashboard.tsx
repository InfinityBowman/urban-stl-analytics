import { useEffect, useMemo, useState } from 'react'
import { AffectedKpiCards } from './AffectedKpiCards'
import { AffectedNeighborhoodRow } from './AffectedNeighborhoodRow'
import { computeAffectedScores } from '@/lib/affected-scoring'
import type {
  CrimeData,
  CSBData,
  GeoJSONCollection,
  NeighborhoodDemographics,
  NeighborhoodProperties,
  VacantProperty,
} from '@/lib/types'

export function AffectedDashboard() {
  const [demographics, setDemographics] = useState<Record<
    string,
    NeighborhoodDemographics
  > | null>(null)
  const [crime, setCrime] = useState<CrimeData | null>(null)
  const [vacancies, setVacancies] = useState<VacantProperty[] | null>(null)
  const [complaints, setComplaints] = useState<CSBData | null>(null)
  const [neighborhoods, setNeighborhoods] =
    useState<GeoJSONCollection<NeighborhoodProperties> | null>(null)
  const [groceryStores, setGroceryStores] = useState<GeoJSONCollection<{
    name: string
    chain: string
  }> | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = (url: string) =>
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })

    Promise.all([
      load('/data/demographics.json').then(setDemographics),
      load('/data/crime.json').then(setCrime),
      load('/data/vacancies.json').then(setVacancies),
      load('/data/csb_latest.json').then(setComplaints),
      load('/data/neighborhoods.geojson').then(setNeighborhoods),
    ]).catch(() => setError(true))

    // Grocery stores are optional — don't block render on failure
    load('/data/grocery_stores.geojson')
      .then(setGroceryStores)
      .catch(() => {})
  }, [])

  const scores = useMemo(() => {
    if (!demographics || !crime || !vacancies || !complaints || !neighborhoods) return null
    return computeAffectedScores({
      demographics,
      crime,
      vacancies,
      complaints,
      neighborhoods,
      groceryStores: groceryStores ?? undefined,
    })
  }, [demographics, crime, vacancies, complaints, neighborhoods, groceryStores])

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Failed to load data. Run the data pipeline first.
        </p>
      </div>
    )
  }

  if (!scores) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading neighborhood data...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Affected Neighborhoods</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Composite distress scoring across crime, vacancy, complaints, food access, and
          population decline
        </p>
      </div>

      <AffectedKpiCards scores={scores} />

      <div className="max-h-[600px] overflow-auto rounded-lg border border-border">
        <div className="sticky top-0 flex items-center justify-between bg-muted px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Ranked by Distress Score
          </span>
          <span className="text-xs text-muted-foreground">
            {scores.length} neighborhoods
          </span>
        </div>
        {scores.map((s, i) => (
          <AffectedNeighborhoodRow key={s.nhdId} score={s} rank={i + 1} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-semibold">Distress Score:</span>
        {[
          { color: '#1a9641', label: '0-15 Low' },
          { color: '#a6d96a', label: '15-30' },
          { color: '#ffffbf', label: '30-45' },
          { color: '#fdae61', label: '45-60' },
          { color: '#f46d43', label: '60-75' },
          { color: '#d73027', label: '75-90' },
          { color: '#a50026', label: '90-100 High' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
