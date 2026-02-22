import { Card } from './Card'
import {
  schoolEnrollmentDecline,
  cityVsCountyComparison,
} from '@/lib/migration-data'

export function EducationCard() {
  const maxTotal = Math.max(...schoolEnrollmentDecline.map((d) => d.total))
  const earliestTotal = schoolEnrollmentDecline[0].total
  const latestTotal =
    schoolEnrollmentDecline[schoolEnrollmentDecline.length - 1].total
  const decline = (
    ((earliestTotal - latestTotal) / earliestTotal) *
    100
  ).toFixed(0)

  return (
    <Card
      title="Education"
      subtitle="K-12 Enrollment Decline"
      highlight={`-${decline}%`}
      highlightLabel="since 2010"
      accent="blue"
    >
      <div className="flex h-32 items-end justify-between gap-1">
        {schoolEnrollmentDecline.map((d, i) => {
          const slpsHeight = (d.slps / maxTotal) * 100
          const charterHeight = (d.charter / maxTotal) * 100
          return (
            <div
              key={d.year}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div className="flex w-full flex-col items-stretch">
                <div
                  className="w-full rounded-t bg-orange-500"
                  style={{ height: `${charterHeight}px` }}
                />
                <div
                  className="w-full bg-blue-500"
                  style={{ height: `${slpsHeight}px` }}
                />
              </div>
              <span className={`text-[0.5rem] text-muted-foreground ${i % 2 !== 0 ? 'invisible' : ''}`}>
                {d.year}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-blue-500" />
            <span className="text-[0.55rem] text-muted-foreground">SLPS</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-orange-500" />
            <span className="text-[0.55rem] text-muted-foreground">
              Charter
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2">
        <div className="text-[0.6rem] font-semibold text-blue-400">
          Primary Driver: School Ratings
        </div>
        <p className="mt-0.5 text-[0.55rem] text-muted-foreground">
          City schools average {cityVsCountyComparison.city.schoolRating}/10 vs
          county {cityVsCountyComparison.county.schoolRating}/10
        </p>
      </div>
    </Card>
  )
}
