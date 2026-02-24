import { useMemo, useState } from 'react'
import type { NeighborhoodDemographics } from '@/lib/types'

interface PopulationChangeTableProps {
  demographics: Record<string, NeighborhoodDemographics>
}

type SortKey = 'name' | 'pop2020' | 'pop2010' | 'change'
type SortDir = 'asc' | 'desc'

export function PopulationChangeTable({ demographics }: PopulationChangeTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('change')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(() => {
    const entries = Object.entries(demographics).map(([id, d]) => ({
      id,
      name: d.name,
      pop2020: d.population['2020'] ?? 0,
      pop2010: d.population['2010'] ?? 0,
      change: d.popChange10to20,
    }))

    entries.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc'
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number)
    })

    return entries
  }, [demographics, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''

  return (
    <div className="max-h-[500px] overflow-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted text-muted-foreground">
          <tr>
            <th
              className="cursor-pointer px-3 py-2 text-left font-semibold"
              onClick={() => toggleSort('name')}
            >
              Neighborhood{arrow('name')}
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-right font-semibold"
              onClick={() => toggleSort('pop2020')}
            >
              2020 Pop{arrow('pop2020')}
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-right font-semibold"
              onClick={() => toggleSort('pop2010')}
            >
              2010 Pop{arrow('pop2010')}
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-right font-semibold"
              onClick={() => toggleSort('change')}
            >
              Change %{arrow('change')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border hover:bg-muted/50">
              <td className="px-3 py-1.5 font-medium">{r.name}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {r.pop2020.toLocaleString()}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {r.pop2010.toLocaleString()}
              </td>
              <td
                className={`px-3 py-1.5 text-right font-semibold tabular-nums ${
                  r.change > 0
                    ? 'text-emerald-500'
                    : r.change < 0
                      ? 'text-red-400'
                      : 'text-muted-foreground'
                }`}
              >
                {r.change > 0 ? '+' : ''}
                {r.change.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
