# STL Urban Analytics

A unified civic data platform for the City of St. Louis. Combines 311 complaints, SLMPD crime, Metro transit, vacant property, food access, Census demographics, ACS housing, and ARPA spending into one map-centric explorer with an AI command bar.

Originally built for the _St. Louis Sustainable Urban Innovation_ hackathon.

## Pages

**`/` Landing** - Splash page.

**`/explore` Map Explorer** - Fullscreen Mapbox dashboard with seven toggleable data layers, a layer panel, an entity detail panel, a resizable analytics drawer, and an AI command bar (`Cmd/Ctrl+K`).

**`/population` Population** - Three-tab census dashboard: overview KPIs, 2010->2020 change table, race/housing breakdowns.

**`/housing` Housing** - Census ACS choropleth toggling median rent vs. median home value, with city-wide KPIs and top/bottom 10 bar charts.

**`/about` About** - Project overview and methodology.

## Explorer data layers

| Layer | Visualization | Key features |
|---|---|---|
| 311 Complaints | Choropleth or heatmap | Category filter, daily/hourly/weekday charts, weather correlation |
| Crime | Choropleth or heatmap | UCR category filter, daily + 7-day MA, felony/firearm counts |
| Transit | Stops, routes, walksheds | Per-tract equity gap scoring |
| Vacancy | Scored circles (red->green) | Use/owner/type filters, score slider, six-factor triage breakdown |
| Food Access | LILA tracts + grocery markers | Tract demographics, nearest grocery |
| Demographics | Choropleth | Population / vacancy rate / popChange (2010->2020) |
| Housing | Choropleth | Median rent or home value |
| ARPA Funds | Analytics only | Monthly spending, category breakdown, top vendors |

Clicking a neighborhood opens a detail panel with raw cross-dataset counts (311 total, nearby transit stops/routes/trips, vacant property count + top rehab candidates, nearest grocery distance). Compare mode shows side-by-side stats for two neighborhoods. The chart builder supports multi-series, chart-type toggles, and dual-axis.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (SSR + server functions) |
| Router | [TanStack Router](https://tanstack.com/router) (file-based, type-safe) |
| UI | React 19 + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (radix-nova) |
| Map | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) via [react-map-gl](https://visgl.github.io/react-map-gl/) |
| Charts | [Recharts](https://recharts.org/) |
| Hosting | [Cloudflare Workers](https://developers.cloudflare.com/workers/) via `@cloudflare/vite-plugin` |
| AI | [OpenRouter](https://openrouter.ai/) API via server function + tool-use chat |
| Data Pipeline | Python 3.12 + [uv](https://docs.astral.sh/uv/) (pandas, geopandas, shapely, beautifulsoup4) |

## Getting started

**Prerequisites:** Node.js 20+, pnpm, a [Mapbox](https://account.mapbox.com/) public access token, and [uv](https://docs.astral.sh/uv/) (for the data pipeline).

```sh
pnpm install
```

Create a `.env` file (see `.env.example`):

Then:

```sh
pnpm dev      # Dev server at http://urbanstl.localhost:1355 (via portless)
pnpm build    # Production build (.output/ for Node, dist/ for Cloudflare Workers)
pnpm test     # Vitest run
pnpm lint     # ESLint
pnpm deploy   # Build + deploy to Cloudflare Workers
```

### Data pipeline

The `python/` directory is a uv-managed project for fetching and cleaning datasets.

```sh
cd python/
uv sync                                # Install deps into .venv
uv run python scripts/fetch_raw.py     # Download raw datasets -> data/raw/
uv run python scripts/clean_data.py    # Process raw -> public/data/
uv run jupyter lab                     # Launch notebooks
```

From the repo root, `pnpm data:pipeline` runs sync + fetch + clean in one shot.

## Data sources

| Dataset | Source | Format |
|---|---|---|
| 311 Service Requests | [City of STL CSB](https://www.stlouis-mo.gov/data/) | Pre-processed JSON |
| Neighborhood Boundaries | City of STL Open Data | GeoJSON |
| Transit (GTFS) | [Metro Transit](https://www.metrostlouis.org/developer-resources/) | Converted from GTFS |
| Food Desert Tracts | USDA ERS Food Access Atlas (LILA) | Simplified GeoJSON |
| Grocery Stores | Manual compilation + geocoding | GeoJSON |
| Vacant Properties | City of STL Vacant Building Registry | JSON |
| Crime Incidents | [SLMPD NIBRS](https://www.slmpd.org/crime_stats.shtml) | Pre-processed JSON |
| ARPA Expenditures | [City of STL Open Data](https://www.stlouis-mo.gov/) | JSON API |
| Census Demographics | City of STL Planning Dept neighborhood pages | Scraped HTML -> JSON |
| Housing (ACS) | Census ACS 5-Year B25064 + B25077, FIPS 29510 | API -> spatial join -> JSON |

See `docs/DATA-SOURCES.md` for the full list of available data sources (including ones not yet wired up).

## Algorithms

### Vacancy Triage Score (0-100)

Six weighted factors in `src/lib/scoring.ts`:

| Factor | Weight | Logic |
|---|---|---|
| Condition | 25% | Inverse of 1-5 rating (condemned = 100) |
| 311 Complaint Density | 20% | Nearby count / 20, capped at 100 |
| Lot Size | 10% | sq ft / 10,000, capped at 100 |
| Ownership | 15% | LRA = 100, City = 70, Private = scaled by tax delinquency |
| Proximity | 15% | Pre-computed distance to occupied properties |
| Tax Delinquency | 15% | Years / 10, capped at 100 |

Best-use determination scores each property for housing, solar, and garden fitness independently and picks the highest.

### Transit Equity Score (0-100)

Per LILA census tract (`src/lib/equity.ts`):

- Up to 30 pts for walkable transit stops within 0.5 mi
- Up to 20 pts for service frequency
- Up to 25 pts for grocery store proximity
- 25 pts if a direct bus route connects the tract to a grocery store

### 311 Hotspot Detection

Computed in `src/lib/analysis.ts`:

- **Volume hotspots** - neighborhoods with more than 2x the city-wide average complaint count
- **Resolution hotspots** - neighborhoods with more than 1.5x average resolution time and > 200 complaints

## Documentation

- `docs/FINDINGS.md` - Project assessment, known bugs, weak spots, cleanup history
- `docs/DATA-SOURCES.md` - All civic data sources (wired and unwired)
- `docs/FEATURES.md` - Feature inventory
- `docs/AI_FEATURE_DEEP_DIVE.md` - AI command bar architecture
- `docs/responsive.md` - Mobile gaps and touch target notes

## License

Hackathon project; not licensed for production use. Data is sourced from public datasets; see individual source documentation for terms.
