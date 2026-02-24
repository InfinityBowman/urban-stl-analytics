import { resolveNeighborhood } from './neighborhood-resolver'
import type { ToolCall } from './use-chat'
import type { ChartBuilderAction } from '@/components/explorer/analytics/chart-builder/useChartBuilder'
import type { ExplorerAction, ExplorerData, ExplorerState, LayerToggles, SubToggles } from '@/lib/explorer-types'
import { getDataset, getDatasetFields } from '@/lib/chart-datasets'

interface ExecutorContext {
  state: ExplorerState
  dispatch: React.Dispatch<ExplorerAction>
  chartDispatch: React.Dispatch<ChartBuilderAction>
  data: ExplorerData
}

export interface ActionResult {
  description: string
}

/** Fuzzy-match a user/AI string against a list of known values (case-insensitive, substring) */
function fuzzyMatch(input: string, candidates: string[]): string | null {
  const lower = input.toLowerCase()
  // Exact match first
  const exact = candidates.find((c) => c.toLowerCase() === lower)
  if (exact) return exact
  // Substring match (input contained in candidate)
  const substring = candidates.find((c) => c.toLowerCase().includes(lower))
  if (substring) return substring
  // Reverse substring (candidate contained in input)
  const reverse = candidates.find((c) => lower.includes(c.toLowerCase()))
  if (reverse) return reverse
  return null
}

/** Friendly label for filter values (title-case the raw data strings) */
function friendlyLabel(value: string): string {
  if (value === 'all') return 'All'
  if (value === 'choropleth') return 'Choropleth'
  if (value === 'heatmap') return 'Heatmap'
  if (value === 'population') return 'Population'
  if (value === 'vacancyRate') return 'Vacancy Rate'
  if (value === 'popChange') return 'Pop Change'
  if (value === 'rent') return 'Median Rent'
  if (value === 'value') return 'Home Value'
  if (value === 'housing') return 'Housing'
  if (value === 'solar') return 'Solar'
  if (value === 'garden') return 'Garden'
  if (value === 'lra') return 'LRA'
  if (value === 'city') return 'City'
  if (value === 'private') return 'Private'
  if (value === 'building') return 'Building'
  if (value === 'lot') return 'Lot'
  // Title-case raw strings like "STEALING - MOTOR VEHICLE/..."
  return value
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\//g, ' / ')
}

export function executeToolCall(
  toolCall: ToolCall,
  ctx: ExecutorContext,
): ActionResult {
  const { state, dispatch, chartDispatch, data } = ctx
  const args = toolCall.arguments

  switch (toolCall.name) {
    case 'set_layers': {
      const layers = args.layers as Partial<Record<keyof LayerToggles, boolean>> | undefined
      if (!layers) return { description: 'No layers specified' }
      const toggled: Array<string> = []
      for (const [key, desired] of Object.entries(layers)) {
        const layerKey = key as keyof LayerToggles
        if (layerKey in state.layers && state.layers[layerKey] !== desired) {
          dispatch({ type: 'TOGGLE_LAYER', layer: layerKey })
          toggled.push(`${desired ? 'Enabled' : 'Disabled'} ${key}`)
        }
      }
      return {
        description: toggled.length ? toggled.join(', ') : '',
      }
    }

    case 'set_filters': {
      const descriptions: Array<string> = []

      // Helper: resolve a category filter with fuzzy matching
      const resolveCategory = (
        argKey: string,
        toggleKey: keyof SubToggles,
        candidates: string[],
        layerKey: keyof LayerToggles | null,
        label: string,
      ) => {
        if (!(argKey in args)) return
        const raw = args[argKey] as string
        if (raw === 'all') {
          dispatch({ type: 'SET_SUB_TOGGLE', key: toggleKey, value: 'all' })
          descriptions.push(`${label}: All`)
          return
        }
        const matched = fuzzyMatch(raw, candidates)
        if (matched) {
          // Auto-enable the layer if it's off
          if (layerKey && !state.layers[layerKey]) {
            dispatch({ type: 'TOGGLE_LAYER', layer: layerKey })
          }
          dispatch({ type: 'SET_SUB_TOGGLE', key: toggleKey, value: matched })
          descriptions.push(`${label}: ${friendlyLabel(matched)}`)
        } else {
          descriptions.push(`${label}: no match for "${raw}"`)
        }
      }

      // Helper: set a simple enum filter
      const setEnum = (
        argKey: string,
        toggleKey: keyof SubToggles,
        valid: string[],
        layerKey: keyof LayerToggles | null,
        label: string,
      ) => {
        if (!(argKey in args)) return
        const raw = args[argKey] as string
        const matched = valid.find((v) => v.toLowerCase() === raw.toLowerCase())
        if (!matched) {
          descriptions.push(`${label}: no match for "${raw}"`)
          return
        }
        if (layerKey && !state.layers[layerKey]) {
          dispatch({ type: 'TOGGLE_LAYER', layer: layerKey })
        }
        dispatch({ type: 'SET_SUB_TOGGLE', key: toggleKey, value: matched })
        descriptions.push(`${label}: ${friendlyLabel(matched)}`)
      }

      // Crime
      const crimeCategories = data.crimeData
        ? Object.keys(data.crimeData.categories)
        : []
      resolveCategory('crimeCategory', 'crimeCategory', crimeCategories, 'crime', 'Crime filter')
      setEnum('crimeMode', 'crimeMode', ['choropleth', 'heatmap'], 'crime', 'Crime view')

      // Complaints
      const complaintCategories = data.csbData
        ? Object.keys(data.csbData.categories)
        : []
      resolveCategory('complaintsCategory', 'complaintsCategory', complaintCategories, 'complaints', 'Complaints filter')
      setEnum('complaintsMode', 'complaintsMode', ['choropleth', 'heatmap'], 'complaints', 'Complaints view')

      // Demographics
      setEnum('demographicsMetric', 'demographicsMetric', ['population', 'vacancyRate', 'popChange'], 'demographics', 'Demographics')

      // ARPA (no map layer — pass null for layerKey)
      const arpaCategories = data.arpaData
        ? Object.keys(data.arpaData.categoryBreakdown)
        : []
      resolveCategory('arpaCategory', 'arpaCategory', arpaCategories, null, 'ARPA filter')

      // Housing
      setEnum('housingMetric', 'housingMetric', ['rent', 'value'], 'housing', 'Housing')

      // Transit sub-layers (booleans)
      for (const key of ['transitStops', 'transitRoutes', 'transitWalkshed'] as const) {
        if (key in args) {
          if (!state.layers.transit) {
            dispatch({ type: 'TOGGLE_LAYER', layer: 'transit' })
          }
          dispatch({ type: 'SET_SUB_TOGGLE', key, value: args[key] as boolean })
          descriptions.push(`${key}: ${args[key] ? 'On' : 'Off'}`)
        }
      }

      // Vacancy filters
      setEnum('vacancyUseFilter', 'vacancyUseFilter', ['all', 'housing', 'solar', 'garden'], 'vacancy', 'Vacancy use')
      setEnum('vacancyOwnerFilter', 'vacancyOwnerFilter', ['all', 'lra', 'city', 'private'], 'vacancy', 'Vacancy owner')
      setEnum('vacancyTypeFilter', 'vacancyTypeFilter', ['all', 'building', 'lot'], 'vacancy', 'Vacancy type')

      if ('vacancyHoodFilter' in args) {
        const raw = args.vacancyHoodFilter as string
        if (!state.layers.vacancy) {
          dispatch({ type: 'TOGGLE_LAYER', layer: 'vacancy' })
        }
        if (raw === 'all') {
          dispatch({ type: 'SET_SUB_TOGGLE', key: 'vacancyHoodFilter', value: 'all' })
          descriptions.push('Vacancy neighborhood: All')
        } else {
          const hoodNames = data.vacancyData
            ? [...new Set(data.vacancyData.map((p) => p.neighborhood))]
            : []
          const matched = fuzzyMatch(raw, hoodNames)
          if (matched) {
            dispatch({ type: 'SET_SUB_TOGGLE', key: 'vacancyHoodFilter', value: matched })
            descriptions.push(`Vacancy neighborhood: ${matched}`)
          } else {
            descriptions.push(`Vacancy neighborhood: no match for "${raw}"`)
          }
        }
      }

      for (const key of ['vacancyMinScore', 'vacancyMaxScore'] as const) {
        if (key in args) {
          if (!state.layers.vacancy) {
            dispatch({ type: 'TOGGLE_LAYER', layer: 'vacancy' })
          }
          const val = Number(args[key])
          dispatch({ type: 'SET_SUB_TOGGLE', key, value: val })
          descriptions.push(`${key}: ${val}`)
        }
      }

      // Food access sub-layers (booleans)
      for (const key of ['foodDesertTracts', 'groceryStores'] as const) {
        if (key in args) {
          if (!state.layers.foodAccess) {
            dispatch({ type: 'TOGGLE_LAYER', layer: 'foodAccess' })
          }
          dispatch({ type: 'SET_SUB_TOGGLE', key, value: args[key] as boolean })
          descriptions.push(`${key}: ${args[key] ? 'On' : 'Off'}`)
        }
      }

      // Time range
      for (const key of ['timeRangeStart', 'timeRangeEnd'] as const) {
        if (key in args) {
          dispatch({ type: 'SET_SUB_TOGGLE', key, value: args[key] as string })
          descriptions.push(`${key}: ${args[key] || '(cleared)'}`)
        }
      }

      return {
        description: descriptions.length ? descriptions.join(', ') : '',
      }
    }

    case 'select_neighborhood': {
      const name = args.name as string
      if (!name || !data.neighborhoods) {
        return { description: 'Could not find neighborhood' }
      }
      const resolved = resolveNeighborhood(name, data.neighborhoods)
      if (!resolved) {
        return { description: `No match for "${name}"` }
      }
      dispatch({
        type: 'SELECT_ENTITY',
        entity: { type: 'neighborhood', id: resolved.nhdNum },
      })
      return { description: `Selected ${resolved.name}` }
    }

    case 'select_entity': {
      const entityType = args.type as string
      const entityId = args.id as string
      if (entityType === 'stop') {
        dispatch({
          type: 'SELECT_ENTITY',
          entity: { type: 'stop', id: entityId },
        })
      } else if (entityType === 'grocery') {
        dispatch({
          type: 'SELECT_ENTITY',
          entity: { type: 'grocery', id: Number(entityId) },
        })
      } else if (entityType === 'foodDesert') {
        dispatch({
          type: 'SELECT_ENTITY',
          entity: { type: 'foodDesert', id: entityId },
        })
      } else if (entityType === 'vacancy') {
        if (!state.layers.vacancy) {
          dispatch({ type: 'TOGGLE_LAYER', layer: 'vacancy' })
        }
        dispatch({
          type: 'SELECT_ENTITY',
          entity: { type: 'vacancy', id: Number(entityId) },
        })
      }
      return { description: `Selected ${entityType} ${entityId}` }
    }

    case 'toggle_analytics': {
      const expanded = args.expanded as boolean
      if (state.analyticsPanelExpanded !== expanded) {
        dispatch({ type: 'TOGGLE_ANALYTICS' })
      }
      return {
        description: expanded ? 'Opened analytics panel' : 'Closed analytics panel',
      }
    }

    case 'configure_chart': {
      const datasetKey = args.datasetKey as string
      const presetName = args.presetName as string | undefined

      const def = getDataset(datasetKey)
      if (!def) {
        return { description: `Unknown dataset: ${datasetKey}` }
      }

      // Ensure required layers are on
      for (const layer of def.requiredLayers) {
        if (!state.layers[layer]) {
          dispatch({ type: 'TOGGLE_LAYER', layer })
        }
      }

      // Open analytics if closed
      if (!state.analyticsPanelExpanded) {
        dispatch({ type: 'TOGGLE_ANALYTICS' })
      }

      // Switch to the chart builder tab
      dispatch({ type: 'SET_ANALYTICS_TAB', tab: 'chart' })

      const fields = getDatasetFields(def, data)
      chartDispatch({ type: 'SET_DATASET', datasetKey, fields, def })

      if (presetName && def.presets) {
        const preset = def.presets.find((p) => p.name === presetName)
        if (preset) {
          chartDispatch({ type: 'APPLY_PRESET', preset, fields })
        }
      }

      return {
        description: `Configured chart: ${def.label}${presetName ? ` (${presetName})` : ''}`,
      }
    }

    case 'clear_selection': {
      dispatch({ type: 'CLEAR_SELECTION' })
      return { description: 'Cleared selection' }
    }

    case 'set_map_style': {
      const style = args.style as 'light' | 'dark' | 'satellite' | 'streets'
      dispatch({ type: 'SET_MAP_STYLE', style })
      return { description: `Map style: ${style}` }
    }

    case 'compare_neighborhoods': {
      const enabled = args.enabled as boolean
      const descriptions: Array<string> = []

      if (!enabled) {
        if (state.compareMode) {
          dispatch({ type: 'TOGGLE_COMPARE_MODE' })
          descriptions.push('Exited compare mode')
        } else {
          descriptions.push('Compare mode already off')
        }
        return { description: descriptions.join(', ') }
      }

      // Enable compare mode if off
      if (!state.compareMode) {
        dispatch({ type: 'TOGGLE_COMPARE_MODE' })
        descriptions.push('Entered compare mode')
      }

      // Resolve neighborhoods A and B
      const resolveSlot = (argKey: string, slot: 'A' | 'B') => {
        if (!args[argKey] || !data.neighborhoods) return
        const resolved = resolveNeighborhood(args[argKey] as string, data.neighborhoods)
        if (resolved) {
          dispatch({ type: 'SET_COMPARE_NEIGHBORHOOD', slot, id: resolved.nhdNum })
          descriptions.push(`${slot}: ${resolved.name}`)
        } else {
          descriptions.push(`${slot}: no match for "${args[argKey]}"`)
        }
      }
      resolveSlot('neighborhoodA', 'A')
      resolveSlot('neighborhoodB', 'B')

      return { description: descriptions.join(', ') || 'Compare mode enabled' }
    }

    case 'set_analytics_tab': {
      const tab = args.tab as string

      // Open analytics panel if closed
      if (!state.analyticsPanelExpanded) {
        dispatch({ type: 'TOGGLE_ANALYTICS' })
      }

      // Auto-enable the associated layer (chart tab has no layer)
      // arpa intentionally omitted — no map layer
      const tabLayerMap: Record<string, keyof LayerToggles> = {
        complaints: 'complaints',
        crime: 'crime',
        transit: 'transit',
        vacancy: 'vacancy',
        demographics: 'demographics',
        housing: 'housing',
        affected: 'affected',
      }
      const layerKey = tabLayerMap[tab]
      if (layerKey && !state.layers[layerKey]) {
        dispatch({ type: 'TOGGLE_LAYER', layer: layerKey })
      }

      dispatch({ type: 'SET_ANALYTICS_TAB', tab })
      return { description: `Switched to ${tab} analytics tab` }
    }

    default:
      return { description: `Unknown tool: ${toolCall.name}` }
  }
}
