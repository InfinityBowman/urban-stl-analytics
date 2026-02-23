import { ExplorerProvider, useExplorer } from './ExplorerProvider'
import { ChartBuilderProvider } from './analytics/chart-builder/useChartBuilder'
import { ExplorerMap } from './ExplorerMap'
import { LayerPanel } from './LayerPanel'
import { DetailPanel } from './DetailPanel'
import { AnalyticsPanel } from './AnalyticsPanel'
import { CommandBar } from './CommandBar'
import { LayerFab } from './LayerFab'
import { MobileLayerDrawer } from './MobileLayerDrawer'
import { cn } from '@/lib/utils'

function ExplorerLayout() {
  const { state } = useExplorer()

  return (
    <div
      className={cn(
        'grid h-full w-full',
        'grid-cols-[280px_1fr] grid-rows-[1fr_auto]',
        'max-md:grid-cols-1 max-md:grid-rows-1',
      )}
    >
      {/* LayerPanel — desktop only (mobile uses Sheet drawer) */}
      <div className="overlay-scroll hidden overflow-y-auto border-r border-border/60 md:block">
        <LayerPanel />
      </div>

      {/* Map cell — fills remaining space */}
      <div className="relative min-h-0 overflow-hidden">
        <ExplorerMap />

        {/* Detail panel — desktop: right-slide; mobile: fixed bottom sheet */}
        <div
          className={cn(
            'absolute inset-y-0 right-0 z-10 w-[min(380px,100%)]',
            'border-l border-border/60 bg-background shadow-lg',
            'transition-transform duration-200 ease-out will-change-transform',
            'max-md:fixed max-md:inset-auto max-md:bottom-0 max-md:left-0 max-md:right-0',
            'max-md:z-20 max-md:w-full max-md:h-[50vh] max-md:max-h-[50vh]',
            'max-md:border-l-0 max-md:border-t max-md:rounded-t-xl',
            'max-md:overflow-hidden',
            state.detailPanelOpen
              ? 'translate-x-0 max-md:translate-y-0'
              : 'translate-x-full max-md:translate-x-0 max-md:translate-y-full',
          )}
        >
          {/* Drag handle — mobile only */}
          <div className="hidden max-md:flex max-md:shrink-0 max-md:justify-center max-md:pt-2 max-md:pb-1">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
          <div className="flex h-full flex-col max-md:min-h-0 max-md:flex-1 max-md:overflow-y-auto">
            <DetailPanel />
          </div>
        </div>

        {/* Floating layer toggle — mobile only */}
        <LayerFab />
      </div>

      {/* AnalyticsPanel — desktop only */}
      <div className="col-span-full max-md:hidden">
        <AnalyticsPanel />
      </div>

      {/* Mobile layer drawer (Sheet portal) */}
      <MobileLayerDrawer />
    </div>
  )
}

export function MapExplorer() {
  return (
    <ExplorerProvider>
      <ChartBuilderProvider>
        <ExplorerLayout />
        <CommandBar />
      </ChartBuilderProvider>
    </ExplorerProvider>
  )
}
