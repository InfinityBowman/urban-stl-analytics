import { useEffect, useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useDataStore } from '@/stores/data-store'
import { useExplorerStore } from '@/stores/explorer-store'

export function FoodAccessLayer() {
  useEffect(() => {
    useDataStore.getState().loadLayer('foodAccess')
  }, [])

  const foodDeserts = useDataStore((s) => s.foodDeserts)
  const groceryStores = useDataStore((s) => s.groceryStores)

  const showDesertTracts = useExplorerStore((s) => s.subToggles.foodDesertTracts)
  const showGroceryStores = useExplorerStore((s) => s.subToggles.groceryStores)

  const desertGeo = useMemo(() => {
    if (!foodDeserts) return null
    return {
      type: 'FeatureCollection' as const,
      features: foodDeserts.features.filter((f) => f.properties.lila),
    }
  }, [foodDeserts])

  const groceryPointsGeo = useMemo(() => {
    if (!groceryStores) return null
    return {
      type: 'FeatureCollection' as const,
      features: groceryStores.features.map((s, i) => ({
        type: 'Feature' as const,
        properties: { ...s.properties, idx: i },
        geometry: {
          type: 'Point' as const,
          coordinates: s.geometry.coordinates,
        },
      })),
    }
  }, [groceryStores])

  if (!foodDeserts) return null

  return (
    <>
      {/* Food desert tracts */}
      {showDesertTracts && desertGeo && (
        <Source id="food-deserts" type="geojson" data={desertGeo}>
          <Layer
            id="desert-fill"
            type="fill"
            beforeId="waterway-label"
            paint={{
              'fill-color': '#ef4444',
              'fill-opacity': [
                'interpolate',
                ['linear'],
                ['get', 'poverty_rate'],
                0,
                0.25,
                100,
                0.7,
              ],
            }}
          />
          <Layer
            id="desert-outline"
            type="line"
            beforeId="waterway-label"
            paint={{
              'line-color': '#dc2626',
              'line-width': 2,
              'line-opacity': 0.8,
            }}
          />
        </Source>
      )}

      {/* Grocery stores */}
      {showGroceryStores && groceryPointsGeo && (
        <Source id="grocery-stores" type="geojson" data={groceryPointsGeo}>
          <Layer
            id="grocery-circles"
            type="circle"
            paint={{
              'circle-radius': 7,
              'circle-color': '#059669',
              'circle-stroke-color': '#ecfdf5',
              'circle-stroke-width': 2,
            }}
          />
        </Source>
      )}
    </>
  )
}
