import { useCallback, useEffect, useMemo } from 'react'
import { useDataStore } from '@/stores/data-store'
import { useExplorerStore } from '@/stores/explorer-store'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function TimeRangeSlider() {
  const showComplaints = useExplorerStore((s) => s.layers.complaints)
  const showCrime = useExplorerStore((s) => s.layers.crime)
  const timeRangeStart = useExplorerStore((s) => s.subToggles.timeRangeStart)
  const setSubToggle = useExplorerStore((s) => s.setSubToggle)
  const csbData = useDataStore((s) => s.csbData)
  const crimeData = useDataStore((s) => s.crimeData)

  const visible = showComplaints || showCrime

  // Collect all heatmap points to derive available years
  const allPoints = useMemo(() => {
    if (!visible) return []
    return [
      ...(showComplaints && csbData ? csbData.heatmapPoints : []),
      ...(showCrime && crimeData ? crimeData.heatmapPoints : []),
    ]
  }, [visible, showComplaints, showCrime, csbData, crimeData])

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
      setSubToggle('timeRangeStart', `${latestYear}-01-01`)
      setSubToggle('timeRangeEnd', `${latestYear}-12-31`)
    }
  }, [years, setSubToggle, showComplaints, showCrime])

  const selectedYear = useMemo(() => {
    if (!timeRangeStart) return years[years.length - 1] ?? 0
    return Number(timeRangeStart.slice(0, 4))
  }, [timeRangeStart, years])

  const handleYearChange = useCallback(
    (values: Array<number>) => {
      if (years.length === 0) return
      const idx = clamp(values[0]!, 0, years.length - 1)
      const year = years[idx]!
      setSubToggle('timeRangeStart', `${year}-01-01`)
      setSubToggle('timeRangeEnd', `${year}-12-31`)
    },
    [years, setSubToggle],
  )

  if (!visible || years.length < 2) return null

  const yearIdx = years.indexOf(selectedYear)
  const safeIdx = yearIdx >= 0 ? yearIdx : years.length - 1

  return (
    <div
      className="absolute bottom-3 left-3 z-10 w-[min(400px,calc(100%-6rem))] rounded-xl border border-border/60 bg-background/90 px-3 py-1.5 shadow-lg backdrop-blur-md max-md:hidden"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
          Year
          <Tooltip>
            <TooltipTrigger asChild>
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                className="cursor-help text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 7v4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="5" r="0.75" fill="currentColor" />
              </svg>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[200px] text-center text-xs"
            >
              Filters 311 Complaints and Crime heatmap layers by year.
            </TooltipContent>
          </Tooltip>
        </span>
        <span className="text-[0.65rem] font-semibold tabular-nums">
          {selectedYear}
        </span>
      </div>

      <Slider
        min={0}
        max={years.length - 1}
        step={1}
        value={[safeIdx]}
        onValueChange={handleYearChange}
      />

      <div className="mt-1 flex select-none justify-between pr-[7px] text-[0.55rem] text-muted-foreground">
        <span>{years[0]}</span>
        <span>{years[years.length - 1]}</span>
      </div>
    </div>
  )
}
