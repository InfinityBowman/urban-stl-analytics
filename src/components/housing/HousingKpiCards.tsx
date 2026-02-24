import type { HousingData } from '@/lib/types'

interface HousingKpiCardsProps {
  housing: HousingData
}

export function HousingKpiCards({ housing }: HousingKpiCardsProps) {
  const nhdCount = Object.keys(housing.neighborhoods).length
  const withData = Object.values(housing.neighborhoods).filter(
    (n) => n.medianRent || n.medianHomeValue,
  ).length

  const kpis = [
    {
      label: 'City Median Rent',
      value: housing.cityMedianRent ? `$${housing.cityMedianRent.toLocaleString()}` : 'N/A',
    },
    {
      label: 'City Median Home Value',
      value: housing.cityMedianHomeValue
        ? `$${housing.cityMedianHomeValue.toLocaleString()}`
        : 'N/A',
    },
    { label: 'Neighborhoods', value: String(nhdCount) },
    { label: 'With Data', value: String(withData) },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-lg bg-muted px-3 py-2">
          <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {k.label}
          </div>
          <div className="text-lg font-bold">{k.value}</div>
        </div>
      ))}
    </div>
  )
}
