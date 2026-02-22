import { useCallback, useEffect, useRef } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'
import { useExplorer } from '@/components/explorer/ExplorerProvider'
import { ComplaintsAnalytics } from './analytics/ComplaintsAnalytics'
import { TransitAnalytics } from './analytics/TransitAnalytics'
import { VacancyAnalytics } from './analytics/VacancyAnalytics'
import { NeighborhoodAnalytics } from './analytics/NeighborhoodAnalytics'
import { ChartBuilder } from './analytics/ChartBuilder'

export function AnalyticsPanel() {
  const { state, dispatch } = useExplorer()
  const dragRef = useRef<{ startY: number; startH: number } | null>(null)
  const heightRef = useRef(state.analyticsPanelHeight)
  const contentRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const clipHeight = useMotionValue(state.analyticsPanelExpanded ? state.analyticsPanelHeight : 0)

  useEffect(() => {
    heightRef.current = state.analyticsPanelHeight
  }, [state.analyticsPanelHeight])

  // Clean up window listeners if component unmounts mid-drag
  useEffect(() => {
    return () => {
      dragRef.current = null
    }
  }, [])

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDragging.current = true
      dragRef.current = { startY: e.clientY, startH: heightRef.current }

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return
        const delta = dragRef.current.startY - ev.clientY
        const next = Math.min(800, Math.max(150, dragRef.current.startH + delta))
        // Write directly to motion value — no React re-render, no animation
        clipHeight.jump(next)
        if (contentRef.current) contentRef.current.style.height = `${next}px`
      }

      const onUp = () => {
        // Commit final height to state
        const final = Math.round(clipHeight.get())
        isDragging.current = false
        dispatch({ type: 'SET_ANALYTICS_HEIGHT', height: final })
        dragRef.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [dispatch, clipHeight],
  )

  const hasActiveLayer =
    state.layers.complaints ||
    state.layers.transit ||
    state.layers.vacancy ||
    state.layers.foodAccess

  const showNeighborhood = state.selected?.type === 'neighborhood'

  const modules = [
    state.layers.complaints ? <ComplaintsAnalytics key="complaints" /> : null,
    state.layers.transit ? <TransitAnalytics key="transit" /> : null,
    state.layers.vacancy ? <VacancyAnalytics key="vacancy" /> : null,
  ].filter(Boolean)

  const expanded = state.analyticsPanelExpanded

  return (
    <div className="bg-card">
      {/* Drag handle — instant show/hide via height, no animation */}
      <div
        onMouseDown={expanded ? onDragStart : undefined}
        className="group flex items-center justify-center overflow-hidden border-b border-border/40 hover:bg-accent/30"
        style={{
          height: expanded ? 8 : 0,
          cursor: expanded ? 'row-resize' : undefined,
        }}
      >
        <div className="h-0.5 w-8 rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-muted-foreground/60" />
      </div>

      {/* Toggle button */}
      <button
        onClick={() => {
          const next = !expanded
          dispatch({ type: 'TOGGLE_ANALYTICS' })
          animate(clipHeight, next ? state.analyticsPanelHeight : 0, {
            type: 'tween',
            duration: 0.25,
            ease: 'easeOut',
          })
        }}
        className="flex w-full items-center justify-between border-b border-border/60 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent/50"
      >
        <span className="uppercase tracking-widest">Analytics</span>
        <span className="text-[0.6rem]">
          {expanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {/* Charts — always mounted, motion handles the clip animation */}
      <motion.div
        style={{ height: clipHeight }}
        className="overflow-hidden"
      >
        <div
          ref={contentRef}
          className="overflow-y-scroll px-4 py-3"
          style={{ height: state.analyticsPanelHeight }}
        >
          {showNeighborhood ? (
            <NeighborhoodAnalytics
              id={(state.selected as { type: 'neighborhood'; id: string }).id}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {hasActiveLayer && modules.length > 0 && (
                modules.length === 1 ? (
                  modules[0]
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {modules}
                  </div>
                )
              )}
              <ChartBuilder />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
