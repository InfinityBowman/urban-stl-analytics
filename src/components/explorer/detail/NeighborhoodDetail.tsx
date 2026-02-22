import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { haversine, polygonCentroid } from '@/lib/equity'
import { generateVacancyData } from '@/lib/vacancy-data'
import { scoreColor } from '@/lib/colors'
import { AIInsightNarrative } from '../insights/AIInsightNarrative'
import { DetailRow, DetailSection, ScoreBar, MetricCard } from './shared'

export function NeighborhoodDetail({ id }: { id: string }) {
  const data = useData()
  const hoodKey = id.padStart(2, '0')

  const hood = data.csbData?.neighborhoods[hoodKey]
  const hoodFeature = data.neighborhoods?.features.find(
    (f) => String(f.properties.NHD_NUM).padStart(2, '0') === hoodKey,
  )

  const centroid: [number, number] = hoodFeature
    ? polygonCentroid(
        hoodFeature.geometry.coordinates as Array<Array<Array<number>>>,
      )
    : [38.635, -90.245]

  const allVacancies = useMemo(() => generateVacancyData(), [])
  const hoodVacancies = useMemo(() => {
    if (!hoodFeature) return []
    return allVacancies.filter(
      (p) => haversine(centroid[0], centroid[1], p.lat, p.lng) <= 0.5,
    )
  }, [allVacancies, hoodFeature, centroid])

  const nearbyStops = useMemo(() => {
    if (!data.stops) return []
    return data.stops.features.filter((stop) => {
      const [lon, lat] = stop.geometry.coordinates as Array<number>
      return haversine(centroid[0], centroid[1], lat, lon) <= 0.5
    })
  }, [data.stops, centroid])

  const nearbyRoutes = useMemo(() => {
    if (!data.routes || !data.stopStats) return []
    const routeIds = new Set<string>()
    nearbyStops.forEach((stop) => {
      const stats = data.stopStats![stop.properties.stop_id as string]
      if (stats) stats.routes.forEach((r) => routeIds.add(r))
    })
    return data.routes.filter((r) => routeIds.has(r.route_id))
  }, [nearbyStops, data.stopStats, data.routes])

  const totalFrequency = nearbyStops.reduce((s, stop) => {
    const stats = data.stopStats?.[stop.properties.stop_id as string]
    return s + (stats?.trip_count || 0)
  }, 0)

  const nearestGrocery = useMemo(() => {
    if (!data.groceryStores) return { name: 'N/A', dist: Infinity }
    let nearest = { name: 'N/A', dist: Infinity }
    data.groceryStores.features.forEach((store) => {
      const [lon, lat] = store.geometry.coordinates as Array<number>
      const dist = haversine(centroid[0], centroid[1], lat, lon)
      if (dist < nearest.dist) nearest = { name: store.properties.name, dist }
    })
    return nearest
  }, [data.groceryStores, centroid])

  const isDesert = useMemo(() => {
    if (!data.foodDeserts) return false
    return data.foodDeserts.features.some((f) => {
      const p = f.properties
      if (!p.lila) return false
      const tc = polygonCentroid(
        f.geometry.coordinates as Array<Array<Array<number>>>,
      )
      return haversine(centroid[0], centroid[1], tc[0], tc[1]) < 0.5
    })
  }, [data.foodDeserts, centroid])

  const avgVacancyScore = hoodVacancies.length
    ? Math.round(
        hoodVacancies.reduce((s, p) => s + p.triageScore, 0) /
          hoodVacancies.length,
      )
    : 0

  const transitScore = Math.min(
    100,
    nearbyStops.length * 15 + Math.min(totalFrequency * 0.3, 30),
  )
  const complaintScore = hood ? Math.max(0, 100 - hood.total / 50) : 50
  const foodScore =
    nearestGrocery.dist <= 0.5
      ? 90
      : nearestGrocery.dist <= 1
        ? 60
        : nearestGrocery.dist <= 2
          ? 30
          : 10
  const compositeScore = Math.round(
    (transitScore + complaintScore + foodScore + (100 - avgVacancyScore)) / 4,
  )

  if (!hood) {
    return (
      <div className="text-xs text-muted-foreground">
        Neighborhood not found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Name + ID + Composite score */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold leading-tight">{hood.name}</div>
          <span className="mt-0.5 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[0.6rem] font-semibold text-primary">
            #{hoodKey}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5">
          <div className="text-xl font-extrabold tabular-nums leading-tight text-primary">
            {compositeScore}
          </div>
          <div className="text-[0.5rem] font-medium uppercase tracking-wider text-muted-foreground">
            Score
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <AIInsightNarrative
        name={hood.name}
        compositeScore={compositeScore}
        totalComplaints={hood.total}
        stopsNearby={nearbyStops.length}
        nearestGroceryDist={nearestGrocery.dist}
        vacancyCount={hoodVacancies.length}
      />

      {/* Score bars */}
      <div className="flex flex-col gap-2">
        <ScoreBar label="Transit Access" score={Math.round(transitScore)} />
        <ScoreBar label="311 Health" score={Math.round(complaintScore)} />
        <ScoreBar label="Food Access" score={foodScore} />
        <ScoreBar label="Vacancy (inverse)" score={100 - avgVacancyScore} />
      </div>

      {/* 311 */}
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

      {/* Vacancy */}
      <DetailSection title="Vacancy" color="text-amber-400">
        <DetailRow label="Properties" value={String(hoodVacancies.length)} />
        <DetailRow
          label="LRA Owned"
          value={String(hoodVacancies.filter((p) => p.owner === 'LRA').length)}
        />
        <DetailRow label="Avg Triage Score" value={String(avgVacancyScore)} />
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
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: scoreColor(p.triageScore) }}
                  >
                    {p.triageScore}
                  </span>
                </div>
              ))}
          </div>
        )}
      </DetailSection>

      {/* Transit & Food */}
      <DetailSection title="Transit & Food" color="text-blue-400">
        <DetailRow label="Stops (0.5mi)" value={String(nearbyStops.length)} />
        <DetailRow
          label="Routes"
          value={
            nearbyRoutes
              .map((r) => r.route_short_name || r.route_long_name)
              .join(', ') || 'None'
          }
        />
        <DetailRow label="Trips/day" value={String(totalFrequency)} />
        <DetailRow
          label="Nearest Grocery"
          value={`${nearestGrocery.name} (${nearestGrocery.dist.toFixed(2)}mi)`}
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
