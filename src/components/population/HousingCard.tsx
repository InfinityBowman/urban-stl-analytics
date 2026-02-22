import { Card } from './Card'

const housingData = [
  { type: 'Studio', luxury: 2850, affordable: 720 },
  { type: '1-Bed', luxury: 3420, affordable: 850 },
  { type: '2-Bed', luxury: 2100, affordable: 1280 },
  { type: '3+ Bed', luxury: 650, affordable: 420 },
]

export function HousingCard() {
  const maxUnits = Math.max(
    ...housingData.flatMap((d) => [d.luxury, d.affordable]),
  )

  return (
    <Card
      title="Housing"
      subtitle="Unit Supply by Bedroom Count"
      highlight="Critical Shortage"
      highlightLabel="3+ Bedroom Family Homes"
      accent="purple"
    >
      <div className="flex h-40 flex-col justify-end">
        <div className="flex h-32 items-end justify-around gap-4">
          {housingData.map((d) => (
            <div key={d.type} className="flex flex-col items-center gap-1">
              <div className="flex items-end gap-1">
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 rounded-t bg-gradient-to-t from-purple-600 to-purple-400"
                    style={{ height: `${(d.luxury / maxUnits) * 80}px` }}
                  />
                  <span className="mt-0.5 text-[0.5rem] tabular-nums text-purple-400">
                    {d.luxury}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400"
                    style={{ height: `${(d.affordable / maxUnits) * 80}px` }}
                  />
                  <span className="mt-0.5 text-[0.5rem] tabular-nums text-emerald-400">
                    {d.affordable}
                  </span>
                </div>
              </div>
              <span className="text-[0.55rem] text-muted-foreground">
                {d.type}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-purple-500" />
            <span className="text-[0.55rem] text-muted-foreground">Luxury</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-emerald-500" />
            <span className="text-[0.55rem] text-muted-foreground">
              Affordable
            </span>
          </div>
        </div>
        <div className="rounded bg-red-500/20 px-2 py-0.5 text-[0.6rem] font-semibold text-red-400">
          High vs Critical
        </div>
      </div>
    </Card>
  )
}
