import { create } from 'zustand'
import type { ExplorerData, LayerToggles } from '@/lib/explorer-types'

// Invariant: never mutate this store synchronously during render.
// All writes must happen in effects, event handlers, or executors.

interface DataStore extends ExplorerData {
  failedDatasets: Set<string>
  loadBaseData: () => void
  loadLayer: (layer: keyof LayerToggles) => void
}

// Module-private dedupe set. Not part of the store shape because consumers
// never need to read it and we don't want it triggering re-renders.
const fetched = new Set<string>()

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

export const useDataStore = create<DataStore>()((set) => {
  const markFailed = (layer: string) =>
    set((s) => {
      const next = new Set(s.failedDatasets)
      next.add(layer)
      return { failedDatasets: next }
    })

  return {
    ...initialData,
    failedDatasets: new Set(),

    loadBaseData: () => {
      if (fetched.has('__base__')) return
      fetched.add('__base__')
      Promise.all([
        fetch('/data/neighborhoods.geojson').then((r) => {
          if (!r.ok) throw new Error('Failed to load neighborhoods')
          return r.json()
        }),
        fetch('/data/routes.json').then((r) => {
          if (!r.ok) throw new Error('Failed to load routes')
          return r.json()
        }),
        fetch('/data/grocery_stores.geojson').then((r) => {
          if (!r.ok) throw new Error('Failed to load grocery stores')
          return r.json()
        }),
      ])
        .then(([neighborhoods, routes, groceryStores]) => {
          set({ neighborhoods, routes, groceryStores })
        })
        .catch((err) => {
          console.error('Failed to load base data:', err)
        })
    },

    loadLayer: (layer) => {
      if (fetched.has(layer)) return
      fetched.add(layer)

      switch (layer) {
        case 'complaints':
          Promise.all([
            fetch('/data/csb_latest.json').then((r) => {
              if (!r.ok) throw new Error('not found')
              return r.json()
            }),
            fetch('/data/trends.json').then((r) => {
              if (!r.ok) throw new Error('not found')
              return r.json()
            }),
          ])
            .then(([csbData, trendsData]) => {
              set({ csbData, trendsData })
            })
            .catch(() => markFailed('complaints'))
          break

        case 'transit':
          Promise.all([
            fetch('/data/stops.geojson').then((r) => {
              if (!r.ok) throw new Error('not found')
              return r.json()
            }),
            fetch('/data/shapes.geojson')
              .then((r) => r.json())
              .catch(() => null),
            fetch('/data/stop_stats.json').then((r) => {
              if (!r.ok) throw new Error('not found')
              return r.json()
            }),
          ])
            .then(([stops, shapes, stopStats]) => {
              set({ stops, shapes, stopStats })
            })
            .catch(() => markFailed('transit'))
          break

        case 'vacancy':
          fetch('/data/vacancies.json')
            .then((r) => {
              if (!r.ok) throw new Error('not found')
              return r.json()
            })
            .then((vacancyData) => set({ vacancyData }))
            .catch(() => markFailed('vacancy'))
          break

        case 'foodAccess':
          fetch('/data/food_deserts.geojson')
            .then((r) => {
              if (!r.ok) throw new Error('not found')
              return r.json()
            })
            .then((foodDeserts) => set({ foodDeserts }))
            .catch(() => markFailed('foodAccess'))
          break

        case 'crime':
          fetch('/data/crime.json')
            .then((r) => {
              if (!r.ok) throw new Error('not found')
              return r.json()
            })
            .then((crimeData) => set({ crimeData }))
            .catch(() => markFailed('crime'))
          break

        case 'arpa':
          fetch('/data/arpa.json')
            .then((r) => {
              if (!r.ok) throw new Error('not found')
              return r.json()
            })
            .then((arpaData) => set({ arpaData }))
            .catch(() => markFailed('arpa'))
          break

        case 'demographics':
          fetch('/data/demographics.json')
            .then((r) => {
              if (!r.ok) throw new Error('not found')
              return r.json()
            })
            .then((demographicsData) => set({ demographicsData }))
            .catch(() => markFailed('demographics'))
          break

        case 'housing':
          fetch('/data/housing.json')
            .then((r) => {
              if (!r.ok) throw new Error('not found')
              return r.json()
            })
            .then((housingData) => set({ housingData }))
            .catch(() => markFailed('housing'))
          break
      }
    },
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
