import { useCallback, useMemo } from 'react'
import { NeighborhoodBaseLayer } from './layers/NeighborhoodBaseLayer'
import { ComplaintsLayer } from './layers/ComplaintsLayer'
import { TransitLayer } from './layers/TransitLayer'
import { VacancyLayer } from './layers/VacancyLayer'
import { FoodAccessLayer } from './layers/FoodAccessLayer'
import { CrimeLayer } from './layers/CrimeLayer'
import { DemographicsLayer } from './layers/DemographicsLayer'
import { HousingLayer } from './layers/HousingLayer'
import { TimeRangeSlider } from './TimeRangeSlider'
import type { MapStyle } from '@/lib/explorer-types'
import { useDataStore } from '@/stores/data-store'
import { useExplorerStore } from '@/stores/explorer-store'
import { MapProvider } from '@/components/map/MapProvider'
import {
  GradientSection,
  MapLegend,
  SwatchSection,
  SymbolSection,
} from '@/components/map/MapLegend'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CHORO_COLORS,
  CRIME_COLORS,
  DEMO_COLORS,
  percentileBreaks,
  vacancyLegendItems,
} from '@/lib/colors'

const MAP_STYLES: Record<MapStyle, string> = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  streets: 'mapbox://styles/mapbox/streets-v12',
}

const STYLE_LABELS: Record<MapStyle, string> = {
  light: 'Light',
  dark: 'Dark',
  satellite: 'Satellite',
  streets: 'Streets',
}

function MapStyleToggle() {
  const mapStyle = useExplorerStore((s) => s.mapStyle)
  const setMapStyle = useExplorerStore((s) => s.setMapStyle)

  return (
    <div className="absolute top-2.5 left-2.5 z-10 flex gap-0.5 rounded-md border border-border/60 bg-background/90 p-0.5 shadow-sm backdrop-blur-sm">
      {(Object.keys(MAP_STYLES) as Array<MapStyle>).map((style) => (
        <button
          key={style}
          onClick={() => setMapStyle(style)}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            mapStyle === style
              ? 'bg-brand text-white'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {STYLE_LABELS[style]}
        </button>
      ))}
    </div>
  )
}

export function ExplorerMap() {
  const mapStyle = useExplorerStore((s) => s.mapStyle)
  const layers = useExplorerStore((s) => s.layers)
  const subToggles = useExplorerStore((s) => s.subToggles)
  const vacancyData = useDataStore((s) => s.vacancyData)
  const neighborhoods = useDataStore((s) => s.neighborhoods)

  const handleMapLoad = useCallback((map: mapboxgl.Map) => {
    // Unified click handler. Reads live state via getState() so the closure
    // doesn't need to be recreated on every state change.
    map.on('click', (e) => {
      const explorer = useExplorerStore.getState()
      const point = e.point

      // In compare mode, only handle neighborhood clicks for comparison
      if (explorer.compareMode) {
        const hoodFeatures = map
          .queryRenderedFeatures(point, {
            layers: ['neighborhood-base-fill'],
          })
          .filter(Boolean)
        if (hoodFeatures.length > 0) {
          const nhdNum = hoodFeatures[0].properties?.NHD_NUM
          if (nhdNum != null) {
            const hoodId = String(nhdNum).padStart(2, '0')
            // If A is empty, set A; else if B is empty, set B; else replace A
            if (!explorer.compareNeighborhoodA) {
              explorer.setCompareNeighborhood('A', hoodId)
            } else if (!explorer.compareNeighborhoodB) {
              explorer.setCompareNeighborhood('B', hoodId)
            } else {
              // Both filled - replace A
              explorer.setCompareNeighborhood('A', hoodId)
            }
            return
          }
        }
        return
      }

      // 1. Check vacancy markers first (most specific points)
      const vacancyFeatures = map.getLayer('vacancy-circles')
        ? map.queryRenderedFeatures(point, { layers: ['vacancy-circles'] })
        : []
      if (vacancyFeatures.length > 0) {
        const id = vacancyFeatures[0].properties?.id
        if (id != null) {
          explorer.selectEntity({ type: 'vacancy', id: Number(id) })
          return
        }
      }

      // 2. Transit stops
      const stopFeatures = map.getLayer('stops-circles')
        ? map.queryRenderedFeatures(point, { layers: ['stops-circles'] })
        : []
      if (stopFeatures.length > 0) {
        const id = stopFeatures[0].properties?.stop_id
        if (id) {
          explorer.selectEntity({ type: 'stop', id: String(id) })
          return
        }
      }

      // 3. Grocery stores
      const groceryFeatures = map.getLayer('grocery-circles')
        ? map.queryRenderedFeatures(point, { layers: ['grocery-circles'] })
        : []
      if (groceryFeatures.length > 0) {
        const idx = groceryFeatures[0].properties?.idx
        if (idx != null) {
          explorer.selectEntity({ type: 'grocery', id: Number(idx) })
          return
        }
      }

      // 4. Food desert tracts
      const desertFeatures = map.getLayer('desert-fill')
        ? map.queryRenderedFeatures(point, { layers: ['desert-fill'] })
        : []
      if (desertFeatures.length > 0) {
        const tractId = desertFeatures[0].properties?.tract_id
        if (tractId) {
          explorer.selectEntity({ type: 'foodDesert', id: String(tractId) })
          return
        }
      }

      // 5. Neighborhood polygons (also catches crime/demographics choropleth clicks)
      const hoodFeatures = map.getLayer('neighborhood-base-fill')
        ? map.queryRenderedFeatures(point, { layers: ['neighborhood-base-fill'] })
        : []
      if (hoodFeatures.length > 0) {
        const nhdNum = hoodFeatures[0].properties?.NHD_NUM
        if (nhdNum != null) {
          explorer.selectEntity({
            type: 'neighborhood',
            id: String(nhdNum).padStart(2, '0'),
          })
          return
        }
      }

      // Empty space — clear
      explorer.clearSelection()
    })

    // Pointer cursor on hover - use Mapbox's per-layer enter/leave events
    // instead of querying all layers on every mousemove.
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
  }, [])

  const complaintsTitle = useMemo(() => {
    if (!layers.complaints) return ''
    const { complaintsMode, complaintsCategory } = subToggles
    if (complaintsMode === 'heatmap') return 'Complaint Density'
    return complaintsCategory === 'all' ? '311 Complaints' : complaintsCategory
  }, [layers.complaints, subToggles])

  const crimeTitle = useMemo(() => {
    if (!layers.crime) return ''
    const { crimeMode, crimeCategory } = subToggles
    if (crimeMode === 'heatmap') return 'Crime Density'
    return crimeCategory === 'all' ? 'Crime Incidents' : crimeCategory
  }, [layers.crime, subToggles])

  const demoTitle = useMemo(() => {
    if (!layers.demographics) return ''
    const titles: Record<string, string> = {
      population: 'Population (2020)',
      vacancyRate: 'Vacancy Rate %',
      popChange: 'Pop Change %',
    }
    return titles[subToggles.demographicsMetric] ?? 'Demographics'
  }, [layers.demographics, subToggles.demographicsMetric])

  const housingTitle = useMemo(() => {
    if (!layers.housing) return ''
    return subToggles.housingMetric === 'rent'
      ? 'Median Rent ($)'
      : 'Median Home Value ($)'
  }, [layers.housing, subToggles.housingMetric])

  const vacancyBreaks = useMemo(() => {
    if (!layers.vacancy || !vacancyData) return percentileBreaks([])
    return percentileBreaks(vacancyData.map((p) => p.triageScore))
  }, [layers.vacancy, vacancyData])

  const hasLegend =
    layers.complaints ||
    layers.crime ||
    layers.demographics ||
    layers.vacancy ||
    layers.foodAccess ||
    layers.transit ||
    layers.housing

  return (
    <MapProvider
      className="h-full w-full"
      mapStyle={MAP_STYLES[mapStyle]}
      onMapLoad={handleMapLoad}
    >
      <MapStyleToggle />
      {neighborhoods && <NeighborhoodBaseLayer />}
      {layers.complaints && <ComplaintsLayer />}
      {layers.crime && <CrimeLayer />}
      {layers.transit && <TransitLayer />}
      {layers.vacancy && <VacancyLayer />}
      {layers.foodAccess && <FoodAccessLayer />}
      {layers.demographics && <DemographicsLayer />}
      {layers.housing && <HousingLayer />}

      {hasLegend && (
        <MapLegend>
          {layers.complaints && (
            <GradientSection title={complaintsTitle} colors={CHORO_COLORS} />
          )}
          {layers.crime && (
            <GradientSection title={crimeTitle} colors={CRIME_COLORS} />
          )}
          {layers.demographics && (
            <GradientSection title={demoTitle} colors={DEMO_COLORS} />
          )}
          {layers.vacancy && (
            <>
              <div>
                <div className="mb-1 flex items-center gap-1">
                  <span className="font-semibold text-foreground">
                    Vacancy Priority
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full bg-muted text-[0.55rem] font-bold leading-none text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                        ?
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      align="start"
                      className="w-56 rounded-lg bg-popover p-2.5 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10"
                      hideArrow
                    >
                      <p className="mb-1.5 font-semibold">
                        How priority is calculated
                      </p>
                      <p className="mb-1 text-muted-foreground">
                        Properties are ranked relative to each other using a
                        weighted score:
                      </p>
                      <ul className="space-y-0.5 text-muted-foreground">
                        <li>
                          <span className="font-medium text-foreground">
                            25%
                          </span>{' '}
                          Condition (violation severity)
                        </li>
                        <li>
                          <span className="font-medium text-foreground">
                            20%
                          </span>{' '}
                          Complaint density
                        </li>
                        <li>
                          <span className="font-medium text-foreground">
                            15%
                          </span>{' '}
                          Ownership (LRA/City/Private)
                        </li>
                        <li>
                          <span className="font-medium text-foreground">
                            15%
                          </span>{' '}
                          Tax delinquency
                        </li>
                        <li>
                          <span className="font-medium text-foreground">
                            15%
                          </span>{' '}
                          Proximity activity
                        </li>
                        <li>
                          <span className="font-medium text-foreground">
                            10%
                          </span>{' '}
                          Lot size
                        </li>
                      </ul>
                      <p className="mt-1.5 text-muted-foreground">
                        Colors show percentile rank — each band holds ~20% of
                        properties.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <SwatchSection items={vacancyLegendItems(vacancyBreaks)} />
              </div>
              <SymbolSection
                title="Type"
                items={[
                  {
                    node: (
                      <span className="inline-block h-3 w-3 rounded-full border border-black/15 bg-muted-foreground/50" />
                    ),
                    label: 'Building',
                  },
                  {
                    node: (
                      <span className="inline-block h-2 w-2 rounded-full border border-black/15 bg-muted-foreground/50" />
                    ),
                    label: 'Lot',
                  },
                ]}
              />
            </>
          )}
          {layers.foodAccess && (
            <SwatchSection
              title="Food Access"
              items={[
                { color: '#ef4444', label: 'LILA Tract' },
                { color: '#059669', label: 'Grocery Store' },
              ]}
            />
          )}
          {layers.transit && (
            <>
              <SwatchSection
                title="Transit"
                items={[
                  { color: '#60a5fa', label: 'Stops' },
                  { color: '#a78bfa', label: 'Routes' },
                ]}
              />
              <SymbolSection
                title="Stop Activity"
                items={[
                  {
                    node: (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                    ),
                    label: 'Few',
                  },
                  {
                    node: (
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
                    ),
                    label: 'Many',
                  },
                ]}
              />
            </>
          )}
          {layers.housing && (
            <GradientSection title={housingTitle} colors={CHORO_COLORS} />
          )}
        </MapLegend>
      )}
      <TimeRangeSlider />
    </MapProvider>
  )
}
