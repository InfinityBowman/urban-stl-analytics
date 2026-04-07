# Project Findings

## Data

All data in the explorer comes from real civic APIs via the Python pipeline in `python/`. See `docs/DATA-SOURCES.md` for the full list. The frontend-ready files in `public/data/`:

- `csb_latest.json` - 311 complaints (City of STL CSB)
- `crime.json` - SLMPD NIBRS crime incidents
- `neighborhoods.geojson` - 79 neighborhood boundaries
- `stops.geojson`, `shapes.geojson`, `routes.json`, `stop_stats.json` - GTFS transit
- `food_deserts.geojson`, `grocery_stores.geojson` - USDA Food Access Atlas + manual grocery geocoding
- `demographics.json` - Neighborhood demographics (scraped from City Planning Dept pages)
- `housing.json` - Census ACS median rent and home value by neighborhood
- `vacancies.json` - Vacant Building Registry
- `arpa.json` - ARPA fund expenditures
- `trends.json` - Weather and temporal trend data

## Strengths

- **Architecture** - TanStack Start + reducer-based state, lazy data loading, SSR on Cloudflare Workers
- **AI command bar** - Multi-turn agentic loop (up to 5 turns) with SSE streaming, 7 UI action tools, 6 data retrieval tools, dynamic system prompt with live dashboard state + KPI snapshot
- **Data pipeline** - Python scripts pulling from 6+ real civic APIs into static JSON/GeoJSON
- **Explorer UX** - 7 toggleable map layers, neighborhood detail with raw cross-dataset counts, side-by-side comparison mode, interactive chart builder, resizable analytics drawer
- **Vacancy triage** - Weighted scoring (condition, complaint density, lot size, ownership, proximity, tax delinquency) plus best-use determination
- **Equity scoring** - Weighted composite (0-100) factoring transit stop density, trip frequency, grocery proximity, and route-graph transit-to-grocery connectivity
- **Neighborhood metrics** - Centralized `computeNeighborhoodMetrics()` shared by the detail panel, compare panel, neighborhood analytics, and AI data tools. Returns raw counts and the polygon centroid (handles both Polygon and MultiPolygon).

## Known Bugs

Outstanding correctness issues discovered in the 2026-04 audit that have not been fixed yet.

### A1 - Population-change choropleth broken for negative values
**File:** `src/components/explorer/layers/DemographicsLayer.tsx:38-44` + `src/lib/colors.ts:21-33`

`dynamicBreaks` does `Math.max(...values, 1)` and assumes non-negative inputs. When the `popChange` metric is selected, many STL neighborhoods are negative (population decline). Negative values all fall into the first color bucket, and if the visible set is mostly negative the map collapses to a single color.

**Fix:** Use a divergent color scale (red->white->green) for signed metrics, or compute breaks symmetrically around zero using `Math.max(Math.abs(min), Math.abs(max))`.

### A2 - TimeRangeSlider resets the user's year selection
**File:** `src/components/explorer/TimeRangeSlider.tsx:42-56`

The `useEffect` that initializes the slider to the latest year has `[years, dispatch, showComplaints, showCrime]` as dependencies. `years` is memoized from crime + complaint heatmap points, so it recomputes (new reference) whenever crime data arrives or layers toggle. That re-fires the effect and overwrites whatever year the user picked.

**Fix:** Guard initialization with a ref so it runs once when `years` first becomes non-empty, or only reset when the current selection is no longer in the set.

### A7 - NeighborhoodBaseLayer unmemoized Mapbox expressions + `parseInt('')` path
**File:** `src/components/explorer/layers/NeighborhoodBaseLayer.tsx:12-39`

`selectedNum`, `compareANum`, `compareBNum`, and the three `match*` expression literals are computed inline on every render, producing new array literals each time and triggering unnecessary Mapbox layer repaints. Separately, `parseInt('', 10)` returns `NaN`, and `NaN ?? -1` is `NaN`, so if the AI ever dispatched an empty compare ID the Mapbox `==` comparator would receive `NaN`.

**Fix:** Wrap match expressions in `useMemo`. Add a `Number.isFinite` guard before the `?? -1` fallback.

### A8 - `slice(-0)` returns full array in bottom-rent list
**File:** `src/components/explorer/analytics/HousingAnalytics.tsx:30-34`

```ts
const top = Math.min(10, Math.floor(sorted.length / 2))
return {
  highRent: sorted.slice(0, top),
  lowRent: sorted.slice(-top).reverse(),
}
```

When `sorted.length === 1`, `top === 0`, and `sorted.slice(-0)` returns the full array (not empty). Unlikely with the real dataset but wrong.

The equivalent pattern in `src/lib/ai/data-executor.ts:buildHousingData` was already fixed during the audit cleanup.

**Fix:** `if (top === 0) return { highRent: [], lowRent: [] }`.

### A9 - Vacancy triage `scores.condition` can exceed 0-100
**File:** `src/lib/scoring.ts:17`

```ts
scores.condition = Math.round(((5 - property.conditionRating) / 4) * 100)
```

The final composite is clamped on line 51, but `scores.condition` is not. If `conditionRating` is 0 (missing/null fallback) the value is 125; if 6 it's -25. `VacancyDetail` renders these as `ScoreBar` widths, which would overflow.

**Fix:** Clamp at write time, or fix at the data pipeline level if `conditionRating` is being produced out of range.

### A10 - Multi-turn chat overwrites earlier assistant text
**File:** `src/lib/ai/use-chat.ts:194-260`

When the model writes text in turn 1, calls a data tool, then writes text in turn 2, the streaming `updateAssistantMessage` replaces the assistant message content with each turn's local text. Pre-tool-call filler ("Let me look that up...") gets wiped when the post-tool turn begins streaming.

**Fix:** Snapshot accumulated text into a ref before resetting between turns; concatenate when rendering. (May be intentional to hide filler. Needs a call on desired behavior.)

## Weak Spots

- **Standalone dashboards** (housing, population) started as placeholder stubs and still need expanded content
- **No loading skeletons** - just "Loading data..." text
- **No dark mode toggle** - CSS variables for the `.dark` theme are fully defined but no UI toggle exists
- **No URL state sync** - all state lives in `useReducer`, lost on refresh, can't share specific views
- **AI cancel button missing from UI** - `cancel()` exists in `useChat` with `AbortController` but `CommandBar.tsx` doesn't wire it up
- **Mobile gaps** - some touch targets below 44px, sub-10px text, map legend not collapsible (see `docs/responsive.md`)

## Cleanup History

### 2026-04: Removed composite/derived scores

Cleanup removed reintroduced composite scoring surfaces. The inputs (crime, vacancy, complaints, demographics, grocery) are real, but the composite numbers were hand-tuned weighted formulas presenting more rigor than they had.

- Deleted `src/lib/affected-scoring.ts`, the `/affected` route, `src/components/affected/`, `AffectedLayer`, `AffectedAnalytics`, the `affected` layer toggle, the `get_affected_scores` AI tool, the `distress` ranking metric, and the `affected-scores` chart dataset.
- Refactored `src/lib/neighborhood-metrics.ts` to strip `compositeScore`, `transitScore`, `complaintScore`, `foodScore`, `vacancyScore`. Kept raw counts and added a MultiPolygon centroid guard (previously broken for St. Louis Hills).
- Refactored `NeighborhoodDetail`, `NeighborhoodComparePanel`, and `NeighborhoodAnalytics` to show raw counts from the shared metrics module. All three now route centroid computation through the metrics function, so the MultiPolygon fix applies uniformly.

Vacancy triage (`src/lib/scoring.ts`) and equity gap scoring (`src/lib/equity.ts`) stayed, since they have clearer use cases.

### Earlier: Removed fabricated data

The project originally shipped with hardcoded fake data that was later purged:

| File | Used in | Why removed |
|---|---|---|
| `src/lib/price-data.ts` | `/housing` | Hardcoded housing prices (not from Zillow/Redfin) |
| `src/lib/population-history.ts` | `/population` | Static population arrays going back to 1810 |
| `src/lib/migration-data.ts` | `/population`, `/affected` | Fabricated migration data |
| `src/lib/community-voices.ts` | Explorer Community Voice layer | ~40 fabricated resident quotes with fake authors |
| `src/components/explorer/insights/AIInsightNarrative.tsx` | Neighborhood detail | "AI Insights" used seeded RNG, not actual AI |
| `src/lib/vacancy-data.ts` | Explorer fallback | Mock vacancy generator |

Also removed: `HousingPriceLayer`, `CommunityVoiceLayer`, `CommunityVoiceDetail`, `HousingPricesDashboard`, `HousingPriceHistoryChart`.
