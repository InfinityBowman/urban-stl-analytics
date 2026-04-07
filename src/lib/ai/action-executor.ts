import { resolveNeighborhood } from './neighborhood-resolver'
import type { ToolCall } from './use-chat'
import type { ChartBuilderAction } from '@/components/explorer/analytics/chart-builder/useChartBuilder'
import type {
  ExplorerState,
  LayerToggles,
  SubToggles,
} from '@/lib/explorer-types'
import { getDataset, getDatasetFields } from '@/lib/chart-datasets'
import { useExplorerStore } from '@/stores/explorer-store'
import { ensureLoaded, getDataSnapshot } from '@/stores/data-store'

interface ExecutorContext {
  /**
   * Snapshot of explorer state taken at the start of a tool batch. Used for
   * "is this layer already on?" style checks so multiple tools in the same
   * batch see a consistent view of the world.
   */
  state: ExplorerState
  /**
   * Set of layer keys that this batch has already toggled. Mutated by the
   * executor so we don't toggle the same layer twice within one batch (the
   * `state` snapshot would report the old value).
   */
  toggledLayers: Set<string>
  chartDispatch: React.Dispatch<ChartBuilderAction>
}

export interface ActionResult {
  description: string
}

/** Fuzzy-match a user/AI string against a list of known values (case-insensitive, substring) */
function fuzzyMatch(input: string, candidates: Array<string>): string | null {
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

/** Toggle a layer unless already toggled in this batch. */
function toggleLayerOnce(ctx: ExecutorContext, layer: keyof LayerToggles) {
  if (ctx.toggledLayers.has(layer)) return
  ctx.toggledLayers.add(layer)
  useExplorerStore.getState().toggleLayer(layer)
}

export async function executeToolCall(
  toolCall: ToolCall,
  ctx: ExecutorContext,
): Promise<ActionResult> {
  const { state, chartDispatch } = ctx
  const store = useExplorerStore.getState()
  const args = toolCall.arguments
  // Most cases only need the data snapshot at all if they read it; we
  // refresh it after any awaits below.
  let data = getDataSnapshot()

  switch (toolCall.name) {
    case 'set_layers': {
      const layers = args.layers as
        | Partial<Record<keyof LayerToggles, boolean>>
        | undefined
      if (!layers) return { description: 'No layers specified' }
      const toggled: Array<string> = []
      for (const [key, desired] of Object.entries(layers)) {
        const layerKey = key as keyof LayerToggles
        if (layerKey in state.layers && state.layers[layerKey] !== desired) {
          toggleLayerOnce(ctx, layerKey)
          toggled.push(`${desired ? 'Enabled' : 'Disabled'} ${key}`)
        }
      }
      return {
        description: toggled.length ? toggled.join(', ') : '',
      }
    }

    case 'set_filters': {
      // The fuzzy match below reads category lists out of the data store.
      // Pre-load whichever datasets the args mention so the match has real
      // candidates instead of falling through to "no match".
      const layersToLoad: Array<keyof LayerToggles> = []
      if ('crimeCategory' in args) layersToLoad.push('crime')
      if ('complaintsCategory' in args) layersToLoad.push('complaints')
      if ('arpaCategory' in args) layersToLoad.push('arpa')
      if ('vacancyHoodFilter' in args) layersToLoad.push('vacancy')
      if (layersToLoad.length > 0) {
        await ensureLoaded(...layersToLoad)
        data = getDataSnapshot()
      }

      const descriptions: Array<string> = []

      // Helper: resolve a category filter with fuzzy matching
      const resolveCategory = (
        argKey: string,
        toggleKey: keyof SubToggles,
        candidates: Array<string>,
        layerKey: keyof LayerToggles | null,
        label: string,
      ) => {
        if (!(argKey in args)) return
        const raw = args[argKey] as string
        if (raw === 'all') {
          store.setSubToggle(toggleKey, 'all')
          descriptions.push(`${label}: All`)
          return
        }
        const matched = fuzzyMatch(raw, candidates)
        if (matched) {
          // Auto-enable the layer if it's off
          if (layerKey && !state.layers[layerKey]) {
            toggleLayerOnce(ctx, layerKey)
          }
          store.setSubToggle(toggleKey, matched)
          descriptions.push(`${label}: ${friendlyLabel(matched)}`)
        } else {
          descriptions.push(`${label}: no match for "${raw}"`)
        }
      }

      // Helper: set a simple enum filter
      const setEnum = (
        argKey: string,
        toggleKey: keyof SubToggles,
        valid: Array<string>,
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
          toggleLayerOnce(ctx, layerKey)
        }
        store.setSubToggle(toggleKey, matched)
        descriptions.push(`${label}: ${friendlyLabel(matched)}`)
      }

      // Crime
      const crimeCategories = data.crimeData
        ? Object.keys(data.crimeData.categories)
        : []
      resolveCategory(
        'crimeCategory',
        'crimeCategory',
        crimeCategories,
        'crime',
        'Crime filter',
      )
      setEnum(
        'crimeMode',
        'crimeMode',
        ['choropleth', 'heatmap'],
        'crime',
        'Crime view',
      )

      // Complaints
      const complaintCategories = data.csbData
        ? Object.keys(data.csbData.categories)
        : []
      resolveCategory(
        'complaintsCategory',
        'complaintsCategory',
        complaintCategories,
        'complaints',
        'Complaints filter',
      )
      setEnum(
        'complaintsMode',
        'complaintsMode',
        ['choropleth', 'heatmap'],
        'complaints',
        'Complaints view',
      )

      // Demographics
      setEnum(
        'demographicsMetric',
        'demographicsMetric',
        ['population', 'vacancyRate', 'popChange'],
        'demographics',
        'Demographics',
      )

      // ARPA (no map layer — pass null for layerKey)
      const arpaCategories = data.arpaData
        ? Object.keys(data.arpaData.categoryBreakdown)
        : []
      resolveCategory(
        'arpaCategory',
        'arpaCategory',
        arpaCategories,
        null,
        'ARPA filter',
      )

      // Housing
      setEnum(
        'housingMetric',
        'housingMetric',
        ['rent', 'value'],
        'housing',
        'Housing',
      )

      // Transit sub-layers (booleans)
      for (const key of [
        'transitStops',
        'transitRoutes',
        'transitWalkshed',
      ] as const) {
        if (key in args) {
          if (!state.layers.transit) {
            toggleLayerOnce(ctx, 'transit')
          }
          store.setSubToggle(key, args[key] as boolean)
          descriptions.push(`${key}: ${args[key] ? 'On' : 'Off'}`)
        }
      }

      // Vacancy filters
      setEnum(
        'vacancyUseFilter',
        'vacancyUseFilter',
        ['all', 'housing', 'solar', 'garden'],
        'vacancy',
        'Vacancy use',
      )
      setEnum(
        'vacancyOwnerFilter',
        'vacancyOwnerFilter',
        ['all', 'lra', 'city', 'private'],
        'vacancy',
        'Vacancy owner',
      )
      setEnum(
        'vacancyTypeFilter',
        'vacancyTypeFilter',
        ['all', 'building', 'lot'],
        'vacancy',
        'Vacancy type',
      )

      if ('vacancyHoodFilter' in args) {
        const raw = args.vacancyHoodFilter as string
        if (!state.layers.vacancy) {
          toggleLayerOnce(ctx, 'vacancy')
        }
        if (raw === 'all') {
          store.setSubToggle('vacancyHoodFilter', 'all')
          descriptions.push('Vacancy neighborhood: All')
        } else {
          const hoodNames = data.vacancyData
            ? [...new Set(data.vacancyData.map((p) => p.neighborhood))]
            : []
          const matched = fuzzyMatch(raw, hoodNames)
          if (matched) {
            store.setSubToggle('vacancyHoodFilter', matched)
            descriptions.push(`Vacancy neighborhood: ${matched}`)
          } else {
            descriptions.push(`Vacancy neighborhood: no match for "${raw}"`)
          }
        }
      }

      for (const key of ['vacancyMinScore', 'vacancyMaxScore'] as const) {
        if (key in args) {
          if (!state.layers.vacancy) {
            toggleLayerOnce(ctx, 'vacancy')
          }
          const val = Number(args[key])
          store.setSubToggle(key, val)
          descriptions.push(`${key}: ${val}`)
        }
      }

      // Food access sub-layers (booleans)
      for (const key of ['foodDesertTracts', 'groceryStores'] as const) {
        if (key in args) {
          if (!state.layers.foodAccess) {
            toggleLayerOnce(ctx, 'foodAccess')
          }
          store.setSubToggle(key, args[key] as boolean)
          descriptions.push(`${key}: ${args[key] ? 'On' : 'Off'}`)
        }
      }

      // Time range
      for (const key of ['timeRangeStart', 'timeRangeEnd'] as const) {
        if (key in args) {
          store.setSubToggle(key, args[key] as string)
          descriptions.push(`${key}: ${args[key] || '(cleared)'}`)
        }
      }

      return {
        description: descriptions.length ? descriptions.join(', ') : '',
      }
    }

    case 'select_neighborhood': {
      const name = args.name as string
      if (!name) return { description: 'Could not find neighborhood' }
      await ensureLoaded('base')
      data = getDataSnapshot()
      if (!data.neighborhoods) {
        return { description: 'Could not find neighborhood' }
      }
      const resolved = resolveNeighborhood(name, data.neighborhoods)
      if (!resolved) {
        return { description: `No match for "${name}"` }
      }
      store.selectEntity({ type: 'neighborhood', id: resolved.nhdNum })
      return { description: `Selected ${resolved.name}` }
    }

    case 'select_entity': {
      const entityType = args.type as string
      const entityId = args.id as string
      if (entityType === 'stop') {
        store.selectEntity({ type: 'stop', id: entityId })
      } else if (entityType === 'grocery') {
        store.selectEntity({ type: 'grocery', id: Number(entityId) })
      } else if (entityType === 'foodDesert') {
        store.selectEntity({ type: 'foodDesert', id: entityId })
      } else if (entityType === 'vacancy') {
        if (!state.layers.vacancy) {
          toggleLayerOnce(ctx, 'vacancy')
        }
        store.selectEntity({ type: 'vacancy', id: Number(entityId) })
      }
      return { description: `Selected ${entityType} ${entityId}` }
    }

    case 'toggle_analytics': {
      const expanded = args.expanded as boolean
      if (state.analyticsPanelExpanded !== expanded) {
        store.toggleAnalytics()
      }
      return {
        description: expanded
          ? 'Opened analytics panel'
          : 'Closed analytics panel',
      }
    }

    case 'configure_chart': {
      const datasetKey = args.datasetKey as string
      const presetName = args.presetName as string | undefined

      const def = getDataset(datasetKey)
      if (!def) {
        return { description: `Unknown dataset: ${datasetKey}` }
      }

      // Ensure required layers are on AND their data is loaded - the chart
      // builder needs the actual rows to derive fields and render.
      for (const layer of def.requiredLayers) {
        if (!state.layers[layer]) {
          toggleLayerOnce(ctx, layer)
        }
      }
      if (def.requiredLayers.length > 0) {
        await ensureLoaded(...def.requiredLayers)
        data = getDataSnapshot()
      }

      // Open analytics if closed
      if (!state.analyticsPanelExpanded) {
        store.toggleAnalytics()
      }

      // Switch to the chart builder tab
      store.setAnalyticsTab('chart')

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
      store.clearSelection()
      return { description: 'Cleared selection' }
    }

    case 'set_map_style': {
      const style = args.style as 'light' | 'dark' | 'satellite' | 'streets'
      store.setMapStyle(style)
      return { description: `Map style: ${style}` }
    }

    case 'compare_neighborhoods': {
      const enabled = args.enabled as boolean
      const descriptions: Array<string> = []

      if (!enabled) {
        if (state.compareMode) {
          store.toggleCompareMode()
          descriptions.push('Exited compare mode')
        } else {
          descriptions.push('Compare mode already off')
        }
        return { description: descriptions.join(', ') }
      }

      // Enable compare mode if off
      if (!state.compareMode) {
        store.toggleCompareMode()
        descriptions.push('Entered compare mode')
      }

      // Need base data to resolve neighborhood names.
      if (args.neighborhoodA || args.neighborhoodB) {
        await ensureLoaded('base')
        data = getDataSnapshot()
      }

      // Resolve neighborhoods A and B
      const resolveSlot = (argKey: string, slot: 'A' | 'B') => {
        if (!args[argKey] || !data.neighborhoods) return
        const resolved = resolveNeighborhood(
          args[argKey] as string,
          data.neighborhoods,
        )
        if (resolved) {
          store.setCompareNeighborhood(slot, resolved.nhdNum)
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
        store.toggleAnalytics()
      }

      // Auto-enable the associated layer (chart tab has no layer).
      // arpa intentionally omitted (no map layer).
      const tabLayerMap: Record<string, keyof LayerToggles> = {
        complaints: 'complaints',
        crime: 'crime',
        transit: 'transit',
        vacancy: 'vacancy',
        demographics: 'demographics',
        housing: 'housing',
      }
      const layerKey = tabLayerMap[tab]
      if (layerKey && !state.layers[layerKey]) {
        toggleLayerOnce(ctx, layerKey)
      }

      store.setAnalyticsTab(tab)
      return { description: `Switched to ${tab} analytics tab` }
    }

    default:
      return { description: `Unknown tool: ${toolCall.name}` }
  }
}
