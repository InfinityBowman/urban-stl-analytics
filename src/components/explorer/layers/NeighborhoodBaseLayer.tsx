import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useDataStore } from '@/stores/data-store'
import { useExplorerStore } from '@/stores/explorer-store'

export function NeighborhoodBaseLayer() {
  const neighborhoods = useDataStore((s) => s.neighborhoods)
  const selected = useExplorerStore((s) => s.selected)
  const compareMode = useExplorerStore((s) => s.compareMode)
  const compareNeighborhoodA = useExplorerStore((s) => s.compareNeighborhoodA)
  const compareNeighborhoodB = useExplorerStore((s) => s.compareNeighborhoodB)

  const selectedNum = useMemo(() => {
    if (!selected || selected.type !== 'neighborhood') return null
    return parseInt(selected.id, 10)
  }, [selected])

  const compareANum = useMemo(
    () => (compareNeighborhoodA ? parseInt(compareNeighborhoodA, 10) : null),
    [compareNeighborhoodA],
  )
  const compareBNum = useMemo(
    () => (compareNeighborhoodB ? parseInt(compareNeighborhoodB, 10) : null),
    [compareNeighborhoodB],
  )

  const matchExpr = useMemo<mapboxgl.Expression>(
    () => ['==', ['get', 'NHD_NUM'], selectedNum ?? -1],
    [selectedNum],
  )

  const matchCompareA = useMemo<mapboxgl.Expression>(
    () => ['==', ['get', 'NHD_NUM'], compareANum ?? -1],
    [compareANum],
  )

  const matchCompareB = useMemo<mapboxgl.Expression>(
    () => ['==', ['get', 'NHD_NUM'], compareBNum ?? -1],
    [compareBNum],
  )

  const isCompareSelected = useMemo<mapboxgl.Expression>(
    () => ['any', matchCompareA, matchCompareB],
    [matchCompareA, matchCompareB],
  )

  const fillColor = useMemo<mapboxgl.Expression>(
    () =>
      compareMode
        ? [
            'case',
            matchCompareA,
            'rgba(59,130,246,0.25)',
            matchCompareB,
            'rgba(249,115,22,0.25)',
            matchExpr,
            'rgba(99,102,241,0.25)',
            'rgba(0,0,0,0.08)',
          ]
        : ['case', matchExpr, 'rgba(99,102,241,0.25)', 'transparent'],
    [compareMode, matchCompareA, matchCompareB, matchExpr],
  )

  const lineColor = useMemo<mapboxgl.Expression>(
    () =>
      compareMode
        ? [
            'case',
            matchCompareA,
            '#3b82f6',
            matchCompareB,
            '#f97316',
            matchExpr,
            '#4f6ef7',
            'rgba(0,0,0,0.12)',
          ]
        : ['case', matchExpr, '#4f6ef7', 'rgba(0,0,0,0.12)'],
    [compareMode, matchCompareA, matchCompareB, matchExpr],
  )

  const lineWidth = useMemo<mapboxgl.Expression>(
    () =>
      compareMode
        ? ['case', isCompareSelected, 3.5, matchExpr, 2.5, 0.5]
        : ['case', matchExpr, 2.5, 0.5],
    [compareMode, isCompareSelected, matchExpr],
  )

  if (!neighborhoods) return null

  return (
    <Source
      id="neighborhood-base"
      type="geojson"
      data={neighborhoods as unknown as GeoJSON.GeoJSON}
    >
      <Layer
        id="neighborhood-base-fill"
        type="fill"
        beforeId="waterway-label"
        paint={{
          'fill-color': fillColor,
          'fill-opacity': 0.5,
        }}
      />
      <Layer
        id="neighborhood-base-outline"
        type="line"
        paint={{
          'line-color': lineColor,
          'line-width': lineWidth,
        }}
      />
      <Layer
        id="neighborhood-labels"
        type="symbol"
        layout={{
          'text-field': ['get', 'NHD_NAME'],
          'text-size': 10,
          'text-anchor': 'center',
          'text-allow-overlap': false,
        }}
        paint={{
          'text-color': 'rgba(0,0,0,0.55)',
          'text-halo-color': 'rgba(255,255,255,0.8)',
          'text-halo-width': 1.2,
        }}
      />
    </Source>
  )
}
