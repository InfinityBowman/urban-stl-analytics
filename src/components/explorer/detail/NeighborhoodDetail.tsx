import { useEffect, useMemo } from 'react'
import { DetailRow, DetailSection } from './shared'
import { useNeighborhoodMetrics } from './useNeighborhoodMetrics'
import { useDataStore } from '@/stores/data-store'
import { haversine, polygonCentroid } from '@/lib/equity'

export function NeighborhoodDetail({ id }: { id: string }) {
  // useNeighborhoodMetrics already triggers complaints/vacancy/transit loads.
  // Trigger foodAccess too since we use it for the isDesert check below.
  useEffect(() => {
    useDataStore.getState().loadLayer('foodAccess')
  }, [])

  const csbData = useDataStore((s) => s.csbData)
  const routes = useDataStore((s) => s.routes)
  const stopStats = useDataStore((s) => s.stopStats)
  const foodDeserts = useDataStore((s) => s.foodDeserts)

  const hoodKey = id.padStart(2, '0')
  const metrics = useNeighborhoodMetrics(id)

  const hood = csbData?.neighborhoods[hoodKey]

  const nearbyRoutes = useMemo(() => {
    if (!routes || !stopStats || !metrics) return []
    const routeIds = new Set<string>()
    for (const stop of metrics.nearbyStops) {
      const stats = stopStats[stop.properties.stop_id as string]
      stats.routes.forEach((r) => routeIds.add(r))
    }
    return routes.filter((r) => routeIds.has(r.route_id))
  }, [routes, stopStats, metrics])

  const isDesert = useMemo(() => {
    if (!foodDeserts || !metrics) return false
    return foodDeserts.features.some((f) => {
      const p = f.properties
      if (!p.lila) return false
      const tc = polygonCentroid(
        f.geometry.coordinates as Array<Array<Array<number>>>,
      )
      return haversine(metrics.centroid[0], metrics.centroid[1], tc[0], tc[1]) < 0.5
    })
  }, [foodDeserts, metrics])

  if (!metrics) {
    return (
      <div className="text-xs text-muted-foreground">
        Neighborhood not found
      </div>
    )
  }

  const hoodVacancies = metrics.nearbyVacancies

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <div className="text-base font-bold leading-tight">{metrics.name}</div>
        <span className="mt-0.5 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[0.6rem] font-semibold text-primary">
          #{hoodKey}
        </span>
      </div>

      {hood && (
        <DetailSection title="311 Complaints" color="text-indigo-400">
          <DetailRow label="Total" value={hood.total.toLocaleString()} />
          <DetailRow label="Closed" value={String(hood.closed)} />
          <DetailRow
            label="Avg Resolution"
            value={`${hood.avgResolutionDays}d`}
          />
          {Object.entries(hood.topCategories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([cat, count]) => (
              <DetailRow key={cat} label={cat} value={String(count)} />
            ))}
        </DetailSection>
      )}

      <DetailSection title="Vacancy" color="text-amber-400">
        <DetailRow label="Properties" value={String(hoodVacancies.length)} />
        <DetailRow
          label="LRA Owned"
          value={String(hoodVacancies.filter((p) => p.owner === 'LRA').length)}
        />
        <DetailRow label="Avg Triage Score" value={String(metrics.avgTriageScore)} />
        {hoodVacancies.length > 0 && (
          <div className="pt-2">
            <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
              Top Candidates
            </div>
            {[...hoodVacancies]
              .sort((a, b) => b.triageScore - a.triageScore)
              .slice(0, 3)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-0.5"
                >
                  <span className="truncate">{p.address}</span>
                  <span className="font-bold tabular-nums">
                    {p.triageScore}
                  </span>
                </div>
              ))}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Transit & Food" color="text-blue-400">
        <DetailRow label="Stops (0.5mi)" value={String(metrics.nearbyStops.length)} />
        <DetailRow
          label="Routes"
          value={
            nearbyRoutes
              .map((r) => r.route_short_name || r.route_long_name)
              .join(', ') || 'None'
          }
        />
        <DetailRow label="Total Trips" value={String(metrics.totalTrips)} />
        <DetailRow
          label="Nearest Grocery"
          value={metrics.nearestGroceryDist === Infinity
            ? 'N/A'
            : `${metrics.nearestGroceryName} (${metrics.nearestGroceryDist.toFixed(2)}mi)`}
        />
        {isDesert && (
          <div className="pt-1.5 text-[0.65rem] font-semibold text-red-400">
            In a food desert area
          </div>
        )}
      </DetailSection>
    </div>
  )
}
