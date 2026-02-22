import { Card } from './Card'
import {
  vacancyHotspots,
  violentCrimeTrend,
  cityVsCountyComparison,
} from '@/lib/migration-data'
import { cn } from '@/lib/utils'

export function InfrastructureCard({ className }: { className?: string }) {
  const latestCrime = violentCrimeTrend[violentCrimeTrend.length - 1]
  const highVacancyHoods = vacancyHotspots.filter((v) => v.rate >= 30).length

  return (
    <div className={cn(className)}>
      <Card
        title="Push Factors"
        subtitle="Crime, Vacancy & Service Gaps"
        highlight={`${latestCrime.city}`}
        highlightLabel="violent crimes/100k"
        accent="red"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Crime Rate Comparison
            </div>
            <div className="flex h-24 items-end gap-4">
              <div className="flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-red-600 to-red-400"
                  style={{
                    height: `${(cityVsCountyComparison.city.crimeRate / 100) * 100}%`,
                  }}
                />
                <span className="mt-1 text-[0.55rem] font-semibold text-red-400">
                  {cityVsCountyComparison.city.crimeRate}
                </span>
                <span className="text-[0.5rem] text-muted-foreground">
                  City
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400"
                  style={{
                    height: `${(cityVsCountyComparison.county.crimeRate / 100) * 100}%`,
                  }}
                />
                <span className="mt-1 text-[0.55rem] font-semibold text-emerald-400">
                  {cityVsCountyComparison.county.crimeRate}
                </span>
                <span className="text-[0.5rem] text-muted-foreground">
                  County
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400"
                  style={{ height: `${(latestCrime.national / 100) * 100}%` }}
                />
                <span className="mt-1 text-[0.55rem] font-semibold text-blue-400">
                  {latestCrime.national}
                </span>
                <span className="text-[0.5rem] text-muted-foreground">
                  US Avg
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Vacancy Hotspots
            </div>
            <div className="flex flex-col gap-1">
              {vacancyHotspots.slice(0, 4).map((hood) => (
                <div
                  key={hood.neighborhood}
                  className="flex items-center gap-2"
                >
                  <span className="w-24 truncate text-[0.55rem]">
                    {hood.neighborhood}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 rounded bg-muted/50">
                      <div
                        className="h-full rounded bg-red-500"
                        style={{ width: `${hood.rate}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-[0.55rem] tabular-nums text-red-400">
                    {hood.rate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted px-2.5 py-1.5 text-center">
            <div className="text-sm font-bold text-red-400">
              {cityVsCountyComparison.city.vacantProperties.toLocaleString()}
            </div>
            <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Vacant Properties
            </div>
          </div>
          <div className="rounded-lg bg-muted px-2.5 py-1.5 text-center">
            <div className="text-sm font-bold text-orange-400">
              {cityVsCountyComparison.city.schoolRating}
            </div>
            <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Avg School Rating
            </div>
          </div>
          <div className="rounded-lg bg-muted px-2.5 py-1.5 text-center">
            <div className="text-sm font-bold text-purple-400">
              {cityVsCountyComparison.city.propertyTaxRate}%
            </div>
            <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Property Tax Rate
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
          <div className="text-[0.6rem] font-semibold text-red-400">
            {highVacancyHoods} neighborhoods with 30%+ vacancy rate
          </div>
          <p className="mt-0.5 text-[0.55rem] text-muted-foreground">
            High vacancy correlates with slower 311 response times and increased
            domestic outflow.
          </p>
        </div>
      </Card>
    </div>
  )
}
