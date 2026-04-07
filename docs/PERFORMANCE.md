# Performance Audit

Verified findings from a code-level audit of memory and runtime speed.
File/line references reflect the state of the repo at audit time; re-verify
before acting on any recommendation.

## Data sizes (verified)

`public/data/` totals ~21 MB on disk. Top files:

| File | Size | Records |
| --- | --- | --- |
| vacancies.json | 5.9 MB | 9,528 |
| crime.json | 4.1 MB | 50,000 heatmap points |
| csb_latest.json | 3.7 MB | 50,000 heatmap points |
| csb_2025.json | 3.7 MB | (unused at runtime) |
| shapes.geojson | 2.2 MB | GTFS shapes |
| stops.geojson | 872 KB | GTFS stops |
| food_deserts.geojson | 376 KB | LILA tracts |
| neighborhoods.geojson | 160 KB | 79 features |

`csb_2025.json` is not imported anywhere in `src/`. It only appears in
`docs/DATA-SOURCES.md` and `python/training/`. Safe to delete from
`public/data/` to drop 3.7 MB from the deployed asset bundle.

## Findings (ranked)

### 1. No cache for `computeNeighborhoodMetrics`

Severity: high (CPU)
Files: `src/lib/neighborhood-metrics.ts`, `src/components/explorer/detail/useNeighborhoodMetrics.ts`

`useNeighborhoodMetrics` memoizes with `[id, data]`. Because `data` is the
monolithic context object, every dataset load invalidates the memo - so
during initial cascade the metrics for the selected neighborhood are
recomputed up to 8 times in a row. Compare panel doubles it.

The compute itself iterates all vacancies, all stops, and all grocery stores
per call (haversine each). For a single neighborhood that is roughly
9,528 + ~hundreds + ~50 = ~10K haversine calls. Cheap individually, painful
when fired repeatedly.

Fix: cache by id with a `Map`, keyed on the identities of the slices the
function actually reads. Pass only those slices in (not the whole `data`
object) so React's memo dep list is stable.

```ts
// in neighborhood-metrics.ts
const cache = new WeakMap<object, Map<string, NeighborhoodMetrics | null>>()

export function computeNeighborhoodMetrics(
  id: string,
  data: ExplorerData,
): NeighborhoodMetrics | null {
  // use a stable per-input key
  let bucket = cache.get(data.neighborhoods!)
  if (!bucket) {
    bucket = new Map()
    cache.set(data.neighborhoods!, bucket)
  }
  const cacheKey = `${id}|${!!data.vacancyData}|${!!data.stops}|${!!data.groceryStores}`
  if (bucket.has(cacheKey)) return bucket.get(cacheKey)!
  const result = computeImpl(id, data)
  bucket.set(cacheKey, result)
  return result
}
```

### 2. `queryRenderedFeatures` on every mousemove

Severity: high (CPU, hot path)
File: `src/components/explorer/ExplorerMap.tsx:218-225`

The `mousemove` handler runs `queryRenderedFeatures` against up to 5
interactive layers on every pointer move just to set the cursor. No debounce.

Fix: use Mapbox's per-layer `mouseenter` / `mouseleave` events. They use the
internal hit-test path and avoid the global query.

```ts
const interactiveLayers = [
  'vacancy-circles',
  'stops-circles',
  'grocery-circles',
  'desert-fill',
  'neighborhood-base-fill',
]
for (const layer of interactiveLayers) {
  map.on('mouseenter', layer, () => {
    if (map.getLayer(layer)) map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', layer, () => {
    map.getCanvas().style.cursor = ''
  })
}
```

### 3. Monolithic `DataContext` causes cascade re-renders

Severity: high (CPU + perceived jank)
File: `src/components/explorer/ExplorerProvider.tsx:308`

Every dataset that finishes loading replaces the `data` reference, which
re-renders every consumer of `useData()` - all layers, all analytics
modules, the detail panel. With finding #4 below, this happens 8 times in a
row on initial mount.

The same problem applies to `useExplorer()`: any dispatch re-renders every
consumer of the explorer context, even when they only care about an
unrelated slice of state.

**Fix: migrate to zustand.** See the "Adopting zustand" section below for
the full plan. Zustand's selector-based subscriptions make consumers
re-render only when their specific slice changes, which fixes this finding
and unblocks finding #1 (the metrics cache).

### 4. All 8 datasets fetched eagerly on mount

Severity: high (memory + TTI)
File: `src/components/explorer/ExplorerProvider.tsx:295-304`

The lazy `loadLayerData` mechanism exists but is immediately called for
complaints, crime, transit, vacancy, foodAccess, arpa, demographics, housing.
Comment explains the intent: "so the AI chat can query any data without
requiring the user to enable layers first." This is a deliberate trade-off
but every visitor to `/explore` pays ~17 MB on first paint.

Fix options (least to most invasive):

1. Move the `useEffect` block out of `ExplorerProvider` and into the
   `_app/explore.tsx` route loader so `/`, `/about`, `/population`, and
   `/housing` do not pay it.
2. Have `data-executor` (the AI tool runtime) call `loadLayerData(layer)`
   on demand and `await` until the slice populates before reading from it.
3. Keep the eager fetch but mark the dataset fetches as low priority
   (`fetchPriority: 'low'`, after-idle scheduling) so they do not block the
   first interactive paint.

### 5. Heatmap point filtering on every slider tick

Severity: medium (CPU)
Files: `src/components/explorer/layers/ComplaintsLayer.tsx:18-31`,
`src/components/explorer/layers/CrimeLayer.tsx:18-31`

Each slider movement does a full `.filter()` over 50,000 points by category
and date range. ~1-5 ms each, but it triggers a downstream rebuild of the
choropleth `FeatureCollection` and the breaks array.

Fix: precompute an index at data load time and use lookups instead of
filtering.

```ts
interface HeatmapIndex {
  byYearAndCategory: Map<string, Array<HeatmapPoint>> // key = `${year}|${category}`
  // or two separate Maps and intersect
}
```

Better: do not rebuild `choroplethGeo` from scratch on every change. Keep
the neighborhood geojson stable and move the per-neighborhood count into a
Mapbox `feature-state`, which avoids replacing the source data.

### 6. `NeighborhoodBaseLayer` builds inline Mapbox expressions every render

Severity: medium (Map paint)
File: `src/components/explorer/layers/NeighborhoodBaseLayer.tsx:23-45`

`matchExpr`, `matchCompareA`, `matchCompareB`, and `isCompareSelected` are
fresh expression objects every render. Each new reference passed to a paint
property can trigger a paint re-evaluation.

Fix: memoize, or move selection state into Mapbox `feature-state` and have
the paint expression read from `['feature-state', 'selected']` instead.

### 7. `ChartBuilder.extract` re-runs on any data load

Severity: medium (CPU)
File: `src/components/explorer/analytics/ChartBuilder.tsx:36-39`

```ts
const chartData = useMemo(
  () => currentDef?.extract(data) ?? null,
  [currentDef, data],
)
```

`data` is the monolithic context object, so this re-extracts whenever any
unrelated dataset loads. Once finding #3 is fixed this becomes moot, but in
the meantime each `extract` function should declare which slices it needs
and the dep list should narrow accordingly.

### 8. `VacancyLayer` rebuilds full GeoJSON on every filter change

Severity: medium (allocations)
File: `src/components/explorer/layers/VacancyLayer.tsx:22-41`

Maps the filtered list (~9,528 entries worst case) into a fresh
`FeatureCollection` on every `state.subToggles` change. Allocates ~10K
feature objects each time.

Fix options:

- Build the GeoJSON once at data load time and use a Mapbox filter
  expression to hide/show features. Avoids reallocating.
- Or enable `cluster: true` on the source so most features collapse into
  cluster points at typical zoom levels.

### 9. `AnalyticsPanel` drag listeners can leak

Severity: low (memory)
File: `src/components/explorer/AnalyticsPanel.tsx:108-133`

`mousemove` / `mouseup` are added to `window` inside `onDragStart` and only
removed inside `onUp`. If the user releases the button outside the window,
or the component unmounts mid-drag, the listeners stay attached.

Fix: track dragging state in a ref and use a `useEffect` whose cleanup
unconditionally removes the listeners. Or use the Pointer Events API with
`setPointerCapture`, which guarantees the up event fires.

## Adopting zustand

This is the recommended fix for finding #3 and the architectural unlock for
finding #1.

### Current state surface

| Where | Today | Migrate? |
| --- | --- | --- |
| `ExplorerProvider` UI state | `useReducer` + context | yes - explorer store |
| `ExplorerProvider` datasets | `useState` + context | yes - data store |
| `ExplorerProvider` failed loads | `useState<Set>` + context | yes - merge into data store |
| `ExplorerProvider` fetch dedupe | `useRef<Set>` | move into data store as private |
| `useChartBuilder` | local reducer + own context | no - per-instance, fine as-is |
| `useChat` | local `useState` x4 + refs | no - self-contained, no sharing |
| `commandBarEvents` | `EventTarget` bridge | no - keep, or fold into store later |
| `MapProvider` | `useRef<MapRef>` | no - Mapbox handle, not app state |

33 files import `useExplorer()` or `useData()`. That is the migration
footprint.

### What zustand fixes

The headline problem is that every consumer of `useData()` or
`useExplorer()` re-renders on every dataset load and every dispatch,
because React Context only diffs by reference identity of the provider
value. With zustand, components subscribe to a specific selector and
re-render only when that selector's output changes:

```ts
// before - re-renders on ANY dataset load
const data = useData()
const points = data.crimeData?.heatmapPoints

// after - re-renders only when crimeData changes
const points = useDataStore((s) => s.crimeData?.heatmapPoints)
```

Same shape for UI state:

```ts
const compareMode = useExplorerStore((s) => s.compareMode)
const selectedHoodId = useExplorerStore((s) =>
  s.selected?.type === 'neighborhood' ? s.selected.id : null,
)
```

Components that benefit immediately:

- `VacancyLayer` stops re-rendering when `crimeData` loads.
- `ChartBuilder.extract` stops re-running on unrelated dataset loads.
  Kills finding #7 outright.
- `TimeRangeSlider` stops re-deriving years on unrelated loads.
- `useNeighborhoodMetrics` and `NeighborhoodDetail` stop invalidating on
  unrelated loads. **This is the key unlock for finding #1**: today the
  metrics memo is wrong because it depends on the whole `data` object. With
  per-slice selectors, `useMemo([id, vacancyData, stops, groceryStores])`
  becomes correct without needing a separate cache layer.
- `LayerPanel` toggling a layer no longer re-renders the map, the analytics
  panel, or the detail panel - only consumers of `s.layers.<key>` flip.

### What zustand does NOT fix

- Eager loading of 17 MB of data (#4). Still need to lazy-load.
- `queryRenderedFeatures` on mousemove (#2). Unrelated.
- Mapbox paint expression rebuilds (#6). Still need `useMemo` /
  `feature-state`.
- Heatmap point indexing (#5). Still need to precompute.
- Bundle size. Zustand is ~1 KB gzip; immaterial.

### Store sketch

Two stores, not three. `failedDatasets` folds into the data store.

```ts
// src/stores/explorer-store.ts -- UI state
import { create } from 'zustand'
import type { ExplorerState, LayerToggles, SelectedEntity, SubToggles } from '@/lib/explorer-types'
import { initialExplorerState } from '@/lib/explorer-types'

interface ExplorerStore extends ExplorerState {
  toggleLayer: (layer: keyof LayerToggles) => void
  setSubToggle: <K extends keyof SubToggles>(key: K, value: SubToggles[K]) => void
  selectEntity: (entity: SelectedEntity) => void
  clearSelection: () => void
  // ... one method per current ExplorerAction variant
}

export const useExplorerStore = create<ExplorerStore>()((set) => ({
  ...initialExplorerState,
  toggleLayer: (layer) =>
    set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  setSubToggle: (key, value) =>
    set((s) => ({ subToggles: { ...s.subToggles, [key]: value } })),
  selectEntity: (entity) => set({ selected: entity, detailPanelOpen: true }),
  clearSelection: () => set({ selected: null, detailPanelOpen: false }),
  // ...
}))
```

```ts
// src/stores/data-store.ts -- datasets + loading
import { create } from 'zustand'
import type { ExplorerData, LayerToggles } from '@/lib/explorer-types'

interface DataStore extends ExplorerData {
  failedDatasets: Set<string>
  loadLayer: (layer: keyof LayerToggles) => void
}

const fetched = new Set<string>() // module-private, no need to track in store

export const useDataStore = create<DataStore>()((set, get) => ({
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
  failedDatasets: new Set(),

  loadLayer: (layer) => {
    if (fetched.has(layer)) return
    fetched.add(layer)
    // ... port the existing switch/case from ExplorerProvider here
  },
}))
```

Two ergonomic notes:

1. `useShallow` from `zustand/shallow` is the escape hatch for selectors
   that return objects or arrays - prevents false re-renders when the
   reference changes but the contents don't.
2. For multi-field reads in the same component, prefer multiple narrow
   `useExplorerStore((s) => ...)` calls over one broad selector. Each
   subscription is cheap and they invalidate independently.

### Migration shape

`ExplorerAction` becomes store methods. Two flavors to choose from:

1. **Port verbatim**: keep `dispatch` semantics by exposing a single
   `dispatch` method on the store that runs the existing reducer body.
   Smallest call-site diff (`dispatch({ type: 'TOGGLE_LAYER', layer })`
   keeps working).
2. **Convert to methods**: `useExplorerStore.getState().toggleLayer('crime')`.
   Cleaner, but every dispatch site needs touching.

Pick option 2 in the same PR that introduces zustand. The mechanical
edit cost is low (find/replace per action type) and the call sites
become much more readable. Skip option 1 unless the migration starts
ballooning.

The two AI executors (`action-executor.ts`, `data-executor.ts`)
currently take `{ state, dispatch, data }` as parameters. Keep that
shape - have the call site pull from the store and pass it in. Don't
let executors reach into the store directly; that makes them harder to
test and couples business logic to the store module.

### TanStack Start / SSR notes

This app uses TanStack Start with SSR enabled (verified:
`tanstackStart()` in `vite.config.ts`, `RootDocument` shell component in
`__root.tsx`, Cloudflare Workers SSR target). TanStack Start is **not**
RSC: every component is a normal React component that runs on both
server and client. There is no `'use client'` boundary.

For the explorer specifically:

- `_app/explore.tsx` has no loader, no `ssr: false`, no server function.
- `useEffect` does not run on the server, so the data-loading effect in
  `ExplorerProvider` never fires server-side.
- Mapbox is client-only (touches `window`).
- Net result: SSR for `/explore` produces a near-empty shell with
  `initialExplorerState` and all-null data, then hydration takes over.

A module-level zustand store is **safe in this app** because nothing
mutates the store synchronously during server render. The classic SSR
singleton risk (request A's state leaks into request B) requires
synchronous in-render mutation, which we don't do anywhere. The store
contains app state, not user/session state. Cloudflare Workers also
isolates per request.

Two invariants to maintain going forward:

1. **No synchronous store writes during render.** All writes happen in
   effects, event handlers, or executors triggered by events. Add a
   short comment in each store file documenting this.
2. **Server snapshot must equal client first-render snapshot.** Both
   start from the same `initialExplorerState`, so this is automatic.
   Zustand uses `useSyncExternalStore` and will give us a hydration
   mismatch warning if this ever drifts.

If we later add user/session state to the store (auth, preferences
keyed to a user, etc.), switch to the factory-per-request pattern:
`createExplorerStore()` called inside a router context provider so each
SSR request gets its own instance. Not needed today.

### Cost

- 2 new files (~150 lines each)
- Delete `ExplorerProvider`'s contexts; keep the data-loading effect
  but point it at `useDataStore.getState().loadLayer`
- Update 33 consumer files - mostly mechanical
- Update 2 AI executors - thin wiring change
- 1 PR, reviewable

The riskiest single change is the AI executor wiring. Worth a manual
smoke test of the command bar afterwards.

### Recommended order

1. Add zustand. Create both stores. Convert action types to methods.
2. Update `ExplorerProvider` to be a thin shell that just kicks off the
   initial data loads via `useDataStore.getState().loadLayer(...)`.
   Eventually delete it entirely once consumers are migrated.
3. Migrate consumers in this order: layers (smallest, hottest path),
   then detail panels, then analytics panels, then `LayerPanel` /
   `CommandBar` / `AnalyticsPanel`.
4. Once consumers are migrated, fix `useNeighborhoodMetrics` to depend
   on stable slices instead of the whole `data` object. Finding #1 is
   resolved without needing the explicit cache.
5. Smoke test: open the command bar, run an AI query that uses both
   data and UI tools, verify both still work.

## Things deliberately not on this list

These came up in the first pass and turned out to be non-issues after
verification:

- **TimeRangeSlider re-deriving years on every render.** The `useMemo` deps
  are stable references after initial load, so it only runs during the
  initial cascade. Once #3 is fixed it stops being noticeable.
- **AnalyticsPanel pre-creating JSX for all 8 tabs.** The unrendered tab
  elements are JS objects that React never mounts. No real cost.
- **"5.9 million vacancy properties."** First pass conflated file size with
  record count. Real number is 9,528.

## Bundle size

Already solved by TanStack Router's auto-splitting (`?tsr-split=component`).
Verified against the build manifest:

- Landing (`_bare/index.tsx`): framework + router + landing chunk only.
  No mapbox, no recharts.
- About: same. No heavy deps.
- Housing / Population: recharts (`CategoryBarChart`) but no mapbox.
- Explore: recharts + mapbox-gl, and `mapbox-gl-*.js` is a `dynamicImport`
  of the explore route, so it does not even load until the explore
  component actually renders.

The 388 KB `main-*.js` is the framework baseline (React, TanStack Router,
base-ui, radix). Shrinking it further would mean swapping libraries, which
is a different conversation than perf.

No code-splitting work needed.

## Status (post-zustand migration)

Done:

- #1 metrics cache: unblocked. `useNeighborhoodMetrics` now memoizes on
  stable per-slice deps and no longer invalidates on unrelated dataset
  loads.
- #2 cursor mousemove: switched to per-layer `mouseenter`/`mouseleave`.
- #3 monolithic context cascade: replaced with zustand selectors.
- #6 `NeighborhoodBaseLayer` inline expressions: memoized.
- #7 `ChartBuilder.extract` re-runs: collapsed via `useShallow`.
- #9 `AnalyticsPanel` drag listener leak: moved to a `useEffect` with
  guaranteed cleanup.

Still open, in priority order:

1. **#4 Eager 17 MB data load on mount.** Biggest perf item left.
   The eager `loadLayer()` calls in `ExplorerProvider` still run on every
   visit to `/explore`. Two options:
   - Move them into the `_app/explore.tsx` route loader so they only run
     when explore is active.
   - Make `data-executor` lazy: each tool calls `loadLayer()` and awaits
     before reading. The explore page only fetches the datasets the user
     enables; the AI fetches what it needs on demand.
2. **Delete `public/data/csb_2025.json`** if confirmed unused. Trivial,
   3.7 MB off the deploy.
3. **#5 Heatmap point indexing.** Pre-bucket by year/category at load
   time so the time slider becomes O(1) lookup instead of a full filter.
4. **#8 VacancyLayer GeoJSON rebuild.** Build the feature collection once
   and use Mapbox `filter` expressions for show/hide, or enable
   `cluster: true` on the source.
