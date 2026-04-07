import { useMemo } from 'react'
import { DetailRow, DetailSection, MetricCard } from './shared'
import { useDataStore } from '@/stores/data-store'

export function StopDetail({ id }: { id: string }) {
  const stops = useDataStore((s) => s.stops)
  const stopStats = useDataStore((s) => s.stopStats)
  const routes = useDataStore((s) => s.routes)

  const stop = useMemo(
    () => stops?.features.find((f) => f.properties.stop_id === id) ?? null,
    [stops, id],
  )

  const stats = stopStats?.[id]

  const routeDetails = useMemo(() => {
    if (!stats?.routes || !routes) return []
    return routes.filter((r) => stats.routes.includes(r.route_id))
  }, [stats, routes])

  if (!stop) {
    return <div className="text-xs text-muted-foreground">Stop not found</div>
  }

  const [lon, lat] = stop.geometry.coordinates as [number, number]

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Stop name */}
      <div className="text-base font-bold">
        {(stop.properties.stop_name as string) || `Stop ${id}`}
      </div>

      {/* Key metrics */}
      <div className="flex gap-2">
        <MetricCard
          label="Daily Trips"
          value={stats?.trip_count ?? 0}
          color="text-blue-500"
        />
        <MetricCard
          label="Routes"
          value={routeDetails.length}
          subtext="served"
        />
      </div>

      {/* Stop info */}
      <DetailSection title="Stop Info" color="text-blue-400">
        <DetailRow label="Stop ID" value={id} />
        <DetailRow
          label="Location"
          value={`${lat.toFixed(4)}, ${lon.toFixed(4)}`}
        />
      </DetailSection>

      {/* Routes */}
      {routeDetails.length > 0 && (
        <DetailSection title="Routes" color="text-blue-400">
          <div className="flex flex-col gap-2 pt-1">
            {routeDetails.map((r) => (
              <div key={r.route_id} className="flex items-center gap-2.5">
                <span
                  className="flex h-5 min-w-8 items-center justify-center rounded text-[0.6rem] font-bold text-white"
                  style={{
                    background: r.route_color
                      ? `#${r.route_color}`
                      : '#a78bfa',
                  }}
                >
                  {r.route_short_name || r.route_id}
                </span>
                <span className="text-[0.65rem] leading-tight text-muted-foreground">
                  {r.route_long_name}
                </span>
              </div>
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  )
}
