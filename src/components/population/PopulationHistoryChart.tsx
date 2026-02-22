import { useState, useMemo, useCallback } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  stLouisPopulationHistory,
  getPopulationStats,
} from '@/lib/population-history'
import { cn } from '@/lib/utils'

type TimeRange = 'all' | '1900+' | '1950+' | '1980+' | '2000+'

const ANNOTATIONS = [
  { year: 1930, label: 'Peak: 821,960' },
  { year: 1980, label: '-27% decline' },
  { year: 2024, label: '291,500' },
]

export function PopulationHistoryChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all')

  const stats = useMemo(() => getPopulationStats(), [])

  const filteredData = useMemo(() => {
    const thresholds: Record<TimeRange, number> = {
      all: 0,
      '1900+': 1900,
      '1950+': 1950,
      '1980+': 1980,
      '2000+': 2000,
    }
    return stLouisPopulationHistory.filter(
      (p) => p.year >= thresholds[timeRange],
    )
  }, [timeRange])

  const annotationPoints = useMemo(() => {
    if (timeRange !== 'all') return []
    return ANNOTATIONS.map((ann) => {
      const point = filteredData.find((p) => p.year === ann.year)
      if (!point) return null
      return { ...ann, population: point.population }
    }).filter(Boolean) as Array<{ year: number; label: string; population: number }>
  }, [filteredData, timeRange])

  const formatPopulation = useCallback((v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
    return String(v)
  }, [])

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold">Population History</h3>
          <p className="text-[0.65rem] text-muted-foreground">
            St. Louis City population since {filteredData[0]?.year || 1810}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(['all', '1900+', '1950+', '1980+', '2000+'] as TimeRange[]).map(
            (range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1 text-[0.65rem] font-medium transition-colors',
                  timeRange === range
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground',
                )}
              >
                {range === 'all' ? 'All' : range}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="popGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="year"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickFormatter={formatPopulation}
              width={45}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--color-foreground)',
              }}
              labelStyle={{ color: 'var(--color-foreground)', fontWeight: 700 }}
              formatter={(v: number) => [v.toLocaleString(), 'Population']}
              labelFormatter={(year) => String(year)}
            />
            <Area
              type="monotone"
              dataKey="population"
              stroke="rgb(99, 102, 241)"
              strokeWidth={2}
              fill="url(#popGradient)"
              dot={false}
              activeDot={{ r: 4, fill: 'rgb(99, 102, 241)', strokeWidth: 0 }}
            />
            {annotationPoints.map((ann) => (
              <ReferenceDot
                key={ann.year}
                x={ann.year}
                y={ann.population}
                r={4}
                fill="rgb(99, 102, 241)"
                stroke="var(--color-card)"
                strokeWidth={2}
                label={{
                  value: ann.label,
                  position: 'top',
                  fontSize: 11,
                  fill: 'var(--color-muted-foreground)',
                  fontWeight: 600,
                  offset: 8,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-muted px-2.5 py-1.5">
          <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Peak ({stats.peak.year})
          </div>
          <div className="text-sm font-bold">
            {stats.peak.population.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-muted px-2.5 py-1.5">
          <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Current
          </div>
          <div className="text-sm font-bold">
            {stats.current.population.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-muted px-2.5 py-1.5">
          <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
            From Peak
          </div>
          <div className="text-sm font-bold text-red-400">
            -{stats.declinePercent}%
          </div>
        </div>
        <div className="rounded-lg bg-muted px-2.5 py-1.5">
          <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Years Declining
          </div>
          <div className="text-sm font-bold">
            {stats.yearsSincePeak}
          </div>
        </div>
      </div>

    </div>
  )
}
