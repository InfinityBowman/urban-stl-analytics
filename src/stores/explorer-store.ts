import { create } from 'zustand'
import type {
  ExplorerState,
  LayerToggles,
  MapStyle,
  SelectedEntity,
  SubToggles,
} from '@/lib/explorer-types'
import { initialExplorerState } from '@/lib/explorer-types'

// Invariant: never mutate this store synchronously during render.
// All writes must happen in effects, event handlers, or executors.
// The app is SSR'd by TanStack Start and a sync-in-render write would
// leak state across requests.

interface ExplorerStore extends ExplorerState {
  toggleLayer: (layer: keyof LayerToggles) => void
  setSubToggle: <T extends keyof SubToggles>(key: T, value: SubToggles[T]) => void
  selectEntity: (entity: SelectedEntity) => void
  clearSelection: () => void
  closeDetail: () => void
  openMobileLayerDrawer: () => void
  closeMobileLayerDrawer: () => void
  toggleAnalytics: () => void
  setAnalyticsTab: (tab: string) => void
  setAnalyticsHeight: (height: number) => void
  setMapStyle: (style: MapStyle) => void
  toggleCompareMode: () => void
  setCompareNeighborhood: (slot: 'A' | 'B', id: string) => void
  clearCompareNeighborhood: (slot: 'A' | 'B') => void
}

export const useExplorerStore = create<ExplorerStore>()((set) => ({
  ...initialExplorerState,

  toggleLayer: (layer) =>
    set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),

  setSubToggle: (key, value) =>
    set((s) => ({ subToggles: { ...s.subToggles, [key]: value } })),

  selectEntity: (entity) => set({ selected: entity, detailPanelOpen: true }),

  clearSelection: () => set({ selected: null, detailPanelOpen: false }),

  closeDetail: () => set({ detailPanelOpen: false }),

  openMobileLayerDrawer: () => set({ mobileLayerDrawerOpen: true }),

  closeMobileLayerDrawer: () => set({ mobileLayerDrawerOpen: false }),

  toggleAnalytics: () =>
    set((s) => ({ analyticsPanelExpanded: !s.analyticsPanelExpanded })),

  setAnalyticsTab: (tab) => set({ analyticsTab: tab }),

  setAnalyticsHeight: (height) =>
    set({ analyticsPanelHeight: Math.min(800, Math.max(150, height)) }),

  setMapStyle: (style) => set({ mapStyle: style }),

  toggleCompareMode: () =>
    set((s) => {
      const entering = !s.compareMode
      // When entering compare mode with a neighborhood selected, pre-fill it as A
      const prefillA =
        entering && s.selected?.type === 'neighborhood' ? s.selected.id : null
      return {
        compareMode: entering,
        compareNeighborhoodA: prefillA,
        compareNeighborhoodB: null,
        detailPanelOpen: true,
      }
    }),

  setCompareNeighborhood: (slot, id) =>
    set(slot === 'A' ? { compareNeighborhoodA: id } : { compareNeighborhoodB: id }),

  clearCompareNeighborhood: (slot) =>
    set(slot === 'A' ? { compareNeighborhoodA: null } : { compareNeighborhoodB: null }),
}))
