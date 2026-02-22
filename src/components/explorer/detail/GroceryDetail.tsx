import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { haversine } from '@/lib/equity'
import { DetailRow, DetailSection, MetricCard } from './shared'

export function GroceryDetail({ id }: { id: number }) {
  const data = useData()

  const store = data.groceryStores?.features[id] ?? null

  const nearestDesert = useMemo(() => {
    if (!store || !data.foodDeserts) return null
    const [sLon, sLat] = store.geometry.coordinates as Array<number>
    let nearest: { name: string; dist: number; tractId: string } | null = null

    data.foodDeserts.features.forEach((f) => {
      const p = f.properties
      if (!p.lila) return
      const coords = f.geometry.coordinates as Array<Array<Array<number>>>
      const centroid = coords[0].reduce(
        (acc, pt) => [
          acc[0] + pt[1] / coords[0].length,
          acc[1] + pt[0] / coords[0].length,
        ],
        [0, 0],
      )
      const dist = haversine(sLat, sLon, centroid[0], centroid[1])
      if (!nearest || dist < nearest.dist) {
        nearest = { name: p.name, dist, tractId: p.tract_id }
      }
    })

    return nearest
  }, [store, data.foodDeserts])

  if (!store) {
    return <div className="text-xs text-muted-foreground">Store not found</div>
  }

  const [lon, lat] = store.geometry.coordinates as Array<number>

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Store name */}
      <div>
        <div className="text-base font-bold">{store.properties.name}</div>
        {store.properties.chain && (
          <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-600 dark:text-emerald-400">
            {store.properties.chain}
          </span>
        )}
      </div>

      {/* Store info */}
      <DetailSection title="Location" color="text-emerald-400">
        <DetailRow
          label="Coordinates"
          value={`${lat.toFixed(4)}, ${lon.toFixed(4)}`}
        />
      </DetailSection>

      {/* Nearest food desert */}
      {nearestDesert && (
        <DetailSection title="Nearest Food Desert" color="text-red-400">
          <DetailRow
            label="Tract"
            value={(nearestDesert as { name: string }).name}
          />
          <DetailRow
            label="Distance"
            value={`${(nearestDesert as { dist: number }).dist.toFixed(2)} mi`}
          />
        </DetailSection>
      )}
    </div>
  )
}
