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
      <div className="flex h-40 flex-col justify-end">
        <div className="relative flex h-28 items-end justify-between gap-0.5">
          {annualMigration.map((d, i) => {
            const height = (Math.abs(d.netChange) / maxNetChange) * 100
            const isPositive = d.netChange > 0
            return (
              <div
                key={d.year}
                className="flex flex-1 flex-col items-center gap-0.5"
              >
                <div
                  className={`w-full rounded-t ${isPositive ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-red-600 to-red-400'}`}
                  style={{ height: `${height}%` }}
                />
                {i % 2 === 0 && (
                  <span className="text-[0.5rem] text-muted-foreground">
                    {d.year}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-red-500/10 p-2 text-center">
          <div className="text-sm font-bold text-red-400">
            {latestMigration.domesticOutflow.toLocaleString()}
          </div>
          <div className="text-[0.5rem] text-muted-foreground">
            Domestic Out
          </div>
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
          <div className="text-sm font-bold text-emerald-400">
            +{latestMigration.internationalInflow.toLocaleString()}
          </div>
          <div className="text-[0.5rem] text-muted-foreground">Int'l In</div>
        </div>
        <div className="rounded-lg bg-orange-500/10 p-2 text-center">
          <div className="text-sm font-bold text-orange-400">
            {latestMigration.netChange}
          </div>
          <div className="text-[0.5rem] text-muted-foreground">Net</div>
        </div>
      </div>
      <div className="mt-2 rounded-lg bg-orange-500/10 px-3 py-2">
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
