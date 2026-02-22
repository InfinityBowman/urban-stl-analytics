import type { ReactNode } from 'react'

interface CardProps {
  title: string
  subtitle?: string
  highlight?: string
  highlightLabel?: string
  accent?: 'blue' | 'orange' | 'purple' | 'red'
  children: ReactNode
}

const accentColors = {
  blue: '#4f6ef7',
  orange: '#f97316',
  purple: '#a855f7',
  red: '#ef4444',
}

const highlightTextColors = {
  blue: 'text-blue-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
}

export function Card({
  title,
  subtitle,
  highlight,
  highlightLabel,
  accent = 'blue',
  children,
}: CardProps) {
  return (
    <div className="relative rounded-xl border border-border/60 bg-card p-4">
      <div
        className="absolute top-3 bottom-3 left-0 w-[3px] rounded-full"
        style={{ background: accentColors[accent] }}
      />
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-[0.65rem] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {highlight && (
          <div className="text-right">
            <div
              className={`text-lg font-extrabold tabular-nums ${highlightTextColors[accent]}`}
            >
              {highlight}
            </div>
            {highlightLabel && (
              <div className="text-[0.55rem] text-muted-foreground">
                {highlightLabel}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
