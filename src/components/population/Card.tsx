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
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
  orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
  red: 'from-red-500/20 to-red-600/5 border-red-500/20',
}

const highlightColors = {
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
    <div
      className={`rounded-xl border bg-gradient-to-br p-4 ${accentColors[accent]}`}
    >
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
              className={`text-lg font-extrabold tabular-nums ${highlightColors[accent]}`}
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
