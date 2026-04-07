import type { ExplorerData } from '@/lib/explorer-types'

/**
 * Reports which datasets have already been loaded into the client. Datasets
 * load on demand: data retrieval tools transparently fetch any dataset they
 * need before reading. This snapshot is just a hint to the AI about what is
 * already cached, so it can avoid unnecessary tool calls when it has enough
 * context already.
 */
export function buildKpiSnapshot(data: ExplorerData): string {
  const loaded: Array<string> = []
  const notYetLoaded: Array<string> = []

  if (data.csbData) loaded.push('complaints')
  else notYetLoaded.push('complaints')

  if (data.crimeData) loaded.push('crime')
  else notYetLoaded.push('crime')

  if (data.routes || data.stops) loaded.push('transit')
  else notYetLoaded.push('transit')

  if (data.vacancyData && data.vacancyData.length > 0) loaded.push('vacancy')
  else notYetLoaded.push('vacancy')

  if (data.arpaData) loaded.push('arpa')
  else notYetLoaded.push('arpa')

  if (data.demographicsData && Object.keys(data.demographicsData).length > 0)
    loaded.push('demographics')
  else notYetLoaded.push('demographics')

  if (data.foodDeserts || data.groceryStores) loaded.push('foodAccess')
  else notYetLoaded.push('foodAccess')

  if (data.housingData) loaded.push('housing')
  else notYetLoaded.push('housing')

  const parts: Array<string> = []
  if (loaded.length > 0) parts.push(`Already cached: ${loaded.join(', ')}.`)
  if (notYetLoaded.length > 0)
    parts.push(`Will lazy-load on demand: ${notYetLoaded.join(', ')}.`)

  return parts.join(' ') || 'No datasets cached yet.'
}
