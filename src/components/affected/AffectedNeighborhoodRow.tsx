import { useState } from 'react'
import type { AffectedScore } from '@/lib/types'

interface AffectedNeighborhoodRowProps {
  score: AffectedScore
  rank: number
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[0.6rem] text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-current"
          style={{
            width: `${value}%`,
            color:
              value >= 60
                ? 'var(--color-destructive, #ef4444)'
                : value >= 30
                  ? '#f59e0b'
                  : '#22c55e',
          }}
        />
      </div>
      <span className="w-7 text-right text-[0.6rem] tabular-nums text-muted-foreground">
        {value}
      </span>
    </div>
  )
}

export function AffectedNeighborhoodRow({ score, rank }: AffectedNeighborhoodRowProps) {
  const [expanded, setExpanded] = useState(false)

  const compositeColor =
    score.composite >= 60
      ? 'text-red-400'
      : score.composite >= 30
        ? 'text-amber-400'
        : 'text-emerald-400'

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50"
      >
        <span className="w-6 text-xs font-bold text-muted-foreground tabular-nums">
          #{rank}
        </span>
        <span className="flex-1 text-sm font-medium">{score.name}</span>
        <span className={`text-sm font-bold tabular-nums ${compositeColor}`}>
          {score.composite}
        </span>
        <span className="text-xs text-muted-foreground">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>
      {expanded && (
        <div className="space-y-1 px-3 pb-3 pt-1">
          <ScoreBar label="Crime" value={score.crimeScore} />
          <ScoreBar label="Vacancy" value={score.vacancyScore} />
          <ScoreBar label="Complaints" value={score.complaintScore} />
          <ScoreBar label="Food Access" value={score.foodScore} />
          <ScoreBar label="Pop Decline" value={score.popDeclineScore} />
        </div>
      )}
    </div>
  )
}
