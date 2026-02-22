import { Card } from './Card'

const vitalStats = [
  { year: 2015, births: 9850, deaths: 9200 },
  { year: 2016, births: 9400, deaths: 9350 },
  { year: 2017, births: 9100, deaths: 9500 },
  { year: 2018, births: 8800, deaths: 9650 },
  { year: 2019, births: 8600, deaths: 9800 },
  { year: 2020, births: 8200, deaths: 10200 },
  { year: 2021, births: 7900, deaths: 10500 },
  { year: 2022, births: 7700, deaths: 10700 },
  { year: 2023, births: 7500, deaths: 10800 },
  { year: 2024, births: 7300, deaths: 10900 },
]

const projections = [
  { year: 2025, births: 7100, deaths: 11000 },
  { year: 2026, births: 6900, deaths: 11100 },
  { year: 2027, births: 6700, deaths: 11200 },
  { year: 2028, births: 6500, deaths: 11300 },
  { year: 2029, births: 6200, deaths: 11400 },
]

export function DemographicsCard() {
  const maxValue = Math.max(
    ...vitalStats.map((d) => Math.max(d.births, d.deaths)),
  )

  return (
    <Card
      title="Demographics"
      subtitle="Demographic Winter"
      highlight="Natural Decrease"
      highlightLabel="Deaths exceed Births"
      accent="orange"
    >
      <div className="flex h-40 flex-col justify-end">
        <div className="relative flex h-32 items-end justify-between gap-0.5">
          {[...vitalStats, ...projections].map((d, i) => {
            const isProjection = i >= vitalStats.length
            return (
              <div
                key={d.year}
                className="flex flex-1 flex-col items-center gap-0.5"
              >
                <div className="relative flex w-full gap-px">
                  <div
                    className={`w-1/2 rounded-t ${isProjection ? 'bg-emerald-400/40 border-t border-dashed border-emerald-400' : 'bg-gradient-to-t from-emerald-600 to-emerald-400'}`}
                    style={{ height: `${(d.births / maxValue) * 100}px` }}
                  />
                  <div
                    className={`w-1/2 rounded-t ${isProjection ? 'bg-red-400/40 border-t border-dashed border-red-400' : 'bg-gradient-to-t from-red-600 to-red-400'}`}
                    style={{ height: `${(d.deaths / maxValue) * 100}px` }}
                  />
                </div>
                {d.year % 2 === 0 && (
                  <span
                    className={`text-[0.5rem] ${isProjection ? 'text-orange-400' : 'text-muted-foreground'}`}
                  >
                    {d.year}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-emerald-500" />
            <span className="text-[0.55rem] text-muted-foreground">Births</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-red-500" />
            <span className="text-[0.55rem] text-muted-foreground">Deaths</span>
          </div>
        </div>
        <div className="rounded bg-orange-500/20 px-2 py-0.5 text-[0.6rem] font-semibold text-orange-400">
          {'<'}20K births projected by 2029
        </div>
      </div>
    </Card>
  )
}
