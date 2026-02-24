import { useMemo } from 'react'
import { useData, useFailedDatasets } from '../ExplorerProvider'
import { MiniKpi } from './MiniKpi'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'

export function HousingAnalytics() {
  const data = useData()
  const failed = useFailedDatasets()

  const kpis = useMemo(() => {
    if (!data.housingData) return null
    const h = data.housingData
    const withData = Object.values(h.neighborhoods).filter(
      (n) => n.medianRent != null || n.medianHomeValue != null,
    )
    return {
      cityRent: h.cityMedianRent != null ? `$${h.cityMedianRent.toLocaleString()}` : 'N/A',
      cityValue: h.cityMedianHomeValue != null ? `$${h.cityMedianHomeValue.toLocaleString()}` : 'N/A',
      acsYear: String(h.year),
      count: String(withData.length),
    }
  }, [data.housingData])

  const rentData = useMemo(() => {
    if (!data.housingData) return { highRent: [], lowRent: [] }
    const sorted = Object.values(data.housingData.neighborhoods)
      .filter((n) => n.medianRent != null)
      .sort((a, b) => (b.medianRent ?? 0) - (a.medianRent ?? 0))
      .map((n) => ({ name: n.name, value: n.medianRent! }))
    const top = Math.min(10, Math.floor(sorted.length / 2))
    return {
      highRent: sorted.slice(0, top),
      lowRent: sorted.slice(-top).reverse(),
    }
  }, [data.housingData])

  if (!data.housingData || !kpis) {
    if (failed.has('housing')) {
      return (
        <div className="text-xs text-muted-foreground">Housing data unavailable.</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">Loading housing data...</div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniKpi label="City Median Rent" value={kpis.cityRent} />
        <MiniKpi label="City Median Value" value={kpis.cityValue} />
        <MiniKpi label="ACS Year" value={kpis.acsYear} />
        <MiniKpi label="Neighborhoods" value={kpis.count} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Top 10 Highest Rent
          </div>
          <div className="h-[200px] overflow-hidden">
            <CategoryBarChart data={rentData.highRent} horizontal height={200} valueLabel="Median Rent ($)" />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Bottom 10 Lowest Rent
          </div>
          <div className="h-[200px] overflow-hidden">
            <CategoryBarChart data={rentData.lowRent} horizontal height={200} valueLabel="Median Rent ($)" />
          </div>
        </div>
      </div>
    </div>
  )
}
