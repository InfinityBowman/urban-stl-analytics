import { useMemo } from 'react'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import type { NeighborhoodDemographics } from '@/lib/types'

interface RaceBreakdownChartProps {
  demographics: Record<string, NeighborhoodDemographics>
}

export function RaceBreakdownChart({ demographics }: RaceBreakdownChartProps) {
  const data = useMemo(() => {
    const totals: Record<string, number> = {
      White: 0,
      Black: 0,
      Hispanic: 0,
      Asian: 0,
      Other: 0,
    }

    for (const d of Object.values(demographics)) {
      totals['White'] += d.race.white
      totals['Black'] += d.race.black
      totals['Hispanic'] += d.race.hispanic
      totals['Asian'] += d.race.asian
      totals['Other'] += d.race.other
    }

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [demographics])

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        City-Wide Race Breakdown
      </h3>
      <CategoryBarChart data={data} horizontal={false} height={300} valueLabel="Population" />
    </div>
  )
}
