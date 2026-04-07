import { useEffect, useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useDataStore } from '@/stores/data-store'
import { useExplorerStore } from '@/stores/explorer-store'

export function TransitLayer() {
  useEffect(() => {
    useDataStore.getState().loadLayer('transit')
  }, [])

  const stops = useDataStore((s) => s.stops)
  const stopStats = useDataStore((s) => s.stopStats)
  const shapes = useDataStore((s) => s.shapes)

  const walkshedOn = useExplorerStore((s) => s.subToggles.transitWalkshed)
  const routesOn = useExplorerStore((s) => s.subToggles.transitRoutes)
  const stopsOn = useExplorerStore((s) => s.subToggles.transitStops)

  // Stops with stats
  const stopsWithStats = useMemo(() => {
    if (!stops || !stopStats) return null
    const features = stops.features.map((stop) => {
      const stats = stopStats[stop.properties.stop_id as string] || {
        trip_count: 0,
        routes: [],
      }
      return {
        ...stop,
        properties: {
          ...stop.properties,
          trip_count: stats.trip_count,
          route_count: stats.routes.length,
        },
      }
    })
    return { type: 'FeatureCollection' as const, features }
  }, [stops, stopStats])

  // Walkshed circles
  const walkshedGeo = useMemo(() => {
    if (!stops) return null
    const features = stops.features.map((stop) => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Point' as const,
        coordinates: stop.geometry.coordinates,
      },
    }))
    return { type: 'FeatureCollection' as const, features }
  }, [stops])

  if (!stops) return null

  return (
    <>
      {/* Walkshed */}
      {walkshedOn && walkshedGeo && (
        <Source id="walkshed" type="geojson" data={walkshedGeo as GeoJSON.FeatureCollection}>
          <Layer
            id="walkshed-circles"
            type="circle"
            paint={{
              'circle-radius': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10,
                3,
                14,
                60,
                18,
                400,
              ],
              'circle-color': '#60a5fa',
              'circle-opacity': 0.06,
              'circle-stroke-width': 0.5,
              'circle-stroke-color': '#3b82f6',
              'circle-stroke-opacity': 0.2,
            }}
          />
        </Source>
      )}

      {/* Routes */}
      {routesOn && shapes && (
        <Source id="transit-routes" type="geojson" data={shapes as unknown as GeoJSON.FeatureCollection}>
          <Layer
            id="route-lines"
            type="line"
            paint={{
              'line-color': '#a78bfa',
              'line-width': 2.5,
              'line-opacity': 0.6,
            }}
          />
        </Source>
      )}

      {/* Stops */}
      {stopsOn && stopsWithStats && (
        <Source id="transit-stops" type="geojson" data={stopsWithStats as GeoJSON.FeatureCollection}>
          <Layer
            id="stops-circles"
            type="circle"
            paint={{
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'trip_count'],
                0,
                3,
                50,
                5,
                200,
                8,
              ],
              'circle-color': '#60a5fa',
              'circle-opacity': 0.7,
              'circle-stroke-color': '#2563eb',
              'circle-stroke-width': 1,
            }}
          />
        </Source>
      )}
    </>
  )
}
