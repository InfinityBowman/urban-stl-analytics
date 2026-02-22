import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { EducationCard } from './EducationCard'
import { DemographicsCard } from './DemographicsCard'
import { HousingCard } from './HousingCard'
import { InfrastructureCard } from './InfrastructureCard'
import { MigrationReasonsCard } from './MigrationReasonsCard'
import { DestinationsCard } from './DestinationsCard'
import { PopulationHistoryChart } from './PopulationHistoryChart'
import { MigrationFlowChart } from './MigrationFlowChart'
import {
  getPopulationStats,
  decadeSummaries,
  keyMilestones,
} from '@/lib/population-history'
import { cn } from '@/lib/utils'

type TabView = 'overview' | 'history' | 'migration'

export function PopulationDashboard() {
  const [activeTab, setActiveTab] = useState<TabView>('overview')

  return (
    <div className="flex flex-col">
      <div className="border-b border-border/60 bg-card px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              STL Population: The Exodus & The Offset
            </h1>
            <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
              Understanding the drivers of population change in St. Louis
            </p>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {(['overview', 'history', 'migration'] as TabView[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1 text-[0.65rem] font-medium transition-colors capitalize',
                  activeTab === tab
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'migration' && <MigrationTab />}
      </div>

      <div className="border-t border-border/60 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-[0.6rem] text-muted-foreground">
            Data sources: US Census Bureau (1790-2024), IRS Migration Data,
            SLPS, SLMPD, Missouri Dept. of Education
          </div>
          <Link
            to="/"
            search={{ highlight: 'outflow' }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[0.65rem] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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

function OverviewTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MigrationReasonsCard />
        <EducationCard />
        <DemographicsCard />
        <HousingCard />
        <InfrastructureCard className="lg:col-span-2" />
      </div>
      <div className="flex flex-col gap-4">
        <DestinationsCard />
        <QuickStats />
      </div>
    </div>
  )
}

function HistoryTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <PopulationHistoryChart />
        <DecadeBreakdown />
      </div>
      <div className="space-y-4">
        <QuickStats />
        <KeyMilestones />
      </div>
    </div>
  )
}

function MigrationTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MigrationFlowChart />
      <MigrationReasonsCard />
      <DestinationsCard />
      <QuickStats />
    </div>
  )
}

function QuickStats() {
  const stats = getPopulationStats()

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-emerald-400">
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
        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
          International Migration Offset
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-emerald-500/10 px-2.5 py-2 text-center">
          <div className="text-lg font-extrabold tabular-nums text-emerald-400">
            +{stats.current.year === 2024 ? '4,125' : '3,475'}
          </div>
          <div className="text-[0.55rem] text-muted-foreground">
            Int'l inflow/yr
          </div>
        </div>
        <div className="rounded-lg bg-red-500/10 px-2.5 py-2 text-center">
          <div className="text-lg font-extrabold tabular-nums text-red-400">
            -4,850
          </div>
          <div className="text-[0.55rem] text-muted-foreground">
            Domestic outflow/yr
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted px-2.5 py-1.5">
          <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Peak ({stats.peak.year})
          </div>
          <div className="text-sm font-bold">
            {stats.peak.population.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-muted px-2.5 py-1.5">
          <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Current
          </div>
          <div className="text-sm font-bold">
            {stats.current.population.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-center">
        <span className="text-sm font-bold text-red-400">
          -{stats.declinePercent}%
        </span>
        <span className="ml-1.5 text-[0.55rem] text-muted-foreground">
          decline from peak ({stats.yearsSincePeak} years)
        </span>
      </div>
    </div>
  )
}

function DecadeBreakdown() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="mb-3 text-sm font-bold">Decade Summary</h3>
      <div className="space-y-2">
        {decadeSummaries
          .slice()
          .reverse()
          .map((decade) => (
            <div
              key={decade.decade}
              className={cn(
                'flex items-center gap-3 rounded-lg p-2',
                decade.change < 0 ? 'bg-red-500/5' : 'bg-emerald-500/5',
              )}
            >
              <div className="w-14 text-[0.65rem] font-semibold">
                {decade.decade}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded bg-muted/50">
                    <div
                      className={cn(
                        'h-full rounded',
                        decade.change < 0 ? 'bg-red-500' : 'bg-emerald-500',
                      )}
                      style={{
                        width: `${Math.min(Math.abs(decade.changePercent), 100)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      'w-16 text-right text-[0.6rem] font-semibold tabular-nums',
                      decade.change < 0 ? 'text-red-400' : 'text-emerald-400',
                    )}
                  >
                    {decade.change > 0 ? '+' : ''}
                    {decade.changePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-0.5 text-[0.55rem] text-muted-foreground">
                  {decade.keyEvents.slice(0, 2).join(' . ')}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

function KeyMilestones() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="mb-3 text-sm font-bold">Key Milestones</h3>
      <div className="space-y-2">
        {keyMilestones.slice(-8).map((m) => (
          <div key={m.year} className="flex gap-2">
            <div className="w-10 shrink-0 text-[0.6rem] font-semibold text-primary">
              {m.year}
            </div>
            <div className="text-[0.6rem] text-muted-foreground">{m.event}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
