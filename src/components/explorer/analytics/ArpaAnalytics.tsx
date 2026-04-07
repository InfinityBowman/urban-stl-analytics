import { useMemo } from 'react'
import { MiniKpi } from './MiniKpi'
import { useDataStore } from '@/stores/data-store'
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'

export function ArpaAnalytics() {
  const arpaData = useDataStore((s) => s.arpaData)
  const failed = useDataStore((s) => s.failedDatasets)

  const kpis = useMemo(() => {
    if (!arpaData) return null
    const months = Object.keys(arpaData.monthlySpending)
    const dateRange =
      months.length > 0
        ? `${months[0]} - ${months[months.length - 1]}`
        : 'N/A'
    return {
      totalSpent: arpaData.totalSpent,
      transactions: arpaData.transactionCount,
      projects: arpaData.projects.length,
      dateRange,
    }
  }, [arpaData])

  const spendingChart = useMemo(() => {
    if (!arpaData) return []
    return Object.entries(arpaData.monthlySpending)
      .sort()
      .map(([date, value]) => ({
        date,
        value: Math.round(value / 1000), // in thousands
        ma7: Math.round((arpaData.cumulativeSpending[date] ?? 0) / 1000000), // cumulative in millions
      }))
  }, [arpaData])

  const categoryChart = useMemo(
    () =>
      arpaData
        ? Object.entries(arpaData.categoryBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({
              name,
              value: Math.round(value / 1000),
            }))
        : [],
    [arpaData],
  )

  if (!arpaData || !kpis) {
    if (failed.has('arpa')) {
      return (
        <div className="text-xs text-muted-foreground">ARPA data unavailable.</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">Loading ARPA data...</div>
    )
  }

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniKpi label="Total Spent" value={fmt(kpis.totalSpent)} />
        <MiniKpi label="Transactions" value={kpis.transactions.toLocaleString()} />
        <MiniKpi label="Projects" value={String(kpis.projects)} />
        <MiniKpi label="Period" value={kpis.dateRange} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="h-45 overflow-hidden">
          <TimeSeriesChart
            data={spendingChart}
            barLabel="Monthly ($K)"
            lineLabel="Cumulative ($M)"
            height={180}
            dualAxis
          />
        </div>
        <div className="h-45 overflow-hidden">
          <CategoryBarChart data={categoryChart} horizontal height={180} valueLabel="Spent ($K)" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Top Vendors
          </div>
          <div className="flex flex-col gap-1">
            {arpaData.topVendors.slice(0, 8).map((v) => (
              <div
                key={v.name}
                className="flex items-center justify-between text-[0.6rem]"
              >
                <span className="truncate mr-2">{v.name}</span>
                <span className="font-bold text-emerald-400 shrink-0">
                  {fmt(v.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Top Projects
          </div>
          <div className="flex flex-col gap-1">
            {arpaData.projects.slice(0, 8).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-[0.6rem]"
              >
                <span className="truncate mr-2">{p.title || `Project #${p.id}`}</span>
                <span className="font-bold text-emerald-400 shrink-0">
                  {fmt(p.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
