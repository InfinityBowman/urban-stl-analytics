# Project Findings & Assessment

## Data Authenticity

All data in the explorer is now sourced from real civic APIs via the Python pipeline:

- `public/data/csb_latest.json` / `csb_2025.json` — 311 complaints (City of STL CSB)
- `public/data/neighborhoods.geojson` — 79 neighborhood boundaries
- `public/data/crime.json` — SLMPD crime incidents
- `public/data/stops.geojson` / `shapes.geojson` / `routes.json` / `stop_stats.json` — GTFS transit
- `public/data/food_deserts.geojson` / `grocery_stores.geojson` — USDA Food Access Atlas
- `public/data/demographics.json` — Census demographics per neighborhood
- `public/data/vacancies.json` — Vacant building data
- `public/data/arpa.json` — ARPA fund expenditures
- `public/data/trends.json` — Weather and temporal trend data

### Removed (was fabricated)

The following fake/hardcoded data was removed from the project:

| Removed File | Was Used In | Why Removed |
|------|---------|-------------|
| `src/lib/price-data.ts` | `/housing` tab | Hardcoded housing prices (not from Zillow/Redfin) |
| `src/lib/population-history.ts` | `/population` tab | Static population arrays going back to 1810 |
| `src/lib/migration-data.ts` | `/population` + `/affected` tabs | Fabricated migration/affected neighborhood data |
| `src/lib/community-voices.ts` | Explorer Community Voice layer | ~40 fabricated resident quotes with fake authors |
| `src/components/explorer/insights/AIInsightNarrative.tsx` | Explorer neighborhood detail panel | "AI Insights" used seeded RNG, not actual AI |
| `src/lib/vacancy-data.ts` | Explorer (fallback only) | Mock vacancy generator fallback |

Also removed: `HousingPriceLayer`, `CommunityVoiceLayer`, `AffectedNeighborhoodsLayer`, `CommunityVoiceDetail`, `HousingPricesDashboard`, `HousingPriceHistoryChart`, `AffectedNeighborhoodsDashboard`, and the entire `src/components/population/` directory.

The `/housing`, `/affected`, and `/population` routes are now placeholder pages pending real data integration.

### Still Needed

Real data sources for the placeholder pages:
- **Housing**: Zillow ZHVI, Redfin, Census ACS rent data, or city property sales records
- **Population**: Census Decennial/ACS 5-Year data, IRS migration data
- **Affected Areas**: Derived from cross-dataset analysis once housing + population data exists

See `docs/DATA-SOURCES.md` for the full list of available data sources.

## Strengths

- **Architecture**: Clean TanStack Start + reducer-based state, lazy loading, SSR on Cloudflare Workers
- **Visual design**: Polished OKLCH color system, Geist font, motion animations — production quality
- **AI command bar**: Genuinely functional multi-turn tool calling with streaming and real UI manipulation
- **Data pipeline**: Python scripts pulling from 6+ real civic APIs (311, SLMPD, GTFS, USDA, Census, ARPA)
- **Explorer UX**: Layer toggles, neighborhood detail, comparison mode, chart builder, analytics drawer
- **Equity scoring**: Real weighted composite (transit + complaints + food access + vacancy)
- **Vacancy triage**: Weighted scoring (condition, complaint density, ownership, tax delinquency, proximity, lot size)

## Remaining Weak Spots

- Standalone dashboards (housing, population, affected) are placeholder stubs — need real data
- Mobile is an afterthought — responsive grid exists but explorer is desktop-only in practice
- No loading skeletons — just "Loading data..." text
- No dark mode toggle exposed (CSS is defined but no UI toggle)
- No URL state sync for sharing specific views
- No abort/cancel button in AI chat UI

## Monetization Paths

1. **SaaS for city governments / CDFIs / nonprofits** — unified civic analytics platform. Biggest opportunity, most work.
2. **Consulting/reporting tool** — neighborhood equity reports for development orgs, packaged as PDFs or embeddable widgets.
3. **White-label for other cities** — abstract data sources, sell to civic tech consultancies.
4. **Grant funding** — Knight Foundation, Bloomberg Philanthropies, Code for America. AI angle makes it timely.

## Suggested Next Steps

### If continuing as a product
1. Integrate real data for housing, population, and affected pages (see `docs/DATA-SOURCES.md`)
2. Add user auth + saved views (bookmarked neighborhoods, saved chart configs, shareable URLs)
3. Enhance AI — add more data tools, richer system prompt context, or multi-turn reasoning
4. Multi-city abstraction — extract STL-specific data sources into a config layer

### Quick wins
- Add crime data to neighborhood detail panel (data loaded, just not displayed)
- Surface a dark mode toggle (CSS already defined)
- Add URL state sync (`?layers=crime,transit&neighborhood=15`)
- Add cancel button to AI chat
- Add loading skeleton states
