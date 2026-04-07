import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'
import { ComplaintsAnalytics } from './analytics/ComplaintsAnalytics'
import { TransitAnalytics } from './analytics/TransitAnalytics'
import { VacancyAnalytics } from './analytics/VacancyAnalytics'
import { NeighborhoodAnalytics } from './analytics/NeighborhoodAnalytics'
import { ChartBuilder } from './analytics/ChartBuilder'
import { CrimeAnalytics } from './analytics/CrimeAnalytics'
import { ArpaAnalytics } from './analytics/ArpaAnalytics'
import { DemographicsAnalytics } from './analytics/DemographicsAnalytics'
import { HousingAnalytics } from './analytics/HousingAnalytics'
import type { LayerToggles } from '@/lib/explorer-types'
import { useExplorerStore } from '@/stores/explorer-store'
import { useDataStore } from '@/stores/data-store'

interface TabDef {
  key: string
  label: string
  color?: string
  layer?: keyof LayerToggles
  node: React.ReactNode
}

const LAYER_TABS: Array<{
  key: string
  label: string
  color: string
  layer: keyof LayerToggles
  component: () => React.ReactNode
}> = [
  { key: 'complaints', label: '311 Complaints', color: 'text-indigo-400', layer: 'complaints', component: () => <ComplaintsAnalytics /> },
  { key: 'crime', label: 'Crime', color: 'text-orange-400', layer: 'crime', component: () => <CrimeAnalytics /> },
  { key: 'transit', label: 'Transit & Equity', color: 'text-blue-400', layer: 'transit', component: () => <TransitAnalytics /> },
  { key: 'vacancy', label: 'Vacancy Triage', color: 'text-amber-400', layer: 'vacancy', component: () => <VacancyAnalytics /> },
  { key: 'arpa', label: 'ARPA Funds', color: 'text-emerald-400', layer: 'arpa', component: () => <ArpaAnalytics /> },
  { key: 'demographics', label: 'Demographics', color: 'text-purple-400', layer: 'demographics', component: () => <DemographicsAnalytics /> },
  { key: 'housing', label: 'Housing', color: 'text-teal-400', layer: 'housing', component: () => <HousingAnalytics /> },
]

export function AnalyticsPanel() {
  const selected = useExplorerStore((s) => s.selected)
  const analyticsPanelExpanded = useExplorerStore((s) => s.analyticsPanelExpanded)
  const analyticsPanelHeight = useExplorerStore((s) => s.analyticsPanelHeight)
  const analyticsTab = useExplorerStore((s) => s.analyticsTab)
  const toggleAnalytics = useExplorerStore((s) => s.toggleAnalytics)
  const setAnalyticsTab = useExplorerStore((s) => s.setAnalyticsTab)
  const setAnalyticsHeight = useExplorerStore((s) => s.setAnalyticsHeight)

  const [activeTab, setActiveTab] = useState<string>('')
  const heightRef = useRef(analyticsPanelHeight)
  const contentRef = useRef<HTMLDivElement>(null)
  const clipHeight = useMotionValue(analyticsPanelExpanded ? analyticsPanelHeight : 0)

  // Show all analytics tabs always — data loads on demand
  const tabs = useMemo<Array<TabDef>>(() => {
    const result: Array<TabDef> = LAYER_TABS.map((lt) => ({
      key: lt.key,
      label: lt.label,
      color: lt.color,
      layer: lt.layer,
      node: lt.component(),
    }))
    result.push({ key: 'chart', label: 'Chart Builder', node: <ChartBuilder /> })
    return result
  }, [])

  // Default to first tab
  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].key)
    }
  }, [tabs, activeTab])

  // Sync from external state (e.g. AI configure_chart)
  useEffect(() => {
    if (analyticsTab) {
      setActiveTab(analyticsTab)
      // Animate open if the panel just expanded programmatically
      if (analyticsPanelExpanded) {
        animate(clipHeight, analyticsPanelHeight, {
          type: 'tween',
          duration: 0.25,
          ease: 'easeOut',
        })
      }
      setAnalyticsTab('')
    }
  }, [analyticsTab, analyticsPanelExpanded, analyticsPanelHeight, setAnalyticsTab, clipHeight])

  // Load data when a tab is selected (regardless of layer toggle)
  const handleTabClick = useCallback((tabKey: string) => {
    setActiveTab(tabKey)
    const tab = LAYER_TABS.find((lt) => lt.key === tabKey)
    if (tab) {
      const loadLayer = useDataStore.getState().loadLayer
      loadLayer(tab.layer)
      // Transit needs food access data for equity gaps
      if (tab.layer === 'transit') loadLayer('foodAccess')
    }
  }, [])

  useEffect(() => {
    heightRef.current = analyticsPanelHeight
  }, [analyticsPanelHeight])

  // Drag-to-resize: attach window listeners via effect so they're always
  // cleaned up, even if the drag is interrupted by an unmount or focus loss.
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ startY: number; startH: number } | null>(null)

  useEffect(() => {
    if (!isDragging) return
    const onMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return
      const delta = dragStartRef.current.startY - ev.clientY
      const next = Math.min(
        800,
        Math.max(150, dragStartRef.current.startH + delta),
      )
      clipHeight.jump(next)
      if (contentRef.current) contentRef.current.style.height = `${next}px`
    }
    const onUp = () => {
      const final = Math.round(clipHeight.get())
      setAnalyticsHeight(final)
      dragStartRef.current = null
      setIsDragging(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDragging, clipHeight, setAnalyticsHeight])

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragStartRef.current = { startY: e.clientY, startH: heightRef.current }
    setIsDragging(true)
  }, [])

  const showNeighborhood = selected?.type === 'neighborhood'
  const expanded = analyticsPanelExpanded
  const currentTab = tabs.find((t) => t.key === activeTab)

  return (
    <div className="bg-card">
      {/* Drag handle */}
      <div
        onMouseDown={expanded ? onDragStart : undefined}
        className={`group flex items-center justify-center overflow-hidden hover:bg-accent/30 `}
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
          toggleAnalytics()
          animate(clipHeight, next ? analyticsPanelHeight : 0, {
            type: 'tween',
            duration: 0.25,
            ease: 'easeOut',
          })
        }}
        className={`flex w-full items-center justify-between px-4 py-2 text-xs font-semibold transition-colors ${
          expanded
            ? 'border-t border-brand/30 border-b border-b-border/60 text-brand'
            : 'border-t border-brand/20 text-brand-light hover:border-brand/40 hover:text-brand'
        }`}
      >
        <span className="uppercase tracking-widest">Analytics</span>
        <span className="text-[0.6rem]">
          {expanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {/* Tab bar */}
      {expanded && !showNeighborhood && tabs.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border/40 px-4 py-1.5">
          {tabs.map((tab) => (
            <TabPill
              key={tab.key}
              active={activeTab === tab.key}
              activeColor={tab.color}
              onClick={() => handleTabClick(tab.key)}
            >
              {tab.label}
            </TabPill>
          ))}
        </div>
      )}

      {/* Content */}
      <motion.div
        style={{ height: clipHeight }}
        className="overflow-hidden"
      >
        <div
          ref={contentRef}
          className="overflow-y-scroll px-4 py-3"
          style={{ height: analyticsPanelHeight }}
        >
          {showNeighborhood ? (
            <NeighborhoodAnalytics
              id={(selected as { type: 'neighborhood'; id: string }).id}
            />
          ) : currentTab ? (
            currentTab.node
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}

function TabPill({
  active,
  activeColor,
  onClick,
  children,
}: {
  active: boolean
  activeColor?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-md px-2.5 py-1 text-[0.65rem] font-medium transition-colors ${
        active
          ? `bg-accent ${activeColor ?? 'text-accent-foreground'}`
          : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
