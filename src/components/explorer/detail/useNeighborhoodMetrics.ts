import { useMemo } from 'react'
import type { ExplorerData } from '@/lib/explorer-types'
import { useDataStore } from '@/stores/data-store'
import { computeNeighborhoodMetrics } from '@/lib/neighborhood-metrics'

export type { NeighborhoodMetrics } from '@/lib/neighborhood-metrics'

/**
 * Compute neighborhood metrics with stable dependencies. Only the data slices
 * the computation actually reads are in the memo dep list, so this stops
 * invalidating when unrelated datasets finish loading.
 */
export function useNeighborhoodMetrics(id: string | null) {
  const neighborhoods = useDataStore((s) => s.neighborhoods)
  const csbData = useDataStore((s) => s.csbData)
  const vacancyData = useDataStore((s) => s.vacancyData)
  const stops = useDataStore((s) => s.stops)
  const stopStats = useDataStore((s) => s.stopStats)
  const groceryStores = useDataStore((s) => s.groceryStores)

  return useMemo(() => {
    if (!id) return null
    // computeNeighborhoodMetrics reads: neighborhoods, csbData, vacancyData,
    // stops, stopStats, groceryStores. Build a minimal ExplorerData shim with
    // the slices it needs.
    const slice = {
      neighborhoods,
      csbData,
      vacancyData,
      stops,
      stopStats,
      groceryStores,
    } as ExplorerData
    return computeNeighborhoodMetrics(id, slice)
  }, [id, neighborhoods, csbData, vacancyData, stops, stopStats, groceryStores])
}
