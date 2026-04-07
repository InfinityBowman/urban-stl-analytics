import { haversine, polygonCentroid } from './equity'
import type { ExplorerData } from './explorer-types'
import type { GeoJSONFeature, VacantProperty } from './types'

export interface NeighborhoodMetrics {
  name: string
  centroid: [number, number]
  totalComplaints: number
  nearbyVacancies: Array<VacantProperty>
  nearbyStops: Array<GeoJSONFeature>
  totalTrips: number
  nearestGroceryDist: number
  nearestGroceryName: string
  avgTriageScore: number
}

/**
 * Pure computation of raw neighborhood stats from ExplorerData.
 * Returns counts, lists, and distances (no derived composite scores).
 * Used by the useNeighborhoodMetrics hook and the AI data executor.
 */
export function computeNeighborhoodMetrics(
  id: string,
  data: ExplorerData,
): NeighborhoodMetrics | null {
  const hoodKey = id.padStart(2, '0')
  const hood = data.csbData?.neighborhoods[hoodKey]
  const hoodFeature = data.neighborhoods?.features.find(
    (f) => String(f.properties.NHD_NUM).padStart(2, '0') === hoodKey,
  )

  if (!hoodFeature) return null

  // Handle both Polygon and MultiPolygon. Without this guard, MultiPolygon
  // neighborhoods (St. Louis Hills) produce NaN centroids.
  let ring: Array<Array<number>>
  if (hoodFeature.geometry.type === 'MultiPolygon') {
    ring = (
      hoodFeature.geometry.coordinates as Array<Array<Array<Array<number>>>>
    )[0]![0]!
  } else {
    ring = (hoodFeature.geometry.coordinates as Array<Array<Array<number>>>)[0]!
  }
  const centroid: [number, number] = polygonCentroid([ring])

  const nearbyVacancies = (data.vacancyData ?? []).filter(
    (p) => haversine(centroid[0], centroid[1], p.lat, p.lng) <= 0.5,
  )

  const nearbyStops =
    data.stops?.features.filter((stop) => {
      const [lon, lat] = stop.geometry.coordinates as [number, number]
      return haversine(centroid[0], centroid[1], lat, lon) <= 0.5
    }) ?? []

  const totalTrips = nearbyStops.reduce((s, stop) => {
    const stats = data.stopStats?.[stop.properties.stop_id as string]
    return s + (stats?.trip_count ?? 0)
  }, 0)

  let nearestGroceryDist = Infinity
  let nearestGroceryName = 'N/A'
  if (data.groceryStores) {
    for (const store of data.groceryStores.features) {
      const [lon, lat] = store.geometry.coordinates as [number, number]
      const dist = haversine(centroid[0], centroid[1], lat, lon)
      if (dist < nearestGroceryDist) {
        nearestGroceryDist = dist
        nearestGroceryName = store.properties.name
      }
    }
  }

  const avgTriageScore = nearbyVacancies.length
    ? Math.round(
        nearbyVacancies.reduce((s, p) => s + p.triageScore, 0) /
          nearbyVacancies.length,
      )
    : 0

  const name =
    hoodFeature.properties.NHD_NAME || hood?.name || `Neighborhood ${hoodKey}`

  return {
    name,
    centroid,
    totalComplaints: hood?.total ?? 0,
    nearbyVacancies,
    nearbyStops,
    totalTrips,
    nearestGroceryDist,
    nearestGroceryName,
    avgTriageScore,
  }
}
