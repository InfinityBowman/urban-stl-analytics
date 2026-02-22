import { useState, useCallback } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  migrationFlows,
  type MigrationFlowRecord,
} from '@/lib/population-history'
import { cn } from '@/lib/utils'

type ViewMode = 'net' | 'domestic' | 'international'

const VIEW_DATA_KEY: Record<ViewMode, keyof MigrationFlowRecord> = {
  net: 'totalNet',
  domestic: 'domesticNet',
  international: 'internationalNet',
}

export function MigrationFlowChart() {
  const [viewMode, setViewMode] = useState<ViewMode>('net')
  const [hoveredYear, setHoveredYear] = useState<MigrationFlowRecord | null>(
    null,
  )

  const dataKey = VIEW_DATA_KEY[viewMode]

  const totals: MigrationFlowRecord = {
    year: 0,
    domesticIn: migrationFlows.reduce((s, d) => s + d.domesticIn, 0),
    domesticOut: migrationFlows.reduce((s, d) => s + d.domesticOut, 0),
    domesticNet: migrationFlows.reduce((s, d) => s + d.domesticNet, 0),
    internationalIn: migrationFlows.reduce((s, d) => s + d.internationalIn, 0),
    internationalOut: migrationFlows.reduce((s, d) => s + d.internationalOut, 0),
    internationalNet: migrationFlows.reduce((s, d) => s + d.internationalNet, 0),
    totalNet: migrationFlows.reduce((s, d) => s + d.totalNet, 0),
  }

  const display = hoveredYear ?? totals
  const displayLabel = hoveredYear ? String(hoveredYear.year) : `${migrationFlows[0].year}–${migrationFlows[migrationFlows.length - 1].year} Total`

  const formatValue = useCallback((v: number) => {
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`
    return String(v)
  }, [])

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold">Migration Flows</h3>
          <p className="text-[0.65rem] text-muted-foreground">
            Annual movement in/out of St. Louis City
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(['net', 'domestic', 'international'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'shrink-0 rounded-md px-2.5 py-1 text-[0.65rem] font-medium transition-colors capitalize',
                viewMode === mode
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground',
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={migrationFlows}
            onMouseLeave={() => setHoveredYear(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="year"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickFormatter={formatValue}
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
              formatter={(v: number) => [v.toLocaleString(), viewMode]}
              labelFormatter={(year) => String(year)}
              cursor={{ fill: 'var(--color-accent)', opacity: 0.3 }}
            />
            <Bar
              dataKey={dataKey}
              radius={[3, 3, 0, 0]}
              onMouseEnter={(_, idx) => setHoveredYear(migrationFlows[idx])}
            >
              {migrationFlows.map((d) => {
                const value = d[dataKey] as number
                return (
                  <Cell
                    key={d.year}
                    fill={value >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2">
        <div className="mb-1 text-xs font-bold">{displayLabel}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.65rem]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Domestic In:</span>
            <span className="text-emerald-400">
              +{display.domesticIn.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Domestic Out:</span>
            <span className="text-red-400">
              -{display.domesticOut.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Int'l In:</span>
            <span className="text-emerald-400">
              +{display.internationalIn.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Int'l Out:</span>
            <span className="text-red-400">
              -{display.internationalOut.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="mt-2 flex justify-between border-t border-border/40 pt-1.5 text-[0.65rem] font-semibold">
          <span>Net Change:</span>
          <span
            className={
              display.totalNet > 0 ? 'text-emerald-400' : 'text-red-400'
            }
          >
            {display.totalNet > 0 ? '+' : ''}
            {display.totalNet.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-emerald-500" />
            <span className="text-[0.55rem] text-muted-foreground">Inflow</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-red-500" />
            <span className="text-[0.55rem] text-muted-foreground">
              Outflow
            </span>
          </div>
        </div>
        <span className="text-[0.55rem] text-muted-foreground">
          IRS Migration Data
        </span>
      </div>
    </div>
  )
}
