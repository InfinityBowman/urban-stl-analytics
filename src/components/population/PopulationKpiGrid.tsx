import type { NeighborhoodDemographics } from '@/lib/types'

interface PopulationKpiGridProps {
  demographics: Record<string, NeighborhoodDemographics>
}

export function PopulationKpiGrid({ demographics }: PopulationKpiGridProps) {
  const hoods = Object.values(demographics)
  const totalPop = hoods.reduce((s, h) => s + (h.population['2020'] ?? 0), 0)
  const totalUnits = hoods.reduce((s, h) => s + h.housing.totalUnits, 0)
  const totalVacant = hoods.reduce((s, h) => s + h.housing.vacant, 0)
  const avgVacancy = totalUnits > 0 ? ((totalVacant / totalUnits) * 100).toFixed(1) : '0'
  const growing = hoods.filter((h) => h.popChange10to20 > 0).length
  const declining = hoods.filter((h) => h.popChange10to20 < 0).length

  const kpis = [
    { label: 'Total Population', value: totalPop.toLocaleString() },
    { label: 'Avg Vacancy Rate', value: `${avgVacancy}%` },
    { label: 'Growing', value: String(growing), sub: 'neighborhoods' },
    { label: 'Declining', value: String(declining), sub: 'neighborhoods' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-lg bg-muted px-3 py-2">
          <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {k.label}
          </div>
          <div className="text-lg font-bold">{k.value}</div>
          {k.sub && (
            <div className="text-[0.55rem] text-muted-foreground">{k.sub}</div>
          )}
        </div>
      ))}
    </div>
  )
}
