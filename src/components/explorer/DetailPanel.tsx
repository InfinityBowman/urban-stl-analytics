import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  Building03Icon,
  Bus01Icon,
  Store01Icon,
  BubbleChatAddIcon,
  AlertDiamondIcon,
  Group01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { useExplorer } from './ExplorerProvider'
import { NeighborhoodDetail } from './detail/NeighborhoodDetail'
import { VacancyDetail } from './detail/VacancyDetail'
import { StopDetail } from './detail/StopDetail'
import { GroceryDetail } from './detail/GroceryDetail'
import { FoodDesertDetail } from './detail/FoodDesertDetail'
import { CommunityVoiceDetail } from './detail/CommunityVoiceDetail'
import { NeighborhoodComparePanel } from './detail/NeighborhoodComparePanel'
import { Switch } from '@/components/ui/switch'

type IconType = typeof Building03Icon

const ENTITY_CONFIG: Record<
  string,
  { label: string; color: string; icon: IconType }
> = {
  neighborhood: { label: 'Neighborhood', color: '#6366f1', icon: Group01Icon },
  vacancy: {
    label: 'Vacant Property',
    color: '#f59e0b',
    icon: Building03Icon,
  },
  stop: { label: 'Transit Stop', color: '#60a5fa', icon: Bus01Icon },
  grocery: { label: 'Grocery Store', color: '#10b981', icon: Store01Icon },
  foodDesert: {
    label: 'Food Desert',
    color: '#ef4444',
    icon: AlertDiamondIcon,
  },
  communityVoice: {
    label: 'Community Voice',
    color: '#ec4899',
    icon: BubbleChatAddIcon,
  },
}

export function DetailPanel() {
  const { state, dispatch } = useExplorer()

  const config = state.selected
    ? ENTITY_CONFIG[state.selected.type]
    : undefined

  const isNeighborhood =
    state.selected?.type === 'neighborhood' || state.compareMode
  const showCompare = isNeighborhood || (!state.selected && !state.compareMode)

  return (
    <div className="flex h-full flex-col">
      {state.compareMode ? (
        <>
          {/* Neighborhood header with compare toggle */}
          <div className="border-b border-border/60">
            <div
              className="h-[3px]"
              style={{ background: ENTITY_CONFIG.neighborhood.color }}
            />
            <div className="flex items-center gap-2.5 px-4 py-2.5">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={{ background: ENTITY_CONFIG.neighborhood.color }}
              >
                <HugeiconsIcon
                  icon={ENTITY_CONFIG.neighborhood.icon}
                  strokeWidth={2}
                  className="size-3 text-white"
                />
              </div>
              <span className="text-[0.7rem] font-semibold text-foreground">
                Neighborhood
              </span>
              <div className="flex-1" />
              <button
                onClick={() => dispatch({ type: 'TOGGLE_COMPARE_MODE' })}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
              </button>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 px-4 py-2">
              <span className="text-[0.62rem] font-medium text-muted-foreground">
                Compare mode
              </span>
              <Switch
                checked={state.compareMode}
                onCheckedChange={() =>
                  dispatch({ type: 'TOGGLE_COMPARE_MODE' })
                }
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NeighborhoodComparePanel
              neighborhoodA={state.compareNeighborhoodA}
              neighborhoodB={state.compareNeighborhoodB}
            />
          </div>
        </>
      ) : state.selected && config ? (
        <>
          {/* Entity header */}
          <div className="border-b border-border/60">
            <div
              className="h-[3px]"
              style={{ background: config.color }}
            />
            <div className="flex items-center gap-2.5 px-4 py-2.5">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={{ background: config.color }}
              >
                <HugeiconsIcon
                  icon={config.icon}
                  strokeWidth={2}
                  className="size-3 text-white"
                />
              </div>
              <span className="text-[0.7rem] font-semibold text-foreground">
                {config.label}
              </span>
              <div className="flex-1" />
              <button
                onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
              </button>
            </div>
            {/* Compare toggle - only for neighborhoods */}
            {state.selected.type === 'neighborhood' && (
              <div className="flex items-center justify-between border-t border-border/40 px-4 py-2">
                <span className="text-[0.62rem] font-medium text-muted-foreground">
                  Compare neighborhoods
                </span>
                <Switch
                  checked={state.compareMode}
                  onCheckedChange={() =>
                    dispatch({ type: 'TOGGLE_COMPARE_MODE' })
                  }
                />
              </div>
            )}
          </div>

          {/* Detail content */}
          <div className="flex-1 overflow-y-auto p-4">
            {state.selected.type === 'neighborhood' && (
              <NeighborhoodDetail id={state.selected.id} />
            )}
            {state.selected.type === 'vacancy' && (
              <VacancyDetail id={state.selected.id} />
            )}
            {state.selected.type === 'stop' && (
              <StopDetail id={state.selected.id} />
            )}
            {state.selected.type === 'grocery' && (
              <GroceryDetail id={state.selected.id} />
            )}
            {state.selected.type === 'foodDesert' && (
              <FoodDesertDetail id={state.selected.id} />
            )}
            {state.selected.type === 'communityVoice' && (
              <CommunityVoiceDetail id={state.selected.id} />
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={1.5}
              className="size-4.5 text-muted-foreground"
            />
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground">
              No selection
            </div>
            <div className="mt-0.5 text-[0.62rem] leading-relaxed text-muted-foreground/70">
              Click any feature on the map to view its details
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
