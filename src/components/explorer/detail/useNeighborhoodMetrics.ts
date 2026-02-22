import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { computeNeighborhoodMetrics } from '@/lib/neighborhood-metrics'

export type { NeighborhoodMetrics } from '@/lib/neighborhood-metrics'

export function useNeighborhoodMetrics(id: string | null) {
  const data = useData()

  return useMemo(
    () => (id ? computeNeighborhoodMetrics(id, data) : null),
    [id, data],
  )
}
