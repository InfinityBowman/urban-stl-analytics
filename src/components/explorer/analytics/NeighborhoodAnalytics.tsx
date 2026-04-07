import { useMemo } from 'react'
import { useNeighborhoodMetrics } from '../detail/useNeighborhoodMetrics'
import { MiniKpi } from './MiniKpi'
import { useDataStore } from '@/stores/data-store'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'

export function NeighborhoodAnalytics({ id }: { id: string }) {
  const csbData = useDataStore((s) => s.csbData)
  const failed = useDataStore((s) => s.failedDatasets)
  const hoodKey = id.padStart(2, '0')
  const metrics = useNeighborhoodMetrics(id)

  const hood = csbData?.neighborhoods[hoodKey]

  const catData = useMemo(
    () =>
      hood
        ? Object.entries(hood.topCategories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }))
        : [],
    [hood],
  )

  if (!hood) {
    if (failed.has('complaints')) {
      return (
        <div className="text-xs text-muted-foreground">Neighborhood data unavailable.</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">
        Loading neighborhood data...
      </div>
    )
  }

  const hoodVacancies = metrics?.nearbyVacancies ?? []
  const avgVacScore = metrics?.avgTriageScore ?? 0
  const stopsNearbyCount = metrics?.nearbyStops.length ?? 0

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold">{hood.name} — Cross-Dataset View</div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniKpi label="311" value={hood.total.toLocaleString()} />
        <MiniKpi label="Vacancies" value={String(hoodVacancies.length)} />
        <MiniKpi label="Stops" value={String(stopsNearbyCount)} />
        <MiniKpi label="Avg Triage" value={String(avgVacScore)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Top 311 Issues
          </div>
          <div className="h-35">
            <CategoryBarChart data={catData} horizontal height={140} valueLabel="Complaints" />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Best Rehab Candidates
          </div>
          <div className="flex flex-col gap-1">
            {[...hoodVacancies]
              .sort((a, b) => b.triageScore - a.triageScore)
              .slice(0, 5)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-[0.6rem]"
                >
                  <span className="truncate">{p.address}</span>
                  <span className="font-bold tabular-nums">
                    {p.triageScore}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
