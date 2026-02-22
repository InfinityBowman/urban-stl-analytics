import { Card } from './Card'

const neighborhoods = [
  { name: 'Downtown', waitDays: 12, outflow: 'low', x: 50, y: 30 },
  { name: 'Central West End', waitDays: 8, outflow: 'low', x: 70, y: 25 },
  { name: 'Tower Grove S', waitDays: 15, outflow: 'medium', x: 55, y: 55 },
  { name: 'Grand Center', waitDays: 18, outflow: 'medium', x: 45, y: 35 },
  { name: 'North St. Louis', waitDays: 28, outflow: 'high', x: 40, y: 15 },
  { name: 'The Ville', waitDays: 24, outflow: 'high', x: 50, y: 20 },
  { name: 'Gravois Park', waitDays: 22, outflow: 'high', x: 50, y: 50 },
  { name: 'Carondelet', waitDays: 10, outflow: 'low', x: 55, y: 75 },
  { name: 'Baden', waitDays: 26, outflow: 'high', x: 60, y: 10 },
  { name: 'Dutchtown', waitDays: 20, outflow: 'medium', x: 55, y: 60 },
  { name: 'Shaw', waitDays: 11, outflow: 'low', x: 55, y: 45 },
  { name: 'Soulard', waitDays: 9, outflow: 'low', x: 60, y: 40 },
]

export function InfrastructureCard() {
  const highOutflow = neighborhoods.filter((n) => n.waitDays >= 20).length

  return (
    <Card
      title="Infrastructure"
      subtitle="311 Resolution Time Impact"
      highlight={`${highOutflow} areas`}
      highlightLabel="with 20+ day waits"
      accent="red"
    >
      <div className="relative h-40 overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="text-muted-foreground">
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {neighborhoods.map((n) => {
          const intensity = Math.min(n.waitDays / 30, 1)
          const color =
            n.outflow === 'high'
              ? `rgba(239, 68, 68, ${intensity * 0.8})`
              : n.outflow === 'medium'
                ? `rgba(251, 146, 60, ${intensity * 0.6})`
                : `rgba(34, 197, 94, ${intensity * 0.4})`

          return (
            <div
              key={n.name}
              className="absolute flex items-center justify-center"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: `${Math.max(8, n.waitDays)}px`,
                  height: `${Math.max(8, n.waitDays)}px`,
                  background: color,
                  boxShadow: `0 0 ${intensity * 15}px ${color}`,
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[0.55rem] text-muted-foreground">
              High outflow
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-[0.55rem] text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[0.55rem] text-muted-foreground">Low</span>
          </div>
        </div>
        <div className="rounded bg-red-500/20 px-2 py-0.5 text-[0.6rem] font-semibold text-red-400">
          Correlation detected
        </div>
      </div>
    </Card>
  )
}
