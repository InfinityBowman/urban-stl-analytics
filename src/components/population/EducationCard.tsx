import { Card } from './Card'

const schoolAgeData = [
  { year: 2010, population: 87200 },
  { year: 2012, population: 81500 },
  { year: 2014, population: 74300 },
  { year: 2016, population: 72100 },
  { year: 2018, population: 69800 },
  { year: 2020, population: 68200 },
  { year: 2022, population: 65400 },
  { year: 2024, population: 65200 },
]

export function EducationCard() {
  const maxPop = Math.max(...schoolAgeData.map((d) => d.population))
  const minPop = Math.min(...schoolAgeData.map((d) => d.population))
  const decline = (((maxPop - minPop) / maxPop) * 100).toFixed(0)

  return (
    <Card
      title="Education"
      subtitle="School-Age Population Decline"
      highlight={`-${decline}%`}
      highlightLabel="since 2010"
      accent="blue"
    >
      <div className="flex h-40 flex-col justify-end">
        <div className="relative flex h-32 items-end justify-between gap-1">
          {schoolAgeData.map((d, i) => {
            const height = (d.population / maxPop) * 100
            return (
              <div
                key={d.year}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                  style={{ height: `${height}%` }}
                />
                {i % 2 === 0 && (
                  <span className="text-[0.55rem] text-muted-foreground">
                    {d.year}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-blue-500/10 px-3 py-2">
        <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-blue-400">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 5v2M8 10v1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Primary Driver: School District Boundaries
        </div>
        <p className="mt-1 text-[0.6rem] text-muted-foreground">
          Families with school-age children relocating to county districts for
          perceived better schools.
        </p>
      </div>
    </Card>
  )
}
