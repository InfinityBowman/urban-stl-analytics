import { create } from 'zustand'
import type { ExplorerData, LayerToggles } from '@/lib/explorer-types'

// Invariant: never mutate this store synchronously during render.
// All writes must happen in effects, event handlers, or executors.

interface DataStore extends ExplorerData {
  failedDatasets: Set<string>
  loadBaseData: () => Promise<void>
  loadLayer: (layer: keyof LayerToggles) => Promise<void>
}

// Module-private dedupe map. The promise stays in the map after resolution
// so subsequent calls return the already-fulfilled promise (no re-fetching).
// Failed loads also resolve (not reject) - errors are surfaced via
// failedDatasets in the store, not by throwing.
const inFlight = new Map<string, Promise<void>>()

const initialData: ExplorerData = {
  neighborhoods: null,
  routes: null,
  groceryStores: null,
  csbData: null,
  trendsData: null,
  stops: null,
  shapes: null,
  stopStats: null,
  foodDeserts: null,
  vacancyData: null,
  crimeData: null,
  arpaData: null,
  demographicsData: null,
  housingData: null,
}

async function fetchJson(url: string) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Failed to load ${url}`)
  return r.json()
}

export const useDataStore = create<DataStore>()((set) => {
  const markFailed = (layer: string) =>
    set((s) => {
      const next = new Set(s.failedDatasets)
      next.add(layer)
      return { failedDatasets: next }
    })

  const loadBaseData = (): Promise<void> => {
    const existing = inFlight.get('__base__')
    if (existing) return existing
    const p = (async () => {
      try {
        const [neighborhoods, routes, groceryStores] = await Promise.all([
          fetchJson('/data/neighborhoods.geojson'),
          fetchJson('/data/routes.json'),
          fetchJson('/data/grocery_stores.geojson'),
        ])
        set({ neighborhoods, routes, groceryStores })
      } catch (err) {
        console.error('Failed to load base data:', err)
        markFailed('__base__')
      }
    })()
    inFlight.set('__base__', p)
    return p
  }

  const loadLayer = (layer: keyof LayerToggles): Promise<void> => {
    const existing = inFlight.get(layer)
    if (existing) return existing

    const p = (async () => {
      try {
        switch (layer) {
          case 'complaints': {
            const [csbData, trendsData] = await Promise.all([
              fetchJson('/data/csb_latest.json'),
              fetchJson('/data/trends.json'),
            ])
            set({ csbData, trendsData })
            break
          }

          case 'transit': {
            const [stops, shapes, stopStats] = await Promise.all([
              fetchJson('/data/stops.geojson'),
              fetch('/data/shapes.geojson')
                .then((r) => r.json())
                .catch(() => null),
              fetchJson('/data/stop_stats.json'),
            ])
            set({ stops, shapes, stopStats })
            break
          }

          case 'vacancy': {
            const vacancyData = await fetchJson('/data/vacancies.json')
            set({ vacancyData })
            break
          }

          case 'foodAccess': {
            const foodDeserts = await fetchJson('/data/food_deserts.geojson')
            set({ foodDeserts })
            break
          }

          case 'crime': {
            const crimeData = await fetchJson('/data/crime.json')
            set({ crimeData })
            break
          }

          case 'arpa': {
            const arpaData = await fetchJson('/data/arpa.json')
            set({ arpaData })
            break
          }

          case 'demographics': {
            const demographicsData = await fetchJson('/data/demographics.json')
            set({ demographicsData })
            break
          }

          case 'housing': {
            const housingData = await fetchJson('/data/housing.json')
            set({ housingData })
            break
          }
        }
      } catch {
        markFailed(layer)
      }
    })()

    inFlight.set(layer, p)
    return p
  }

  return {
    ...initialData,
    failedDatasets: new Set(),
    loadBaseData,
    loadLayer,
  }
})

/**
 * Snapshot the current data as a plain ExplorerData object. Used by AI
 * executors that take the data by value instead of subscribing.
 */
export function getDataSnapshot(): ExplorerData {
  const s = useDataStore.getState()
  return {
    neighborhoods: s.neighborhoods,
    routes: s.routes,
    groceryStores: s.groceryStores,
    csbData: s.csbData,
    trendsData: s.trendsData,
    stops: s.stops,
    shapes: s.shapes,
    stopStats: s.stopStats,
    foodDeserts: s.foodDeserts,
    vacancyData: s.vacancyData,
    crimeData: s.crimeData,
    arpaData: s.arpaData,
    demographicsData: s.demographicsData,
    housingData: s.housingData,
  }
}

/**
 * Helper for executors: ensure all listed layers (or base data) are loaded
 * before reading from the store. Resolves when all datasets are available
 * (or have failed).
 */
export async function ensureLoaded(
  ...layers: Array<keyof LayerToggles | 'base'>
): Promise<void> {
  const store = useDataStore.getState()
  await Promise.all(
    layers.map((l) =>
      l === 'base' ? store.loadBaseData() : store.loadLayer(l),
    ),
  )
}
