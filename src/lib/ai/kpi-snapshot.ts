import type { ExplorerData } from '@/lib/explorer-types'

/**
 * Reports which datasets are currently loaded vs null.
 * The AI uses data retrieval tools to fetch actual numbers on demand.
 */
export function buildKpiSnapshot(data: ExplorerData): string {
  const loaded: Array<string> = []
  const notLoaded: Array<string> = []

  if (data.csbData) loaded.push('complaints')
  else notLoaded.push('complaints')

  if (data.crimeData) loaded.push('crime')
  else notLoaded.push('crime')

  if (data.routes || data.stops) loaded.push('transit')
  else notLoaded.push('transit')

  if (data.vacancyData && data.vacancyData.length > 0) loaded.push('vacancy')
  else notLoaded.push('vacancy')

  if (data.arpaData) loaded.push('arpa')
  else notLoaded.push('arpa')

  if (data.demographicsData && Object.keys(data.demographicsData).length > 0) loaded.push('demographics')
  else notLoaded.push('demographics')

  if (data.foodDeserts || data.groceryStores) loaded.push('foodAccess')
  else notLoaded.push('foodAccess')

  if (data.housingData) loaded.push('housing')
  else notLoaded.push('housing')

  if (data.affectedScores && data.affectedScores.length > 0) loaded.push('affected')
  else notLoaded.push('affected')

  const parts: Array<string> = []
  if (loaded.length > 0) parts.push(`Loaded: ${loaded.join(', ')}.`)
  if (notLoaded.length > 0) parts.push(`Still loading: ${notLoaded.join(', ')}.`)

  return parts.join(' ') || 'Data is still loading.'
}
