import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useData } from '../ExplorerProvider'
import { AFFECTED_BREAKS, AFFECTED_COLORS } from '@/lib/colors'

export function AffectedLayer() {
  const data = useData()

  const choroplethGeo = useMemo(() => {
    if (!data.neighborhoods || !data.affectedScores) return null
    const scoreMap = new Map<string, number>()
    for (const s of data.affectedScores) scoreMap.set(s.nhdId, s.composite)

    const features = data.neighborhoods.features.map((f) => {
      const nhdNum = String(f.properties.NHD_NUM).padStart(2, '0')
      const value = scoreMap.get(nhdNum) ?? 0
      return {
        ...f,
        properties: { ...f.properties, distressScore: value },
      }
    })
    return { type: 'FeatureCollection' as const, features }
  }, [data.neighborhoods, data.affectedScores])

  const fillColorExpr: mapboxgl.Expression = [
    'step',
    ['get', 'distressScore'],
    AFFECTED_COLORS[0],
    ...AFFECTED_BREAKS.slice(1).flatMap((b, i) => [b, AFFECTED_COLORS[i + 1]]),
  ]

  if (!data.affectedScores || !data.neighborhoods) return null

  return (
    <>
      {choroplethGeo && (
        <Source id="affected-choropleth" type="geojson" data={choroplethGeo}>
          <Layer
            id="affected-choropleth-fill"
            type="fill"
            beforeId="waterway-label"
            paint={{
              'fill-color': fillColorExpr,
              'fill-opacity': 0.7,
            }}
          />
          <Layer
            id="affected-choropleth-outline"
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
