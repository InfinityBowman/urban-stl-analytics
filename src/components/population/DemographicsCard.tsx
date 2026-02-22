import { Card } from './Card'
import { annualMigration, householdIncomeByYear } from '@/lib/migration-data'

export function DemographicsCard() {
  const latestMigration = annualMigration[annualMigration.length - 1]
  const maxNetChange = Math.max(
    ...annualMigration.map((d) => Math.abs(d.netChange)),
  )
  const latestIncome = householdIncomeByYear[householdIncomeByYear.length - 1]

  return (
    <Card
      title="Demographics"
      subtitle="Migration & Income Gap"
      highlight={`${latestMigration.netChange}`}
      highlightLabel="net change 2024"
      accent="orange"
    >
      <div className="flex h-32 items-end justify-between gap-0.5">
        {annualMigration.map((d, i) => {
          const barHeight = (Math.abs(d.netChange) / maxNetChange) * 100
          const isPositive = d.netChange > 0
          return (
            <div
              key={d.year}
              className="flex flex-1 flex-col items-center gap-0.5"
            >
              <div
                className={`w-full rounded-t ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ height: `${barHeight}px` }}
              />
              <span className={`text-[0.5rem] text-muted-foreground ${i % 2 !== 0 ? 'invisible' : ''}`}>
                {d.year}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted px-2.5 py-1.5 text-center">
          <div className="text-sm font-bold text-red-400">
            {latestMigration.domesticOutflow.toLocaleString()}
          </div>
          <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Domestic Out
          </div>
        </div>
        <div className="rounded-lg bg-muted px-2.5 py-1.5 text-center">
          <div className="text-sm font-bold text-emerald-400">
            +{latestMigration.internationalInflow.toLocaleString()}
          </div>
          <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Int'l In
          </div>
        </div>
        <div className="rounded-lg bg-muted px-2.5 py-1.5 text-center">
          <div className="text-sm font-bold text-orange-400">
            {latestMigration.netChange}
          </div>
          <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Net
          </div>
        </div>
      </div>
      <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[0.6rem] font-semibold text-orange-400">
              Income Gap Persists
            </div>
            <p className="text-[0.55rem] text-muted-foreground">
              City: ${latestIncome.city.toLocaleString()} vs Metro: $
              {latestIncome.metro.toLocaleString()}
            </p>
          </div>
          <div className="text-right text-[0.55rem] text-muted-foreground">
            {Math.round(
              ((latestIncome.metro - latestIncome.city) / latestIncome.metro) *
                100,
            )}
            % gap
          </div>
        </div>
      </div>
    </Card>
  )
}
