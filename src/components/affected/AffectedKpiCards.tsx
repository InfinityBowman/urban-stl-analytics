import type { AffectedScore } from '@/lib/types'

interface AffectedKpiCardsProps {
  scores: AffectedScore[]
}

export function AffectedKpiCards({ scores }: AffectedKpiCardsProps) {
  const highDistress = scores.filter((s) => s.composite >= 60).length
  const moderate = scores.filter((s) => s.composite >= 30 && s.composite < 60).length
  const avgScore = scores.length
    ? Math.round(scores.reduce((s, r) => s + r.composite, 0) / scores.length)
    : 0
  const foodDeserts = scores.filter((s) => s.foodScore > 0).length

  const kpis = [
    { label: 'High Distress', value: String(highDistress), color: 'text-red-400' },
    { label: 'Moderate', value: String(moderate), color: 'text-amber-400' },
    { label: 'Avg Score', value: String(avgScore), color: 'text-foreground' },
    { label: 'Food Deserts', value: String(foodDeserts), color: 'text-orange-400' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-lg bg-muted px-3 py-2">
          <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {k.label}
          </div>
          <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
        </div>
      ))}
    </div>
  )
}
