import { cn } from '@/lib/utils'

export function DetailRow({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('flex justify-between py-1.5', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[55%] text-right font-medium">{value}</span>
    </div>
  )
}

export function DetailSection({
  title,
  color,
  children,
}: {
  title: string
  color?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <div
        className={cn(
          'mb-1 text-[0.65rem] font-bold uppercase tracking-wider',
          color || 'text-muted-foreground',
        )}
      >
        {title}
      </div>
      <div className="flex flex-col divide-y divide-border/30">{children}</div>
    </div>
  )
}

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70
      ? 'bg-emerald-500'
      : score >= 40
        ? 'bg-amber-500'
        : 'bg-red-500'
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[0.65rem]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-background/80">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            color,
          )}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  )
}

export function MetricCard({
  label,
  value,
  subtext,
  color,
  colorHex,
}: {
  label: string
  value: string | number
  subtext?: string
  color?: string
  colorHex?: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-lg bg-muted/60 px-2 py-2.5">
      <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'text-lg font-extrabold tabular-nums leading-tight',
          !colorHex && (color || 'text-foreground'),
        )}
        style={colorHex ? { color: colorHex } : undefined}
      >
        {value}
      </div>
      {subtext && (
        <div className="text-[0.55rem] text-muted-foreground">{subtext}</div>
      )}
    </div>
  )
}
