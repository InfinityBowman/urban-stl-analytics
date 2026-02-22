import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { scoreColor } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { DetailRow, DetailSection, ScoreBar, MetricCard } from './shared'

const useLabels: Record<string, string> = {
  housing: 'Affordable Housing',
  solar: 'Solar Installation',
  garden: 'Community Garden',
}

const conditionLabels: Record<number, string> = {
  1: 'Condemned',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Excellent',
}

const ownerLabels: Record<string, string> = {
  LRA: 'Land Reutilization Authority',
  CITY: 'City of St. Louis',
  PRIVATE: 'Private Owner',
}

const conditionColors: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-red-400',
  3: 'text-amber-500',
  4: 'text-emerald-400',
  5: 'text-emerald-500',
}

export function VacancyDetail({ id }: { id: number }) {
  const data = useData()

  const property = useMemo(
    () => data.vacancyData?.find((p) => p.id === id) ?? null,
    [data.vacancyData, id],
  )

  if (!property) {
    return (
      <div className="text-xs text-muted-foreground">Property not found</div>
    )
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Address */}
      <div className="text-base font-bold">{property.address}</div>

      {/* Key metrics */}
      <div className="flex gap-2">
        <MetricCard
          label="Triage"
          value={property.triageScore}
          subtext="/100"
          colorHex={scoreColor(property.triageScore)}
        />
        <MetricCard
          label="Condition"
          value={conditionLabels[property.conditionRating] || '—'}
          color={conditionColors[property.conditionRating]}
        />
      </div>

      {/* Best use badge */}
      <div>
        <span
          className={cn(
            'inline-block rounded-full px-3 py-1 text-[0.65rem] font-bold',
            property.bestUse === 'housing' &&
              'bg-blue-500/15 text-blue-600 dark:text-blue-400',
            property.bestUse === 'solar' &&
              'bg-amber-500/15 text-amber-600 dark:text-amber-400',
            property.bestUse === 'garden' &&
              'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
          )}
        >
          {useLabels[property.bestUse]}
        </span>
      </div>

      {/* Property info */}
      <DetailSection title="Property Details" color="text-amber-400">
        <DetailRow
          label="Type"
          value={
            property.propertyType === 'building'
              ? 'Vacant Building'
              : 'Vacant Lot'
          }
        />
        <DetailRow label="Neighborhood" value={property.neighborhood} />
        {property.propertyType === 'building' && (
          <>
            <DetailRow label="Year Built" value={String(property.yearBuilt)} />
            <DetailRow label="Stories" value={String(property.stories)} />
            <DetailRow label="Board-Up" value={property.boardUpStatus} />
          </>
        )}
        <DetailRow
          label="Lot Size"
          value={`${property.lotSqFt.toLocaleString()} sq ft`}
        />
        <DetailRow label="Zoning" value={property.zoning} />
      </DetailSection>

      {/* Ownership */}
      <DetailSection title="Ownership & Value" color="text-muted-foreground">
        <DetailRow label="Owner" value={ownerLabels[property.owner]} />
        <DetailRow label="Parcel ID" value={property.parcelId} />
        <DetailRow
          label="Tax Delinquent"
          value={`${property.taxYearsDelinquent} yr${property.taxYearsDelinquent !== 1 ? 's' : ''}`}
        />
        <DetailRow
          label="Assessed Value"
          value={`$${property.assessedValue.toLocaleString()}`}
        />
      </DetailSection>

      {/* Activity */}
      <DetailSection title="Activity" color="text-indigo-400">
        <DetailRow label="Violations" value={String(property.violationCount)} />
        <DetailRow
          label="311 Complaints"
          value={`${property.complaintsNearby} nearby`}
        />
      </DetailSection>

      {/* Score breakdown */}
      <DetailSection title="Score Breakdown" color="text-amber-400">
        {Object.entries(property.scoreBreakdown).map(([key, val]) => (
          <div key={key} className="py-1">
            <ScoreBar label={key.charAt(0).toUpperCase() + key.slice(1)} score={val} />
          </div>
        ))}
      </DetailSection>

      {/* Recent complaints */}
      {property.recentComplaints.length > 0 && (
        <DetailSection title="Recent 311 Complaints" color="text-indigo-400">
          {property.recentComplaints.map((c, i) => (
            <div key={i} className="py-1.5 text-[0.7rem]">
              <span className="text-muted-foreground">{c.date}</span>
              <span className="mx-1.5 text-border">|</span>
              {c.category}
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold',
                  c.status === 'Open'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                )}
              >
                {c.status}
              </span>
            </div>
          ))}
        </DetailSection>
      )}
    </div>
  )
}
