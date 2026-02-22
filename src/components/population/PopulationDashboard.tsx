import { Link } from '@tanstack/react-router'
import { EducationCard } from './EducationCard'
import { DemographicsCard } from './DemographicsCard'
import { HousingCard } from './HousingCard'
import { InfrastructureCard } from './InfrastructureCard'

export function PopulationDashboard() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-border/60 bg-gradient-to-r from-card to-card/50 px-6 py-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          STL Population: The Exodus & The Offset
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Understanding the drivers of population change in St. Louis
        </p>
      </div>

      <div className="relative p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EducationCard />
          <DemographicsCard />
          <HousingCard />
          <InfrastructureCard />
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <MigrationBadge />
        </div>
      </div>

      <div className="border-t border-border/60 bg-muted/30 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            Data sources: US Census Bureau, SLMPD, SLPS, 311 Service Center
          </div>
          <Link
            to="/"
            search={{ highlight: 'outflow' }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 5v3l2 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            See Affected Neighborhoods
          </Link>
        </div>
      </div>
    </div>
  )
}

function MigrationBadge() {
  return (
    <div className="pointer-events-auto flex flex-col items-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/90 to-emerald-900/80 px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-emerald-400/80">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2L14 8L8 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 8H14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        International Migration Offset
      </div>
      <div className="mt-1 text-xl font-extrabold tabular-nums text-emerald-400">
        +12,375
      </div>
      <div className="text-[0.55rem] text-emerald-400/60">
        Preventing total population crash
      </div>
    </div>
  )
}
