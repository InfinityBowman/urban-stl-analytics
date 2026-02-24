import { useMemo } from 'react'
import { useData, useFailedDatasets } from '../ExplorerProvider'
import { MiniKpi } from './MiniKpi'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'

export function AffectedAnalytics() {
  const data = useData()
  const failed = useFailedDatasets()

  const kpis = useMemo(() => {
    if (!data.affectedScores || data.affectedScores.length === 0) return null
    const scores = data.affectedScores
    const avg = Math.round(scores.reduce((s, a) => s + a.composite, 0) / scores.length)
    const above50 = scores.filter((s) => s.composite >= 50).length
    return {
      avgDistress: String(avg),
      mostDistressed: scores[0].name,
      leastDistressed: scores[scores.length - 1].name,
      above50: String(above50),
    }
  }, [data.affectedScores])

  const topDistressed = useMemo(() => {
    if (!data.affectedScores) return []
    return data.affectedScores
      .slice(0, 12)
      .map((s) => ({ name: s.name, value: s.composite }))
  }, [data.affectedScores])

  const subScoreChart = useMemo(() => {
    if (!data.affectedScores || data.affectedScores.length === 0) return []
    // Average sub-scores across all neighborhoods
    const n = data.affectedScores.length
    const totals = data.affectedScores.reduce(
      (acc, s) => ({
        crime: acc.crime + s.crimeScore,
        vacancy: acc.vacancy + s.vacancyScore,
        complaints: acc.complaints + s.complaintScore,
        foodAccess: acc.foodAccess + s.foodScore,
        popDecline: acc.popDecline + s.popDeclineScore,
      }),
      { crime: 0, vacancy: 0, complaints: 0, foodAccess: 0, popDecline: 0 },
    )
    return [
      { name: 'Crime', value: Math.round(totals.crime / n) },
      { name: 'Vacancy', value: Math.round(totals.vacancy / n) },
      { name: 'Complaints', value: Math.round(totals.complaints / n) },
      { name: 'Food Access', value: Math.round(totals.foodAccess / n) },
      { name: 'Pop Decline', value: Math.round(totals.popDecline / n) },
    ]
  }, [data.affectedScores])

  if (!data.affectedScores || !kpis) {
    const dependenciesFailed =
      failed.has('crime') || failed.has('vacancy') ||
      failed.has('complaints') || failed.has('demographics')
    if (dependenciesFailed) {
      return (
        <div className="text-xs text-muted-foreground">Affected data unavailable (dependency failed to load).</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">Loading affected scores...</div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniKpi label="Avg Distress" value={kpis.avgDistress} />
        <MiniKpi label="Most Distressed" value={kpis.mostDistressed} />
        <MiniKpi label="Least Distressed" value={kpis.leastDistressed} />
        <MiniKpi label="Above 50" value={kpis.above50} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="h-[240px] overflow-hidden">
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Top 12 Most Distressed
          </div>
          <CategoryBarChart data={topDistressed} horizontal height={220} valueLabel="Distress Score" />
        </div>
        <div className="h-[240px] overflow-hidden">
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Avg Sub-Score Breakdown
          </div>
          <CategoryBarChart data={subScoreChart} horizontal height={220} valueLabel="Avg Score" />
        </div>
      </div>
    </div>
  )
}
