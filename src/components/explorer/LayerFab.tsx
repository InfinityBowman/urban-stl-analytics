import { HugeiconsIcon } from '@hugeicons/react'
import { Layers01Icon } from '@hugeicons/core-free-icons'
import { useExplorer } from './ExplorerProvider'
import { cn } from '@/lib/utils'

export function LayerFab() {
  const { state, dispatch } = useExplorer()

  const activeCount = Object.values(state.layers).filter(Boolean).length

  return (
    <button
      onClick={() => dispatch({ type: 'OPEN_MOBILE_LAYER_DRAWER' })}
      className={cn(
        'md:hidden',
        'absolute bottom-6 left-4 z-20',
        'flex h-11 w-11 items-center justify-center rounded-full',
        'border border-border/60 bg-background/95 shadow-lg backdrop-blur-sm',
        'transition-all duration-150 active:scale-95',
        state.detailPanelOpen && 'max-md:pointer-events-none max-md:opacity-0',
      )}
      aria-label="Open layers panel"
    >
      <HugeiconsIcon
        icon={Layers01Icon}
        strokeWidth={2}
        className="size-5 text-foreground"
      />
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold leading-none text-primary-foreground">
          {activeCount}
        </span>
      )}
    </button>
  )
}
