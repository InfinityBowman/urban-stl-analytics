import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { haversine, polygonCentroid } from '@/lib/equity'
import { equitySeverity } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { DetailRow, DetailSection, MetricCard } from './shared'

export function FoodDesertDetail({ id }: { id: string }) {
  const data = useData()

  const tract = useMemo(() => {
    if (!data.foodDeserts) return null
    return (
      data.foodDeserts.features.find(
        (f) => f.properties.tract_id === id,
      ) ?? null
    )
  }, [data.foodDeserts, id])

  const props = tract?.properties

  const centroid = tract
    ? polygonCentroid(tract.geometry.coordinates as Array<Array<Array<number>>>)
    : null

  // Nearby stops + frequency
  const nearbyStopData = useMemo(() => {
    if (!data.stops || !centroid) return { count: 0, frequency: 0 }
    let count = 0
    let frequency = 0
    data.stops.features.forEach((stop) => {
      const [lon, lat] = stop.geometry.coordinates as Array<number>
      if (haversine(centroid[0], centroid[1], lat, lon) <= 0.5) {
        count++
        const stats = data.stopStats?.[stop.properties.stop_id as string]
        if (stats) frequency += stats.trip_count
      }
    })
    return { count, frequency }
  }, [data.stops, data.stopStats, centroid])

  // Nearest grocery
  const nearestGrocery = useMemo(() => {
    if (!data.groceryStores || !centroid) return null
    let nearest: { name: string; dist: number } | null = null
    data.groceryStores.features.forEach((store) => {
      const [lon, lat] = store.geometry.coordinates as Array<number>
      const dist = haversine(centroid[0], centroid[1], lat, lon)
      if (!nearest || dist < nearest.dist) {
        nearest = { name: store.properties.name, dist }
      }
    })
    return nearest
  }, [data.groceryStores, centroid])

  // Grocery accessible via transit
  const groceryAccessible = useMemo(() => {
    if (!data.stops || !data.stopStats || !data.groceryStores || !centroid)
      return false
    for (const store of data.groceryStores.features) {
      const [sLon, sLat] = store.geometry.coordinates as Array<number>
      for (const stop of data.stops.features) {
        const [bLon, bLat] = stop.geometry.coordinates as Array<number>
        if (haversine(sLat, sLon, bLat, bLon) > 0.25) continue
        const stats = data.stopStats[stop.properties.stop_id as string]
        if (!stats?.routes.length) continue
        for (const tractStop of data.stops.features) {
          const [tLon, tLat] = tractStop.geometry.coordinates as Array<number>
          if (haversine(centroid[0], centroid[1], tLat, tLon) > 0.5) continue
          const tractStats =
            data.stopStats[tractStop.properties.stop_id as string]
          if (tractStats?.routes.some((r) => stats.routes.includes(r)))
            return true
        }
      }
    }
    return false
  }, [data.stops, data.stopStats, data.groceryStores, centroid])

  // Equity score
  const equityScore = useMemo(() => {
    let score = 0
    score += Math.min(nearbyStopData.count * 10, 30)
    score += Math.min(nearbyStopData.frequency * 0.5, 20)
    if (nearestGrocery) {
      score +=
        nearestGrocery.dist <= 0.5
          ? 25
          : nearestGrocery.dist <= 1
            ? 15
            : nearestGrocery.dist <= 2
              ? 5
              : 0
    }
    score += groceryAccessible ? 25 : 0
    return Math.round(score)
  }, [nearbyStopData, nearestGrocery, groceryAccessible])

  if (!tract || !props) {
    return <div className="text-xs text-muted-foreground">Tract not found</div>
  }

  const sev = equitySeverity(equityScore)
  const sevConfig = {
    high: {
      bg: 'bg-red-500/15',
      text: 'text-red-600 dark:text-red-400',
      label: 'High Concern',
    },
    medium: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-600 dark:text-amber-400',
      label: 'Moderate',
    },
    low: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      label: 'Adequate',
    },
  }
  const sevStyle = sevConfig[sev]

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Tract name + LILA badge */}
      <div>
        <div className="text-base font-bold">{props.name}</div>
        <span
          className={cn(
            'mt-1 inline-block rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold',
            props.lila
              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
          )}
        >
          {props.lila ? 'LILA Food Desert' : 'Not LILA'}
        </span>
      </div>

      {/* Key metrics */}
      <div className="flex gap-2">
        <MetricCard
          label="Equity"
          value={equityScore}
          subtext="/100"
          color={sevStyle.text}
        />
        <MetricCard
          label="Population"
          value={props.pop?.toLocaleString() ?? '—'}
        />
      </div>

      {/* Demographics */}
      <DetailSection title="Demographics" color="text-red-400">
        <DetailRow label="Tract ID" value={props.tract_id} />
        <DetailRow label="Poverty Rate" value={`${props.poverty_rate}%`} />
        <DetailRow
          label="Median Income"
          value={`$${props.median_income?.toLocaleString() ?? 'N/A'}`}
        />
        <DetailRow label="No Vehicle" value={`${props.pct_no_vehicle}%`} />
      </DetailSection>

      {/* Access Analysis */}
      <DetailSection title="Access Analysis" color="text-blue-400">
        <DetailRow
          label="Transit Stops (0.5mi)"
          value={String(nearbyStopData.count)}
        />
        {nearestGrocery && (
          <>
            <DetailRow label="Nearest Grocery" value={nearestGrocery.name} />
            <DetailRow
              label="Distance"
              value={`${nearestGrocery.dist.toFixed(2)} mi`}
            />
          </>
        )}
        <DetailRow
          label="Transit to Grocery"
          value={groceryAccessible ? 'Yes' : 'No'}
        />
      </DetailSection>

      {/* Equity score badge */}
      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5">
        <span className="text-[0.65rem] font-semibold text-muted-foreground">
          Equity Assessment
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold',
            sevStyle.bg,
            sevStyle.text,
          )}
        >
          {sevStyle.label}
        </span>
      </div>
    </div>
  )
}
