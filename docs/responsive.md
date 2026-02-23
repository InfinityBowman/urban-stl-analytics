# Mobile Responsiveness Audit

**Date:** 2026-02-23
**Scope:** Full codebase audit across layouts, explorer components, detail/analytics panels, charts, and landing/about pages.
**Target devices:** iPhone SE (375px), iPhone 14 (390px), small Android (360px), iPad (768px), iPad Pro (1024px)

---

## Executive Summary

The application is primarily designed for desktop use. While some responsive breakpoints exist (mostly `max-lg` at 1024px and `max-sm` at 640px), there are significant gaps that make the experience poor on phones and awkward on tablets. The most critical issues are:

1. **Explorer grid layout** locks a 280px sidebar + 380px detail panel that consume the entire viewport on phones
2. **Touch targets are universally too small** — map controls (30px), slider thumbs (14px), close buttons (24px), tab pills, and badges all fall below the 44x44px minimum
3. **Text sizes below 10px** (`text-[0.55rem]` through `text-[0.65rem]`) are used extensively and are unreadable on mobile
4. **Analytics KPI grids** use `grid-cols-4` without mobile breakpoints, cramming four cards into ~80px each on phones
5. **Charts have fixed pixel heights** (300-350px) with no responsive scaling and hardcoded font sizes

---

## Critical Issues

### 1. MapExplorer Grid Layout — `src/components/explorer/MapExplorer.tsx`

**Lines 15-25:** The CSS grid uses `grid-cols-[280px_1fr]` with only a `max-lg` (1024px) breakpoint to collapse.

- On an iPad (768px), the 280px sidebar takes 36% of viewport, leaving cramped map space
- Between 640px-1024px, the desktop two-column layout is still active
- The `max-lg` mobile fallback uses `grid-rows-[auto_50vh_auto_auto]` — 50vh is excessive on short phone viewports

**Recommendation:**
```tsx
// Change breakpoint from max-lg to max-md (768px)
'max-md:grid-cols-1 max-md:grid-rows-[auto_50vh_auto_auto]'
// Add phone-specific row sizing
'max-sm:grid-rows-[auto_40vh_auto_auto]'
```

### 2. Detail Panel Fixed Width — `src/components/explorer/MapExplorer.tsx`

**Line 40:** Detail panel is `w-[380px]` absolute positioned on desktop. This is wider than an iPhone SE viewport (375px).

- The `max-lg:w-full` fallback only kicks in at 1024px
- On tablets (768-1023px), the 380px panel overlaps 49% of the map

**Recommendation:**
```tsx
'w-[min(380px,100%)] max-md:relative max-md:w-full'
```

### 3. Touch Targets Below 44x44px Minimum

| Element | Size | File | Line |
|---------|------|------|------|
| Mapbox zoom/compass buttons | 30x30px | `src/styles.css` | 312 |
| Layer range slider thumb | 14x14px | `src/styles.css` | 258-281 |
| Detail panel close button | 24x24px (`h-6 w-6`) | `DetailPanel.tsx` | 134-142 |
| Map style toggle buttons | ~28px tall (`px-2 py-1`) | `ExplorerMap.tsx` | 50-55 |
| Tab pills | ~20px tall (`py-1`) | `AnalyticsPanel.tsx` | 229-236 |
| CommandBar send button | ~22px (`p-1`) | `CommandBar.tsx` | 283-286 |
| Layer card buttons | ~32px tall (`py-2.5`) | `LayerPanel.tsx` | 166 |
| Tooltip trigger | 14x14px (`h-3.5 w-3.5`) | `ExplorerMap.tsx` | 299-301 |

**Recommendation:** Add a mobile media query in `styles.css` to bump interactive elements to 44px minimum:
```css
@media (max-width: 640px) {
  .mapboxgl-ctrl-group button { width: 44px !important; height: 44px !important; }
}
```
For component-level fixes, increase padding on touch targets: `py-1` -> `max-sm:py-2.5`, etc.

### 4. Analytics KPI Grid — All Analytics Components

**Affected files:** `ComplaintsAnalytics.tsx`, `CrimeAnalytics.tsx`, `TransitAnalytics.tsx`, `VacancyAnalytics.tsx`, `ArpaAnalytics.tsx`, `DemographicsAnalytics.tsx`, `NeighborhoodAnalytics.tsx`

All use `grid grid-cols-4 gap-2` for MiniKpi cards without any responsive breakpoint. On a 375px phone, each card gets ~85px wide — too narrow for content and untappable.

**Recommendation:**
```tsx
// Before
'grid grid-cols-4 gap-2'
// After
'grid grid-cols-2 gap-2 sm:grid-cols-4'
```

### 5. CommandBar Positioning — `src/components/explorer/CommandBar.tsx`

**Lines 140-145:** Desktop positioning uses a `calc()` that accounts for the 280px sidebar:
```tsx
'left-[calc(280px+(100vw-280px)/2)] -translate-x-1/2'
```

- On tablets (768-1023px), this formula pushes the bar off-center to the right
- The `max-sm` fallback (`inset-x-2 bottom-2 w-auto`) only kicks in at 640px
- No `max-md` breakpoint for tablets

**Recommendation:** Add a `max-md` breakpoint that centers normally:
```tsx
'max-md:left-1/2 max-md:-translate-x-1/2 max-md:w-[min(420px,calc(100%-1rem))]'
```

---

## High Priority Issues

### 6. Text Sizes Below Readable Threshold

Multiple components use font sizes under 10px that are illegible on mobile:

| Size | Usage | Files |
|------|-------|-------|
| `text-[0.55rem]` (8.8px) | MiniKpi labels, tooltip triggers, ComparePanel "vs" | `MiniKpi.tsx`, `ExplorerMap.tsx`, `NeighborhoodComparePanel.tsx` |
| `text-[0.6rem]` (9.6px) | TimeRangeSlider labels, analytics list items, badges | `TimeRangeSlider.tsx`, `ArpaAnalytics.tsx`, `NeighborhoodAnalytics.tsx` |
| `text-[0.62rem]` (9.9px) | Layer descriptions, select dropdowns, pill toggles | `LayerPanel.tsx`, `LandingPage.tsx` |
| `text-[0.65rem]` (10.4px) | Tab pills, route descriptions, year display | `AnalyticsPanel.tsx`, `StopDetail.tsx`, `TimeRangeSlider.tsx` |

**Recommendation:** Establish a minimum `text-[0.7rem]` (11.2px) floor for all interactive/readable text. Use `max-sm:text-xs` (12px) overrides where needed.

### 7. NeighborhoodComparePanel Fixed Percentages — `src/components/explorer/detail/NeighborhoodComparePanel.tsx`

**Lines 69-77:** CompareRow uses rigid `w-[38%]` / `w-[24%]` / `w-[38%]` splits. On the detail panel (already constrained to 380px desktop, full-width mobile), these fixed percentages cause overlap and text compression on narrow viewports.

**Recommendation:** Stack vertically on mobile:
```tsx
'flex max-sm:flex-col items-center'
// Remove fixed width percentages on mobile
```

### 8. Chart Fixed Heights — All Chart Components

| Component | Default Height | File |
|-----------|---------------|------|
| `TimeSeriesChart` | 350px | `src/components/charts/TimeSeriesChart.tsx` |
| `CategoryBarChart` | 350px | `src/components/charts/CategoryBarChart.tsx` |
| `HourlyChart` | 300px | `src/components/charts/HourlyChart.tsx` |
| `ChartCanvas` | 280px | `chart-builder/ChartCanvas.tsx` |
| Analytics chart containers | 180px | Various analytics files |

Charts also use hardcoded `fontSize={11}` on axes and `minTickGap={40}` which cause label overlap on narrow screens.

**Recommendation:**
- Accept responsive height prop or use container-relative sizing
- Reduce `minTickGap` to 20 on mobile
- Use `fontSize={10}` or smaller on mobile, or hide axis labels entirely below 400px

### 9. Map Legend Fixed Width — `src/components/map/MapLegend.tsx`

**Line 99:** `min-w-[155px] max-w-[190px]` with absolute positioning `right-3 bottom-3`.

- On 320px screen, 190px consumes 59% of viewport
- Overlaps map controls and obscures significant map area
- No safe-area inset support for notched devices

**Recommendation:** Make legend collapsible on mobile, toggled by a button. Reduce width or hide by default below 640px.

### 10. LayerPanel Not Collapsible — `src/components/explorer/LayerPanel.tsx`

The 280px layer panel has no mobile collapse/drawer pattern. When stacked in the mobile grid layout, it shows the full layer list vertically, pushing the map down and requiring significant scrolling.

- Layer card text (`text-[0.62rem]` descriptions) is too small on mobile
- Select dropdowns (`py-1.5`) are below 44px touch targets
- PillToggle buttons (`py-[3px]`) are only ~14px tall

**Recommendation:** Convert to a collapsible sheet/drawer on mobile with larger touch targets. Show only active layers by default.

---

## Medium Priority Issues

### 11. Navigation Touch Targets — `src/components/Nav.tsx`

- Command bar button uses `w-64` (256px) — oversized on phones
- Nav link buttons have `px-2.5 py-1` padding (~20px height), below 44px minimum
- Text hides on `max-sm` but button width doesn't shrink

### 12. AnalyticsPanel Drag Handle — `src/components/explorer/AnalyticsPanel.tsx`

**Line 140-150:** Drag indicator is `h-0.5 w-8` (2px x 32px) expanding to 8px on expand. Only has `onMouseDown` — no `onTouchStart` handler for mobile drag.

**Recommendation:** Add touch event handlers and increase drag handle hit area to at least 44px tall on mobile.

### 13. Landing Page Stat Ribbon — `src/components/landing/LandingPage.tsx`

**Line 213:** `flex items-center gap-8` displays 4 stats inline without responsive stacking. On phones, stats wrap awkwardly.

- `text-7xl` dataset index numbers (line 331) are oversized on mobile
- Padding `px-8 sm:px-12` is excessive on 320px phones

**Recommendation:** Stack stats vertically on mobile with reduced gaps: `max-sm:flex-col max-sm:gap-4`.

### 14. MetricCard Pairs in Detail Views

All detail panels (`VacancyDetail`, `StopDetail`, `GroceryDetail`, `FoodDesertDetail`) use `flex gap-2` for side-by-side MetricCard pairs without mobile breakpoints. On narrow screens, cards compress to ~45% width each.

**Recommendation:** Stack to single column: `flex max-sm:flex-col gap-2`.

### 15. Tooltip Fixed Width — `src/components/explorer/ExplorerMap.tsx`

**Line 306:** `w-56` (224px) tooltip can overflow on 320px screens.

**Recommendation:** `w-[min(224px,90vw)]`

### 16. ChartControls Min-Widths — `chart-builder/ChartControls.tsx`

Select triggers use `min-w-[130px]` and `min-w-[140px]`, consuming 40%+ of viewport on 320px phones.

**Recommendation:** Remove `min-w` on mobile or use `max-sm:min-w-0`.

### 17. MapProvider Default Height — `src/components/map/MapProvider.tsx`

**Line 24:** Default `h-150` (600px) hardcoded height. Should be responsive for mobile viewports.

### 18. About Page CTA Section — `src/components/about/AboutPage.tsx`

**Line 221:** `flex items-center gap-4` doesn't stack on mobile. Should be `max-sm:flex-col`.

---

## Low Priority Issues

### 19. No Safe-Area Inset Support
No `env(safe-area-inset-*)` usage for notched devices (iPhone X+). Map controls, legend, and command bar may be obscured by the notch or home indicator.

### 20. CategoryBarChart YAxis Width
`width={160}` on YAxis label is fixed, consuming excessive space on mobile horizontal charts.

### 21. HourlyChart Tick Interval
`interval={2}` shows 12 ticks on the hour axis — causes label overlap on mobile. Should increase to `interval={3}` or `interval={4}` below 640px.

### 22. Missing Explicit Grid Fallbacks
Several analytics grids rely on CSS default `grid-cols-1` behavior when no breakpoint applies. Adding explicit `grid-cols-1` makes intent clear and prevents surprises.

---

## Summary by Severity

| Severity | Count | Key Areas |
|----------|-------|-----------|
| Critical | 5 | Explorer grid, detail panel width, touch targets, KPI grids, CommandBar position |
| High | 5 | Text sizes, compare panel, chart heights, map legend, layer panel |
| Medium | 8 | Nav targets, drag handle, landing stats, metric cards, tooltips, chart controls, map height, about CTA |
| Low | 4 | Safe-area insets, chart axis widths, tick intervals, grid fallbacks |

## Recommended Fix Order

1. **Explorer layout breakpoints** — Change `max-lg` to `max-md` for grid collapse, add `max-sm` row sizing
2. **Touch targets** — Global CSS fix for Mapbox controls + per-component padding increases
3. **KPI grids** — Change `grid-cols-4` to `grid-cols-2 sm:grid-cols-4` in all analytics
4. **Detail panel** — Use `w-[min(380px,100%)]` and adjust breakpoint
5. **CommandBar** — Add `max-md` positioning breakpoint
6. **Text floor** — Audit all `text-[0.55rem]` through `text-[0.65rem]` and increase to minimum 11px
7. **Charts** — Accept responsive height, reduce tick density on mobile
8. **Legend** — Make collapsible on mobile
9. **Layer panel** — Implement mobile drawer/sheet pattern
10. **Remaining medium/low issues** — Address incrementally
