import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'
import { CHORO_COLORS, dynamicBreaks } from '@/lib/colors'

export function HousingLayer() {
  const { state } = useExplorer()
  const data = useData()
  const metric = state.subToggles.housingMetric

  const choroplethGeo = useMemo(() => {
    if (!data.neighborhoods || !data.housingData) return null
    const features = data.neighborhoods.features.map((f) => {
      const nhdNum = String(f.properties.NHD_NUM).padStart(2, '0')
      const nhd = data.housingData!.neighborhoods[nhdNum]
      const value =
        metric === 'rent'
          ? (nhd?.medianRent ?? 0)
          : (nhd?.medianHomeValue ?? 0)
      return {
        ...f,
        properties: { ...f.properties, housingValue: value },
      }
    })
    return { type: 'FeatureCollection' as const, features }
  }, [data.neighborhoods, data.housingData, metric])

  const breaks = useMemo(() => {
    if (!choroplethGeo) return dynamicBreaks([])
    const values = choroplethGeo.features
      .map((f) => f.properties.housingValue)
      .filter((v) => v > 0)
    return dynamicBreaks(values)
  }, [choroplethGeo])

  const positiveBreaks = breaks.filter((b) => b > 0)
  const fillColorExpr: mapboxgl.Expression = [
    'step',
    ['get', 'housingValue'],
    '#374151', // gray for no-data (0)
    ...positiveBreaks.flatMap((b, i) => [b, CHORO_COLORS[i % CHORO_COLORS.length]]),
  ]

  if (!data.housingData || !data.neighborhoods) return null

  return (
    <>
      {choroplethGeo && (
        <Source id="housing-choropleth" type="geojson" data={choroplethGeo}>
          <Layer
            id="housing-choropleth-fill"
            type="fill"
            beforeId="waterway-label"
            paint={{
              'fill-color': fillColorExpr,
              'fill-opacity': 0.7,
            }}
          />
          <Layer
            id="housing-choropleth-outline"
            type="line"
            beforeId="waterway-label"
            paint={{
              'line-color': 'rgba(0,0,0,0.15)',
              'line-width': 1,
            }}
          />
        </Source>
      )}
    </>
  )
}
