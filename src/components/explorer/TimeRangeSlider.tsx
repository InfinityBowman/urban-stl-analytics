import { useCallback, useEffect, useMemo } from 'react'
import { Slider } from '@/components/ui/slider'
import { useData, useExplorer } from './ExplorerProvider'

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function TimeRangeSlider() {
  const { state, dispatch } = useExplorer()
  const data = useData()

  const showComplaints = state.layers.complaints
  const showCrime = state.layers.crime
  const visible = showComplaints || showCrime

  // Collect all heatmap points to derive available years
  const allPoints = useMemo(() => {
    if (!visible) return []
    return [
      ...(showComplaints && data.csbData ? data.csbData.heatmapPoints : []),
      ...(showCrime && data.crimeData ? data.crimeData.heatmapPoints : []),
    ]
  }, [visible, showComplaints, showCrime, data.csbData, data.crimeData])

  // Derive unique sorted years from data
  const years = useMemo(() => {
    const ys = new Set<number>()
    for (const p of allPoints) {
      const d = p[3]
      if (d) ys.add(Number(d.slice(0, 4)))
    }
    return Array.from(ys).sort((a, b) => a - b)
  }, [allPoints])

  // Default to latest year when layers change
  useEffect(() => {
    if (years.length > 0) {
      const latestYear = years[years.length - 1]
      dispatch({ type: 'SET_SUB_TOGGLE', key: 'timeRangeStart', value: `${latestYear}-01-01` })
      dispatch({ type: 'SET_SUB_TOGGLE', key: 'timeRangeEnd', value: `${latestYear}-12-31` })
    }
  }, [years, dispatch, showComplaints, showCrime])

  const selectedYear = useMemo(() => {
    const { timeRangeStart } = state.subToggles
    if (!timeRangeStart) return years[years.length - 1] ?? null
    return Number(timeRangeStart.slice(0, 4))
  }, [state.subToggles.timeRangeStart, years])

  const handleYearChange = useCallback(
    (values: number[]) => {
      if (years.length === 0) return
      const idx = clamp(values[0], 0, years.length - 1)
      const year = years[idx]
      dispatch({ type: 'SET_SUB_TOGGLE', key: 'timeRangeStart', value: `${year}-01-01` })
      dispatch({ type: 'SET_SUB_TOGGLE', key: 'timeRangeEnd', value: `${year}-12-31` })
    },
    [years, dispatch],
  )

  if (!visible || years.length < 2) return null

  const yearIdx = selectedYear != null ? years.indexOf(selectedYear) : years.length - 1
  const safeIdx = yearIdx >= 0 ? yearIdx : years.length - 1

  return (
    <div
      className="absolute bottom-3 left-3 z-10 w-[min(400px,calc(100%-6rem))] rounded-xl border border-border/60 bg-background/90 px-4 py-2.5 shadow-lg backdrop-blur-md"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
          Year
        </span>
        <span className="text-[0.65rem] font-semibold tabular-nums">
          {selectedYear ?? years[years.length - 1]}
        </span>
      </div>

      <Slider
        min={0}
        max={years.length - 1}
        step={1}
        value={[safeIdx]}
        onValueChange={handleYearChange}
      />

      <div className="mt-1 flex select-none items-center justify-between px-[7px] text-[0.55rem] text-muted-foreground">
        {years.map((y, i) => (
          <div key={y} className="flex w-0 justify-center">
            {i === 0 || i === years.length - 1 ? (
              <span className="whitespace-nowrap">{y}</span>
            ) : (
              <span className="h-1.5 w-px bg-muted-foreground/30" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
