import type { ExplorerData } from '@/lib/explorer-types'
import type { ToolCall } from './use-chat'
import { computeNeighborhoodMetrics } from '@/lib/neighborhood-metrics'
import { resolveNeighborhood } from './neighborhood-resolver'

export interface DataToolResult {
  toolCallId: string
  name: string
  content: string
}

/**
 * Execute a data retrieval tool call against the current ExplorerData.
 * Returns a result object suitable for building a role:'tool' message.
 */
export function executeDataTool(
  toolCall: ToolCall,
  data: ExplorerData,
): DataToolResult {
  const args = toolCall.arguments

  let content: unknown
  switch (toolCall.name) {
    case 'get_city_summary':
      content = buildCitySummary(data)
      break
    case 'get_neighborhood_detail':
      content = buildNeighborhoodDetail(args.name as string, data)
      break
    case 'get_rankings':
      content = buildRankings(
        args.metric as string,
        (args.order as string) ?? 'desc',
        Math.min(Number(args.limit) || 10, 20),
        data,
      )
      break
    case 'get_category_breakdown':
      content = buildCategoryBreakdown(
        args.dataset as string,
        args.neighborhood as string | undefined,
        data,
      )
      break
    case 'get_arpa_data':
      content = buildArpaData(args.category as string | undefined, data)
      break
    case 'get_food_access':
      content = buildFoodAccess(data)
      break
    case 'get_housing_data':
      content = buildHousingData(args.neighborhood as string | undefined, data)
      break
    case 'get_affected_scores':
      content = buildAffectedScores(
        args.neighborhood as string | undefined,
        Math.min(Number(args.limit) || 10, 79),
        data,
      )
      break
    default:
      content = { error: `Unknown data tool: ${toolCall.name}` }
  }

  return {
    toolCallId: toolCall.id,
    name: toolCall.name,
    content: JSON.stringify(content),
  }
}

// ── Builders ────────────────────────────────────────────────

function buildCitySummary(data: ExplorerData) {
  const summary: Record<string, unknown> = {}

  if (data.csbData) {
    const csb = data.csbData
    const topCats = Object.entries(csb.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => ({ category: k, count: v }))
    summary.complaints = {
      year: csb.year,
      total: csb.totalRequests,
      topCategories: topCats,
    }
  } else {
    summary.complaints = 'still loading'
  }

  if (data.crimeData) {
    const crime = data.crimeData
    const topOffenses = Object.entries(crime.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => ({ offense: k, count: v }))
    summary.crime = {
      year: crime.year,
      totalIncidents: crime.totalIncidents,
      totalFelonies: crime.totalFelonies,
      totalFirearms: crime.totalFirearms,
      topOffenses,
    }
  } else {
    summary.crime = 'still loading'
  }

  if (data.vacancyData && data.vacancyData.length > 0) {
    const vac = data.vacancyData
    const avgScore =
      Math.round((vac.reduce((s, p) => s + p.triageScore, 0) / vac.length) * 10) / 10
    const byOwner: Record<string, number> = {}
    for (const p of vac) byOwner[p.owner] = (byOwner[p.owner] ?? 0) + 1
    summary.vacancy = {
      totalProperties: vac.length,
      avgTriageScore: avgScore,
      byOwner,
    }
  } else {
    summary.vacancy = 'still loading'
  }

  if (data.routes || data.stops) {
    summary.transit = {
      routes: data.routes?.length ?? 0,
      stops: data.stops?.features.length ?? 0,
    }
  } else {
    summary.transit = 'still loading'
  }

  if (data.arpaData) {
    const arpa = data.arpaData
    summary.arpa = {
      totalSpent: arpa.totalSpent,
      projectCount: arpa.projects.length,
      transactionCount: arpa.transactionCount,
    }
  } else {
    summary.arpa = 'still loading'
  }

  if (data.demographicsData && Object.keys(data.demographicsData).length > 0) {
    const demoValues = Object.values(data.demographicsData)
    const totalPop = demoValues.reduce((s, d) => s + (d.population['2020'] ?? 0), 0)
    const avgVacancy =
      Math.round(
        (demoValues.reduce((s, d) => s + d.housing.vacancyRate, 0) / demoValues.length) * 10,
      ) / 10
    summary.demographics = {
      totalPopulation2020: totalPop,
      neighborhoodCount: demoValues.length,
      avgHousingVacancyRate: avgVacancy,
    }
  } else {
    summary.demographics = 'still loading'
  }

  if (data.foodDeserts || data.groceryStores) {
    summary.foodAccess = {
      censusTracts: data.foodDeserts?.features.length ?? 0,
      groceryStores: data.groceryStores?.features.length ?? 0,
    }
  } else {
    summary.foodAccess = 'still loading'
  }

  if (data.housingData) {
    summary.housing = {
      acsYear: data.housingData.year,
      cityMedianRent: data.housingData.cityMedianRent,
      cityMedianHomeValue: data.housingData.cityMedianHomeValue,
      neighborhoodCount: Object.keys(data.housingData.neighborhoods).length,
    }
  } else {
    summary.housing = 'still loading'
  }

  if (data.affectedScores && data.affectedScores.length > 0) {
    const scores = data.affectedScores
    const avg = Math.round(scores.reduce((s, a) => s + a.composite, 0) / scores.length)
    summary.affected = {
      neighborhoodsScored: scores.length,
      avgDistress: avg,
      mostDistressed: { name: scores[0].name, score: scores[0].composite },
      leastDistressed: { name: scores[scores.length - 1].name, score: scores[scores.length - 1].composite },
    }
  } else {
    summary.affected = 'still loading'
  }

  return summary
}

function buildNeighborhoodDetail(name: string, data: ExplorerData) {
  if (!name || !data.neighborhoods) {
    return { error: 'Neighborhood data not available' }
  }

  const resolved = resolveNeighborhood(name, data.neighborhoods)
  if (!resolved) {
    return { error: `No neighborhood found matching "${name}"` }
  }

  const metrics = computeNeighborhoodMetrics(resolved.nhdNum, data)
  const result: Record<string, unknown> = {
    name: resolved.name,
    nhdNum: resolved.nhdNum,
  }

  if (metrics) {
    result.compositeScore = metrics.compositeScore
    result.transitScore = metrics.transitScore
    result.complaintScore = metrics.complaintScore
    result.foodScore = metrics.foodScore
    result.vacancyScore = metrics.vacancyScore
    result.totalComplaints = metrics.totalComplaints
    result.stopsNearby = metrics.stopsNearby
    result.totalTrips = metrics.totalTrips
    result.nearestGrocery = isFinite(metrics.nearestGroceryDist)
      ? {
          name: metrics.nearestGroceryName,
          distanceMiles: Math.round(metrics.nearestGroceryDist * 100) / 100,
        }
      : { name: 'N/A', distanceMiles: null }
    result.vacancyCount = metrics.vacancyCount
    result.avgTriageScore = metrics.avgTriageScore
  }

  // Add crime stats if available
  const hoodKey = resolved.nhdNum.padStart(2, '0')
  if (data.crimeData?.neighborhoods[hoodKey]) {
    const crimeStats = data.crimeData.neighborhoods[hoodKey]
    result.crime = {
      total: crimeStats.total,
      felonies: crimeStats.felonies,
      firearmIncidents: crimeStats.firearmIncidents,
      topOffenses: Object.entries(crimeStats.topOffenses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => ({ offense: k, count: v })),
    }
  }

  // Add demographics if available
  if (data.demographicsData?.[hoodKey]) {
    const demo = data.demographicsData[hoodKey]
    result.demographics = {
      population2020: demo.population['2020'] ?? null,
      popChange10to20: demo.popChange10to20,
      housing: demo.housing,
      race: demo.race,
    }
  }

  // Add complaint breakdown if available
  if (data.csbData?.neighborhoods[hoodKey]) {
    const csbStats = data.csbData.neighborhoods[hoodKey]
    result.complaintBreakdown = {
      total: csbStats.total,
      closed: csbStats.closed,
      avgResolutionDays: Math.round(csbStats.avgResolutionDays),
      topCategories: Object.entries(csbStats.topCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => ({ category: k, count: v })),
    }
  }

  // Add housing data if available
  if (data.housingData?.neighborhoods[hoodKey]) {
    const h = data.housingData.neighborhoods[hoodKey]
    result.housing = {
      medianRent: h.medianRent,
      medianHomeValue: h.medianHomeValue,
      tractCount: h.tractCount,
    }
  }

  // Add affected score if available
  if (data.affectedScores) {
    const score = data.affectedScores.find((a) => a.nhdId === hoodKey)
    if (score) {
      result.affectedScore = {
        composite: score.composite,
        crimeScore: score.crimeScore,
        vacancyScore: score.vacancyScore,
        complaintScore: score.complaintScore,
        foodScore: score.foodScore,
        popDeclineScore: score.popDeclineScore,
      }
    }
  }

  return result
}

function buildRankings(
  metric: string,
  order: string,
  limit: number,
  data: ExplorerData,
) {
  type Entry = { name: string; nhdNum: string; value: number }
  const entries: Array<Entry> = []

  switch (metric) {
    case 'complaints': {
      if (!data.csbData) return { error: 'still loading' }
      for (const [id, stats] of Object.entries(data.csbData.neighborhoods)) {
        entries.push({ name: stats.name, nhdNum: id, value: stats.total })
      }
      break
    }
    case 'crime': {
      if (!data.crimeData) return { error: 'still loading' }
      for (const [id, stats] of Object.entries(data.crimeData.neighborhoods)) {
        entries.push({ name: stats.name, nhdNum: id, value: stats.total })
      }
      break
    }
    case 'vacancy': {
      if (!data.vacancyData) return { error: 'still loading' }
      const byHood: Record<string, number> = {}
      for (const p of data.vacancyData) {
        byHood[p.neighborhood] = (byHood[p.neighborhood] ?? 0) + 1
      }
      // Try to map neighborhood names to NHD_NUMs via the GeoJSON
      for (const [hoodName, count] of Object.entries(byHood)) {
        const feature = data.neighborhoods?.features.find(
          (f) => f.properties.NHD_NAME === hoodName,
        )
        entries.push({
          name: hoodName,
          nhdNum: feature
            ? String(feature.properties.NHD_NUM).padStart(2, '0')
            : '',
          value: count,
        })
      }
      break
    }
    case 'population': {
      if (!data.demographicsData) return { error: 'still loading' }
      for (const [id, demo] of Object.entries(data.demographicsData)) {
        entries.push({
          name: demo.name,
          nhdNum: id,
          value: demo.population['2020'] ?? 0,
        })
      }
      break
    }
    case 'vacancyRate': {
      if (!data.demographicsData) return { error: 'still loading' }
      for (const [id, demo] of Object.entries(data.demographicsData)) {
        entries.push({
          name: demo.name,
          nhdNum: id,
          value: Math.round(demo.housing.vacancyRate * 10) / 10,
        })
      }
      break
    }
    case 'popChange': {
      if (!data.demographicsData) return { error: 'still loading' }
      for (const [id, demo] of Object.entries(data.demographicsData)) {
        entries.push({
          name: demo.name,
          nhdNum: id,
          value: Math.round(demo.popChange10to20 * 10) / 10,
        })
      }
      break
    }
    case 'rent': {
      if (!data.housingData) return { error: 'still loading' }
      for (const [id, h] of Object.entries(data.housingData.neighborhoods)) {
        if (h.medianRent != null) {
          entries.push({ name: h.name, nhdNum: id, value: h.medianRent })
        }
      }
      break
    }
    case 'homeValue': {
      if (!data.housingData) return { error: 'still loading' }
      for (const [id, h] of Object.entries(data.housingData.neighborhoods)) {
        if (h.medianHomeValue != null) {
          entries.push({ name: h.name, nhdNum: id, value: h.medianHomeValue })
        }
      }
      break
    }
    case 'distress': {
      if (!data.affectedScores) return { error: 'still loading' }
      for (const s of data.affectedScores) {
        entries.push({ name: s.name, nhdNum: s.nhdId, value: s.composite })
      }
      break
    }
    default:
      return { error: `Unknown metric: ${metric}` }
  }

  entries.sort((a, b) =>
    order === 'asc' ? a.value - b.value : b.value - a.value,
  )

  return {
    metric,
    order,
    results: entries.slice(0, limit).map((e, i) => ({
      rank: i + 1,
      name: e.name,
      nhdNum: e.nhdNum,
      value: e.value,
    })),
  }
}

function buildCategoryBreakdown(
  dataset: string,
  neighborhood: string | undefined,
  data: ExplorerData,
) {
  if (dataset === 'complaints') {
    if (!data.csbData) return { error: 'still loading' }

    if (neighborhood && data.neighborhoods) {
      const resolved = resolveNeighborhood(neighborhood, data.neighborhoods)
      if (!resolved) return { error: `No neighborhood found matching "${neighborhood}"` }
      const hoodKey = resolved.nhdNum.padStart(2, '0')
      const stats = data.csbData.neighborhoods[hoodKey]
      if (!stats) return { error: `No complaint data for ${resolved.name}` }
      return {
        dataset: 'complaints',
        neighborhood: resolved.name,
        total: stats.total,
        categories: Object.entries(stats.topCategories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([k, v]) => ({ category: k, count: v })),
      }
    }

    return {
      dataset: 'complaints',
      total: data.csbData.totalRequests,
      categories: Object.entries(data.csbData.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([k, v]) => ({ category: k, count: v })),
    }
  }

  if (dataset === 'crime') {
    if (!data.crimeData) return { error: 'still loading' }

    if (neighborhood && data.neighborhoods) {
      const resolved = resolveNeighborhood(neighborhood, data.neighborhoods)
      if (!resolved) return { error: `No neighborhood found matching "${neighborhood}"` }
      const hoodKey = resolved.nhdNum.padStart(2, '0')
      const stats = data.crimeData.neighborhoods[hoodKey]
      if (!stats) return { error: `No crime data for ${resolved.name}` }
      return {
        dataset: 'crime',
        neighborhood: resolved.name,
        total: stats.total,
        categories: Object.entries(stats.topOffenses)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([k, v]) => ({ offense: k, count: v })),
      }
    }

    return {
      dataset: 'crime',
      total: data.crimeData.totalIncidents,
      categories: Object.entries(data.crimeData.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([k, v]) => ({ offense: k, count: v })),
    }
  }

  return { error: `Unknown dataset: ${dataset}` }
}

function buildArpaData(category: string | undefined, data: ExplorerData) {
  if (!data.arpaData) return { error: 'still loading' }

  const arpa = data.arpaData
  const result: Record<string, unknown> = {
    totalSpent: arpa.totalSpent,
    projectCount: arpa.projects.length,
    transactionCount: arpa.transactionCount,
    topVendors: arpa.topVendors.slice(0, 10),
    categoryBreakdown: Object.entries(arpa.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ category: k, amount: v })),
  }

  if (category) {
    const matched = Object.keys(arpa.categoryBreakdown).find(
      (k) => k.toLowerCase() === category.toLowerCase(),
    )
    if (matched) {
      const filteredProjects = arpa.projects
        .filter((p) => p.category === matched)
        .slice(0, 15)
      result.filteredCategory = matched
      result.filteredAmount = arpa.categoryBreakdown[matched]
      result.filteredProjects = filteredProjects
    }
  }

  return result
}

function buildFoodAccess(data: ExplorerData) {
  const result: Record<string, unknown> = {}

  if (data.foodDeserts) {
    const tracts = data.foodDeserts.features
    const lilaTracts = tracts.filter((f) => f.properties.lila)
    result.totalTracts = tracts.length
    result.lilaTracts = lilaTracts.length
    result.tractDetails = lilaTracts.slice(0, 15).map((f) => ({
      tractId: f.properties.tract_id,
      name: f.properties.name,
      population: f.properties.pop,
      povertyRate: f.properties.poverty_rate,
      pctNoVehicle: f.properties.pct_no_vehicle,
    }))
  } else {
    result.foodDeserts = 'still loading'
  }

  if (data.groceryStores) {
    result.groceryStoreCount = data.groceryStores.features.length
    result.groceryStores = data.groceryStores.features.slice(0, 15).map((f) => ({
      name: f.properties.name,
      chain: f.properties.chain,
    }))
  } else {
    result.groceryStores = 'still loading'
  }

  return result
}

function buildHousingData(neighborhood: string | undefined, data: ExplorerData) {
  if (!data.housingData) return { error: 'still loading' }

  const h = data.housingData
  const result: Record<string, unknown> = {
    acsYear: h.year,
    cityMedianRent: h.cityMedianRent,
    cityMedianHomeValue: h.cityMedianHomeValue,
    neighborhoodCount: Object.keys(h.neighborhoods).length,
  }

  if (neighborhood && data.neighborhoods) {
    const resolved = resolveNeighborhood(neighborhood, data.neighborhoods)
    if (!resolved) return { error: `No neighborhood found matching "${neighborhood}"` }
    const hoodKey = resolved.nhdNum.padStart(2, '0')
    const nh = h.neighborhoods[hoodKey]
    if (nh) {
      result.neighborhood = {
        name: nh.name,
        nhdNum: hoodKey,
        medianRent: nh.medianRent,
        medianHomeValue: nh.medianHomeValue,
        tractCount: nh.tractCount,
      }
    }
  } else {
    // Return top/bottom by rent
    const byRent = Object.entries(h.neighborhoods)
      .filter(([, v]) => v.medianRent != null)
      .sort((a, b) => (b[1].medianRent ?? 0) - (a[1].medianRent ?? 0))
    const top = Math.min(5, Math.floor(byRent.length / 2))
    result.highestRent = byRent.slice(0, top).map(([id, v]) => ({
      name: v.name, nhdNum: id, medianRent: v.medianRent,
    }))
    result.lowestRent = byRent.slice(-top).reverse().map(([id, v]) => ({
      name: v.name, nhdNum: id, medianRent: v.medianRent,
    }))
  }

  return result
}

function buildAffectedScores(
  neighborhood: string | undefined,
  limit: number,
  data: ExplorerData,
) {
  if (!data.affectedScores || data.affectedScores.length === 0) {
    return { error: 'still loading' }
  }

  const scores = data.affectedScores

  if (neighborhood && data.neighborhoods) {
    const resolved = resolveNeighborhood(neighborhood, data.neighborhoods)
    if (!resolved) return { error: `No neighborhood found matching "${neighborhood}"` }
    const score = scores.find((s) => s.nhdId === resolved.nhdNum.padStart(2, '0'))
    if (!score) return { error: `No affected score for ${resolved.name}` }
    const rank = scores.indexOf(score) + 1
    return {
      neighborhood: score.name,
      nhdNum: score.nhdId,
      rank,
      totalNeighborhoods: scores.length,
      composite: score.composite,
      subScores: {
        crime: score.crimeScore,
        vacancy: score.vacancyScore,
        complaints: score.complaintScore,
        foodAccess: score.foodScore,
        popDecline: score.popDeclineScore,
      },
    }
  }

  const avg = Math.round(scores.reduce((s, a) => s + a.composite, 0) / scores.length)
  return {
    avgDistress: avg,
    totalNeighborhoods: scores.length,
    aboveThreshold50: scores.filter((s) => s.composite >= 50).length,
    rankings: scores.slice(0, limit).map((s, i) => ({
      rank: i + 1,
      name: s.name,
      nhdNum: s.nhdId,
      composite: s.composite,
      crimeScore: s.crimeScore,
      vacancyScore: s.vacancyScore,
      complaintScore: s.complaintScore,
      foodScore: s.foodScore,
      popDeclineScore: s.popDeclineScore,
    })),
  }
}
