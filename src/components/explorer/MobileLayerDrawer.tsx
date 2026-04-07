import { LayerPanel } from './LayerPanel'
import { useExplorerStore } from '@/stores/explorer-store'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

export function MobileLayerDrawer() {
  const open = useExplorerStore((s) => s.mobileLayerDrawerOpen)
  const closeMobileLayerDrawer = useExplorerStore((s) => s.closeMobileLayerDrawer)

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) closeMobileLayerDrawer()
      }}
    >
      <SheetContent
        side="left"
        showCloseButton={false}
        showOverlay
        className="w-[min(300px,85vw)] gap-0 overflow-y-auto p-0"
      >
        <SheetTitle className="sr-only">Layers</SheetTitle>
        <LayerPanel onClose={closeMobileLayerDrawer} />
      </SheetContent>
    </Sheet>
  )
}
