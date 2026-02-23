import { useExplorer } from './ExplorerProvider'
import { LayerPanel } from './LayerPanel'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

export function MobileLayerDrawer() {
  const { state, dispatch } = useExplorer()

  const close = () => dispatch({ type: 'CLOSE_MOBILE_LAYER_DRAWER' })

  return (
    <Sheet
      open={state.mobileLayerDrawerOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <SheetContent
        side="left"
        showCloseButton={false}
        showOverlay
        className="w-[min(300px,85vw)] gap-0 overflow-y-auto p-0"
      >
        <SheetTitle className="sr-only">Layers</SheetTitle>
        <LayerPanel onClose={close} />
      </SheetContent>
    </Sheet>
  )
}
