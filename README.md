# STL Urban Analytics

A unified urban data analytics platform for the City of St. Louis, combining **311 complaints**, **crime data**, **transit equity**, **vacancy triage**, **food access**, **census demographics**, and **ARPA fund expenditures** into an AI-powered Map Explorer with integrated analytics.

Built for the _St. Louis Sustainable Urban Innovation_ hackathon track.

## Pages

### Landing (`/`)

Splash page introducing the platform with navigation to the main dashboards.

### Map Explorer (`/explore`)

A fullscreen, map-centric dashboard with eight toggleable data layers, an AI command bar, and integrated analytics.

#### Layout

- **Layer Panel** (left rail) — Toggle layers on/off with contextual sub-filters (choropleth/heatmap mode, category pills, transit sub-layers, vacancy dropdowns + score slider, food desert/grocery toggles)
- **Map** (center) — Mapbox GL with switchable styles (streets, light, dark, satellite) and click-to-select on any entity
- **Detail Panel** (right rail) — Opens on click with entity-specific detail views, neighborhood comparison
- **Analytics Panel** (bottom drawer) — Collapsible/resizable analytics with KPI chips, per-layer analytics modules, cross-dataset neighborhood view, and a ChartBuilder
- **Command Bar** (`Cmd+K` / `Ctrl+K`) — AI-powered natural language interface for querying data, toggling layers, configuring filters (transit sub-layers, vacancy filters, food access toggles, time range), switching map styles, comparing neighborhoods, opening analytics tabs, and generating charts

#### Data Layers

**311 Complaints** — Choropleth or heatmap of complaint density by neighborhood. Category filtering (top 8 types). Analytics: daily volume chart, hourly/weekday distribution, weather correlation, category breakdown.

**Transit** — Metro stops, route shapes, 0.5-mile walksheds. Analytics: equity gap scoring per LILA census tract (0–100) factoring walkable stops, service frequency, grocery proximity, and transit-to-grocery connectivity.

**Vacancy** — Vacant properties as scored circles (red → green). Filters: best use, owner, type, neighborhood, min score. Detail view: six-factor triage score breakdown, recent 311 complaints, recommended best use (housing / solar / garden).

**Food Access** — LILA food desert tracts and grocery store locations. Detail view: demographics, nearby transit, nearest grocery, equity score.

**Crime** — SLMPD crime incidents as choropleth (by neighborhood count) or heatmap (individual points). Category filtering by offense type. Analytics: daily volume + 7-day MA, top offenses, hourly/weekday distribution, felony and firearm counts.

**Demographics** — Census data choropleth by population, vacancy rate, or population change (2010-2020). Analytics: city-wide KPIs, most populated neighborhoods, population change chart.

**Housing** — Census ACS choropleth by median rent or home value. Analytics: city-wide medians, top/bottom neighborhoods by metric.

**Affected** — Composite distress score choropleth (green = low, red = high). Analytics: ranked neighborhood list with per-factor breakdowns.

**ARPA Funds** — Analytics-only layer (no map visualization). Monthly spending + cumulative line, category breakdown, top vendors and projects lists.

#### Cross-Dataset Features

- **Neighborhood click** — Eagerly loads all datasets. Detail panel shows composite equity score (transit + 311 + food + vacancy) with breakdown bars. Analytics switches to cross-dataset view with top 311 issues chart and best rehab candidates.
- **Neighborhood comparison** — Side-by-side comparison of metrics across neighborhoods.
- **ChartBuilder** — User-configurable charts from underlying datasets with multi-series support, chart type toggles, and dual-axis.

### Population (`/population`)

Census population data across 79 neighborhoods with three tabs:

- **Overview** — KPIs (total pop, vacancy rate, growing/declining counts), top 10 by population bar chart, city-wide race breakdown
- **Change 2010→2020** — Top 10 growing + declining neighborhoods, full sortable table with 2010/2020 pop and % change
- **Demographics** — Race composition chart, housing units/occupancy KPIs, top neighborhoods by vacancy rate

Uses `demographics.json` (existing pipeline dataset).

### Housing Prices (`/housing`)

Census ACS 5-Year housing estimates with a toggle between Median Rent and Median Home Value:

- **KPIs** — City-wide median rent, median home value, neighborhood count
- **Choropleth map** — Color-coded by selected metric (gray = no data)
- **Top/bottom 10** — Bar charts of highest and lowest neighborhoods

Requires `housing.json` from the data pipeline (needs `CENSUS_API_KEY`).

### Affected Neighborhoods (`/affected`)

Composite distress scoring (0–100) across five weighted factors using existing datasets:

- **Ranked list** — All 79 neighborhoods sorted by distress score, expandable rows with per-factor score bars
- **Choropleth map** — Green (low distress) to red (high distress)
- **KPIs** — High distress count, moderate count, average score, food desert count

Cross-dataset analysis using `demographics.json`, `crime.json`, `vacancies.json`, `csb_latest.json`, `grocery_stores.geojson`.

### About (`/about`)

Project information and methodology overview.

## Tech Stack

| Layer         | Technology                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Framework     | [TanStack Start](https://tanstack.com/start) (SSR + server functions)                                           |
| Router        | [TanStack Router](https://tanstack.com/router) (file-based, type-safe)                                          |
| UI            | React 19 + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (radix-nova)                                    |
| Map           | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) via [react-map-gl](https://visgl.github.io/react-map-gl/) |
| Charts        | [Recharts](https://recharts.org/)                                                                               |
| Hosting       | [Cloudflare Workers](https://developers.cloudflare.com/workers/) via `@cloudflare/vite-plugin`                  |
| AI            | [OpenRouter](https://openrouter.ai/) API via server function + tool-use chat                                    |
| Data          | Static JSON/GeoJSON in `public/data/` from civic APIs                                                           |
| Data Pipeline | Python 3.12 + [uv](https://docs.astral.sh/uv/) (pandas, geopandas, shapely)                                     |
| ML            | OLS regression models for housing/neighborhood predictions                                                      |
| Analysis      | Jupyter notebooks with matplotlib + folium                                                                      |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- A [Mapbox](https://account.mapbox.com/) public access token
- [uv](https://docs.astral.sh/uv/) (for the Python data pipeline and notebooks)

### Install

```sh
pnpm install
```

### Configure

Create a `.env` file (see `.env.example`):

```
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token_here
OPENROUTER_API_KEY=sk-or-...   # Optional: enables AI command bar
CENSUS_API_KEY=your_key_here   # Optional: enables housing data pipeline (free at api.census.gov)
```

### Develop

```sh
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Build

```sh
pnpm build
```

Production output goes to `.output/` (Node) or `dist/` (Cloudflare Workers).

### Deploy to Cloudflare Workers

```sh
npx wrangler login   # one-time auth
pnpm deploy
```

### Data Pipeline & Notebooks

The `python/` directory contains a uv-managed Python project for fetching/processing datasets and interactive analysis.

```sh
cd python/
uv sync                                # Install deps into .venv
uv run python scripts/fetch_raw.py     # Download raw datasets → data/raw/
uv run python scripts/clean_data.py    # Process raw → public/data/ (frontend-ready)
uv run jupyter lab                     # Launch Jupyter for exploration notebooks
```

## Project Structure

| Directory | Purpose |
| --- | --- |
| `src/routes/` | File-based routes (TanStack Router): landing, explore, housing, affected, population, about, API |
| `src/components/explorer/` | Map Explorer: layout, state provider, map canvas, layer/detail/analytics panels, AI command bar |
| `src/components/explorer/layers/` | Per-dataset map layers (complaints, crime, transit, vacancy, food access, demographics, housing, affected) |
| `src/components/explorer/detail/` | Entity detail views (neighborhood, vacancy, stop, grocery, food desert) + comparison panel |
| `src/components/explorer/analytics/` | Per-layer analytics modules, chart builder, KPI components |
| `src/components/{population,housing,affected}/` | Standalone page dashboards |
| `src/components/{map,charts,ui}/` | Shared map wrapper, reusable chart components, shadcn/ui primitives |
| `src/lib/` | Business logic: types, analysis, scoring, colors, chart datasets |
| `src/lib/ai/` | AI system: prompt construction, tool definitions, chat hook, action/data executors |
| `public/data/` | Static JSON/GeoJSON datasets served to the frontend |
| `python/` | uv-managed data pipeline (fetch + clean scripts), Jupyter notebooks, ML training |

## Data Sources

| Dataset                 | Source                                                             | Format                         |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------ |
| 311 Service Requests    | [City of St. Louis CSB](https://www.stlouis-mo.gov/data/)          | Pre-processed JSON from CSV    |
| Neighborhood Boundaries | City of St. Louis Open Data                                        | GeoJSON                        |
| Transit (GTFS)          | [Metro Transit](https://www.metrostlouis.org/developer-resources/) | Converted from GTFS to GeoJSON |
| Food Desert Tracts      | USDA Economic Research Service (LILA definitions)                  | Simplified GeoJSON             |
| Grocery Stores          | Manual compilation + geocoding                                     | GeoJSON                        |
| Vacant Properties       | City of STL Vacant Building List                                   | JSON                           |
| Crime Incidents         | [SLMPD](https://www.slmpd.org/crime_stats.shtml) NIBRS data       | Pre-processed JSON from CSV    |
| ARPA Expenditures       | [City of STL Open Data](https://www.stlouis-mo.gov/)              | JSON API                       |
| Census Demographics     | City of STL Planning Dept neighborhood census pages                | Scraped HTML → JSON            |
| Housing (ACS)           | Census ACS 5-Year (B25064 + B25077) for FIPS 29510                | API → spatial join → JSON      |

## Algorithms

### Vacancy Triage Score (0–100)

Six weighted factors:

| Factor                | Weight | Logic                                               |
| --------------------- | ------ | --------------------------------------------------- |
| Condition             | 25%    | Inverse of 1–5 rating (condemned = 100)             |
| 311 Complaint Density | 20%    | Nearby count / 20, capped at 100                    |
| Lot Size              | 10%    | sq ft / 10,000, capped at 100                       |
| Ownership             | 15%    | LRA=100, City=70, Private=scaled by tax delinquency |
| Proximity             | 15%    | Pre-computed distance to occupied properties        |
| Tax Delinquency       | 15%    | Years / 10, capped at 100                           |

Best-use determination scores each property for housing, solar, and garden fitness independently and picks the highest.

### Transit Equity Score (0–100)

Per LILA census tract:

- Up to 30 pts for walkable transit stops (within 0.5 mi)
- Up to 20 pts for service frequency
- Up to 25 pts for grocery store proximity
- 25 pts if a direct bus route connects the tract to a grocery store

### Neighborhood Distress Score (0–100)

Five weighted factors computed from cross-dataset analysis:

| Factor           | Weight | Logic                                                    |
| ---------------- | ------ | -------------------------------------------------------- |
| Crime            | 25%    | Normalized crime incident total per neighborhood         |
| Vacancy          | 25%    | Normalized vacant property count per neighborhood        |
| 311 Complaints   | 20%    | Normalized complaint total per neighborhood              |
| Food Access      | 15%    | Binary: no grocery store within 1.5 mi of centroid = 100 |
| Pop Decline      | 15%    | Magnitude of 2010→2020 population decline, normalized    |

### 311 Hotspot Detection

- **Volume hotspots**: neighborhoods with >2x the city-wide average complaint count
- **Resolution hotspots**: neighborhoods with >1.5x average resolution time and >200 complaints

## License

Hackathon project — not licensed for production use. Data is sourced from public datasets; see individual source documentation for terms.
