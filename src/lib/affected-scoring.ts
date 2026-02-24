import type {
  AffectedScore,
  CrimeData,
  CSBData,
  GeoJSONCollection,
  NeighborhoodDemographics,
  NeighborhoodProperties,
  VacantProperty,
} from './types'
import { haversine, polygonCentroid } from './equity'

/**
 * Compute composite distress scores (0-100) per neighborhood.
 *
 * Weights:
 *   crimeScore       25%
 *   vacancyScore     25%
 *   complaintScore   20%
 *   foodScore        15%  (binary: no grocery within 1.5mi of centroid)
 *   popDeclineScore  15%
 */
export function computeAffectedScores(opts: {
  demographics: Record<string, NeighborhoodDemographics>
  crime: CrimeData
  vacancies: VacantProperty[]
  complaints: CSBData
  neighborhoods: GeoJSONCollection<NeighborhoodProperties>
  groceryStores?: GeoJSONCollection<{ name: string; chain: string }>
}): AffectedScore[] {
  const { demographics, crime, vacancies, complaints, neighborhoods, groceryStores } = opts
  const nhdIds = Object.keys(demographics)

  // Crime totals per neighborhood
  const crimeByNhd: Record<string, number> = {}
  for (const [id, stats] of Object.entries(crime.neighborhoods)) {
    crimeByNhd[id] = stats.total
  }

  // Vacancy counts per neighborhood (filter out "00" — parcels with no neighborhood match)
  const vacancyByNhd: Record<string, number> = {}
  for (const v of vacancies) {
    const nid = v.neighborhood
    if (nid && nid !== '00') vacancyByNhd[nid] = (vacancyByNhd[nid] ?? 0) + 1
  }

  // Complaint totals per neighborhood
  const complaintByNhd: Record<string, number> = {}
  for (const [id, stats] of Object.entries(complaints.neighborhoods)) {
    complaintByNhd[id] = stats.total
  }

  // Grocery proximity — compute centroids and check distance
  const nhdCentroids: Record<string, [number, number]> = {}
  for (const f of neighborhoods.features) {
    const nid = String(f.properties.NHD_NUM).padStart(2, '0')
    let ring: number[][]
    if (f.geometry.type === 'MultiPolygon') {
      ring = (f.geometry.coordinates as number[][][][])[0][0]
    } else {
      ring = (f.geometry.coordinates as number[][][])[0]
    }
    if (ring && ring.length > 0) {
      nhdCentroids[nid] = polygonCentroid([ring])
    }
  }

  const foodDesertNhds = new Set<string>()
  if (groceryStores) {
    for (const nid of nhdIds) {
      const centroid = nhdCentroids[nid]
      if (!centroid) continue
      let nearest = Infinity
      for (const f of groceryStores.features) {
        const [lon, lat] = f.geometry.coordinates as number[]
        const d = haversine(centroid[0], centroid[1], lat, lon)
        if (d < nearest) nearest = d
      }
      if (nearest > 1.5) foodDesertNhds.add(nid)
    }
  }

  // Compute max values for normalization
  const maxCrime = Math.max(...nhdIds.map((id) => crimeByNhd[id] ?? 0), 1)
  const maxVacancy = Math.max(...nhdIds.map((id) => vacancyByNhd[id] ?? 0), 1)
  const maxComplaint = Math.max(...nhdIds.map((id) => complaintByNhd[id] ?? 0), 1)
  const maxDecline = Math.max(
    ...nhdIds.map((id) => Math.max(0, -demographics[id].popChange10to20)),
    1,
  )

  const scores: AffectedScore[] = nhdIds.map((nid) => {
    const d = demographics[nid]
    const crimeScore = ((crimeByNhd[nid] ?? 0) / maxCrime) * 100
    const vacancyScore = ((vacancyByNhd[nid] ?? 0) / maxVacancy) * 100
    const complaintScore = ((complaintByNhd[nid] ?? 0) / maxComplaint) * 100
    const foodScore = foodDesertNhds.has(nid) ? 100 : 0
    const decline = Math.max(0, -d.popChange10to20)
    const popDeclineScore = (decline / maxDecline) * 100

    const composite =
      crimeScore * 0.25 +
      vacancyScore * 0.25 +
      complaintScore * 0.2 +
      foodScore * 0.15 +
      popDeclineScore * 0.15

    return {
      nhdId: nid,
      name: d.name,
      composite: Math.round(composite),
      crimeScore: Math.round(crimeScore),
      vacancyScore: Math.round(vacancyScore),
      complaintScore: Math.round(complaintScore),
      foodScore: Math.round(foodScore),
      popDeclineScore: Math.round(popDeclineScore),
    }
  })

  return scores.sort((a, b) => b.composite - a.composite)
}
