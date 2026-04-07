import { useMemo } from 'react'
import { MiniKpi } from './MiniKpi'
import { useDataStore } from '@/stores/data-store'
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { HourlyChart } from '@/components/charts/HourlyChart'
import { WeekdayChart } from '@/components/charts/WeekdayChart'
import { WeatherInsights } from '@/components/charts/WeatherInsights'
import { computeKPIs, movingAverage, weatherInsights } from '@/lib/analysis'

export function ComplaintsAnalytics() {
  const csbData = useDataStore((s) => s.csbData)
  const trendsData = useDataStore((s) => s.trendsData)
  const failed = useDataStore((s) => s.failedDatasets)

  const kpis = useMemo(
    () => (csbData ? computeKPIs(csbData) : null),
    [csbData],
  )

  const weather = useMemo(
    () =>
      csbData && trendsData
        ? weatherInsights(csbData.dailyCounts, trendsData.weather)
        : null,
    [csbData, trendsData],
  )

  const dailyChart = useMemo(() => {
    if (!csbData) return []
    const entries = Object.entries(csbData.dailyCounts).sort()
    const values = entries.map((e) => e[1])
    const ma7 = movingAverage(values)
    return entries.map((e, i) => ({ date: e[0], value: e[1], ma7: ma7[i] }))
  }, [csbData])

  const categoryChart = useMemo(
    () =>
      csbData
        ? Object.entries(csbData.categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([name, value]) => ({ name, value }))
        : [],
    [csbData],
  )

  if (!csbData || !kpis) {
    if (failed.has('complaints')) {
      return (
        <div className="text-xs text-muted-foreground">311 data unavailable.</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">Loading 311 data...</div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* KPIs — 4 across */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniKpi label="Total" value={kpis.totalRequests.toLocaleString()} />
        <MiniKpi label="Closure" value={`${kpis.closedPct}%`} />
        <MiniKpi label="Avg Resolution" value={`${kpis.avgResolution}d`} />
        <MiniKpi label="Per Day" value={String(kpis.perDay)} />
      </div>

      {/* Main charts row — time series wider, categories narrower */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="h-45 overflow-hidden">
          <TimeSeriesChart
            data={dailyChart}
            barLabel="Daily"
            lineLabel="7d Avg"
            height={180}
          />
        </div>
        <div className="h-45 overflow-hidden">
          <CategoryBarChart data={categoryChart} horizontal height={180} valueLabel="Complaints" />
        </div>
      </div>

      {/* Bottom row — hourly, weekday, weather side-by-side */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="overflow-hidden">
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            By Hour
          </div>
          <HourlyChart data={csbData.hourly} height={160} valueLabel="Complaints" />
        </div>
        <div className="overflow-hidden">
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            By Day
          </div>
          <WeekdayChart weekday={csbData.weekday} height={160} valueLabel="Complaints" />
        </div>
        {weather && (
          <div className="overflow-hidden">
            <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
              Weather Correlation
            </div>
            <WeatherInsights weather={weather} />
          </div>
        )}
      </div>
    </div>
  )
}
