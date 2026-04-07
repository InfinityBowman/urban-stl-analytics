import { useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertDiamondIcon,
  Building03Icon,
  Bus01Icon,
  Cancel01Icon,
  Home01Icon,
  Megaphone01Icon,
  Store01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { useShallow } from 'zustand/shallow'
import type { LayerToggles, SubToggles } from '@/lib/explorer-types'
import { useDataStore } from '@/stores/data-store'
import { useExplorerStore } from '@/stores/explorer-store'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

type IconType = typeof Megaphone01Icon

const LAYER_CONFIG: Array<{
  key: keyof LayerToggles
  label: string
  color: string
  desc: string
  icon: IconType
}> = [
  {
    key: 'complaints',
    label: '311 Complaints',
    color: '#4f6ef7',
    desc: 'Complaint density by neighborhood',
    icon: Megaphone01Icon,
  },
  {
    key: 'crime',
    label: 'Crime',
    color: '#f97316',
    desc: 'SLMPD crime incidents',
    icon: AlertDiamondIcon,
  },
  {
    key: 'transit',
    label: 'Transit',
    color: '#60a5fa',
    desc: 'Stops, routes, and walksheds',
    icon: Bus01Icon,
  },
  {
    key: 'vacancy',
    label: 'Vacancy',
    color: '#f59e0b',
    desc: 'Vacant property triage scores',
    icon: Building03Icon,
  },
  {
    key: 'foodAccess',
    label: 'Food Access',
    color: '#ef4444',
    desc: 'Food desert tracts & grocery stores',
    icon: Store01Icon,
  },
  {
    key: 'demographics',
    label: 'Demographics',
    color: '#a855f7',
    desc: 'Census population & housing data',
    icon: UserGroupIcon,
  },
  {
    key: 'housing',
    label: 'Housing',
    color: '#14b8a6',
    desc: 'Median rent & home values by neighborhood',
    icon: Home01Icon,
  },
]

export function LayerPanel({ onClose }: { onClose?: () => void } = {}) {
  const layers = useExplorerStore((s) => s.layers)
  const toggleLayer = useExplorerStore((s) => s.toggleLayer)

  const activeCount = Object.values(layers).filter(Boolean).length

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[0.8rem] font-semibold tracking-tight text-foreground">
            Layers
          </span>
          <span
            className={cn(
              'flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary/15 px-1.5 text-[0.6rem] font-bold tabular-nums text-primary transition-opacity duration-150',
              activeCount > 0 ? 'opacity-100' : 'opacity-0',
            )}
          >
            {activeCount || 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              for (const key of Object.keys(layers) as Array<
                keyof LayerToggles
              >) {
                if (layers[key]) {
                  toggleLayer(key)
                }
              }
            }}
            className={cn(
              'text-[0.62rem] font-medium text-foreground/55 transition-all duration-150 hover:text-foreground',
              activeCount > 0 ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            Clear all
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/55 transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Layer list */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 pb-3 pt-1">
        {LAYER_CONFIG.map((layer) => {
          const isActive = layers[layer.key]
          return (
            <LayerCard
              key={layer.key}
              layer={layer}
              isActive={isActive}
              onToggle={() => toggleLayer(layer.key)}
            />
          )
        })}
      </div>
    </div>
  )
}

function LayerCard({
  layer,
  isActive,
  onToggle,
}: {
  layer: (typeof LAYER_CONFIG)[number]
  isActive: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        'group relative rounded-lg transition-all duration-200',
        isActive ? 'bg-accent/70' : 'hover:bg-accent/40',
      )}
    >
      {/* Active indicator bar */}
      <div
        className={cn(
          'absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full transition-all duration-200',
          isActive ? 'opacity-100' : 'opacity-0',
        )}
        style={{ background: layer.color }}
      />

      {/* Main toggle row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left"
      >
        {/* Icon */}
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-200',
          )}
          style={{
            background: isActive
              ? layer.color
              : 'oklch(from var(--color-foreground) l c h / 0.08)',
          }}
        >
          <HugeiconsIcon
            icon={layer.icon}
            strokeWidth={2}
            className={cn(
              'size-3.5 transition-colors duration-200',
              isActive ? 'text-white' : 'text-foreground/60',
            )}
          />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="text-[0.75rem] font-semibold leading-tight text-foreground">
            {layer.label}
          </div>
          <div className="mt-0.5 text-[0.62rem] leading-tight text-foreground/55">
            {layer.desc}
          </div>
        </div>

        {/* Toggle switch */}
        <div
          className={cn(
            'relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-200',
            isActive ? '' : 'bg-border',
          )}
          style={{
            background: isActive ? layer.color : undefined,
          }}
        >
          <div
            className={cn(
              'absolute top-[2px] h-[14px] w-[14px] rounded-full shadow-sm transition-all duration-200',
              isActive ? 'left-[16px] bg-white' : 'left-[2px] bg-foreground/30',
            )}
          />
        </div>
      </button>

      {/* Expandable filters */}
      <div
        className={cn(
          'grid transition-all duration-200',
          isActive
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3.5 pb-2.5 pl-6">
            <div className="flex flex-col gap-1.5">
              <LayerContent layerKey={layer.key} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-2 py-0.5 text-[0.62rem] text-foreground/50">
      <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-muted-foreground/20 border-t-primary" />
      Loading data&hellip;
    </div>
  )
}

function LayerContent({ layerKey }: { layerKey: keyof LayerToggles }) {
  const isLoading = useDataStore((s) => {
    switch (layerKey) {
      case 'complaints':
        return !s.csbData
      case 'transit':
        return !s.stops
      case 'vacancy':
        return !s.vacancyData
      case 'foodAccess':
        return !s.foodDeserts
      case 'crime':
        return !s.crimeData
      case 'demographics':
        return !s.demographicsData
      case 'housing':
        return !s.housingData
      default:
        return false
    }
  })

  if (isLoading) return <LoadingIndicator />

  switch (layerKey) {
    case 'complaints':
      return <ComplaintsFilters />
    case 'transit':
      return <TransitFilters />
    case 'vacancy':
      return <VacancyFilters />
    case 'foodAccess':
      return <FoodAccessFilters />
    case 'crime':
      return <CrimeFilters />
    case 'demographics':
      return <DemographicsFilters />
    case 'housing':
      return <HousingFilters />
  }
}

/* ── Shared pill toggle ────────────────────────────────── */

function PillToggle({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="inline-flex w-fit gap-0.5 rounded-md bg-foreground/[0.07] p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-[5px] px-2 py-[3px] text-[0.62rem] font-semibold transition-all duration-150',
            value === opt.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-foreground/55 hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ── Tag button for categories ─────────────────────────── */

function TagButton({
  label,
  isActive,
  activeClass,
  onClick,
}: {
  label: string
  isActive: boolean
  activeClass: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md px-1.5 py-[3px] text-[0.62rem] font-semibold transition-all duration-150',
        isActive
          ? activeClass
          : 'bg-foreground/[0.07] text-foreground/65 hover:bg-foreground/[0.12] hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

/* ── Layer-specific filters ────────────────────────────── */

function ComplaintsFilters() {
  const complaintsMode = useExplorerStore((s) => s.subToggles.complaintsMode)
  const complaintsCategory = useExplorerStore(
    (s) => s.subToggles.complaintsCategory,
  )
  const setSubToggle = useExplorerStore((s) => s.setSubToggle)
  const csbData = useDataStore((s) => s.csbData)

  const topCategories = useMemo(() => {
    if (!csbData) return []
    return Object.entries(csbData.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat]) => cat)
  }, [csbData])

  return (
    <>
      <PillToggle
        options={[
          { value: 'choropleth', label: 'Choropleth' },
          { value: 'heatmap', label: 'Heatmap' },
        ]}
        value={complaintsMode}
        onChange={(v) => setSubToggle('complaintsMode', v as 'choropleth' | 'heatmap')}
      />
      <div className="flex flex-wrap gap-1">
        <TagButton
          label="All"
          isActive={complaintsCategory === 'all'}
          activeClass="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
          onClick={() => setSubToggle('complaintsCategory', 'all')}
        />
        {topCategories.map((cat) => (
          <TagButton
            key={cat}
            label={cat}
            isActive={complaintsCategory === cat}
            activeClass="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
            onClick={() => setSubToggle('complaintsCategory', cat)}
          />
        ))}
      </div>
    </>
  )
}

function CrimeFilters() {
  const crimeMode = useExplorerStore((s) => s.subToggles.crimeMode)
  const crimeCategory = useExplorerStore((s) => s.subToggles.crimeCategory)
  const setSubToggle = useExplorerStore((s) => s.setSubToggle)
  const crimeData = useDataStore((s) => s.crimeData)

  const topCategories = useMemo(() => {
    if (!crimeData) return []
    return Object.entries(crimeData.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat]) => cat)
  }, [crimeData])

  return (
    <>
      <PillToggle
        options={[
          { value: 'choropleth', label: 'Choropleth' },
          { value: 'heatmap', label: 'Heatmap' },
        ]}
        value={crimeMode}
        onChange={(v) => setSubToggle('crimeMode', v as 'choropleth' | 'heatmap')}
      />
      <div className="flex flex-wrap gap-1">
        <TagButton
          label="All"
          isActive={crimeCategory === 'all'}
          activeClass="bg-orange-500/20 text-orange-600 dark:text-orange-400"
          onClick={() => setSubToggle('crimeCategory', 'all')}
        />
        {topCategories.map((cat) => (
          <TagButton
            key={cat}
            label={cat}
            isActive={crimeCategory === cat}
            activeClass="bg-orange-500/20 text-orange-600 dark:text-orange-400"
            onClick={() => setSubToggle('crimeCategory', cat)}
          />
        ))}
      </div>
    </>
  )
}

function TransitFilters() {
  const transitToggles = useExplorerStore(
    useShallow((s) => ({
      transitStops: s.subToggles.transitStops,
      transitRoutes: s.subToggles.transitRoutes,
      transitWalkshed: s.subToggles.transitWalkshed,
    })),
  )
  const setSubToggle = useExplorerStore((s) => s.setSubToggle)

  const toggles: Array<{
    key: 'transitStops' | 'transitRoutes' | 'transitWalkshed'
    label: string
    color: string
  }> = [
    { key: 'transitStops', label: 'Stops', color: '#60a5fa' },
    { key: 'transitRoutes', label: 'Routes', color: '#a78bfa' },
    {
      key: 'transitWalkshed',
      label: 'Walk Radius',
      color: 'rgba(96,165,250,0.5)',
    },
  ]

  return (
    <>
      {toggles.map((t) => {
        const checked = transitToggles[t.key]
        return (
          <label
            key={t.key}
            className="group/sub flex cursor-pointer items-center gap-2 rounded-md px-1 py-[3px] transition-colors hover:bg-accent/60"
          >
            <div
              className={cn(
                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150',
                checked ? 'border-transparent' : 'border-muted-foreground/40 bg-transparent',
              )}
              style={{ background: checked ? t.color : undefined }}
            >
              {checked && (
                <svg
                  viewBox="0 0 12 12"
                  className="h-2.5 w-2.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6L5 8.5L9.5 3.5" />
                </svg>
              )}
            </div>
            <span className="text-[0.62rem] font-medium text-foreground/60 transition-colors group-hover/sub:text-foreground">
              {t.label}
            </span>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => setSubToggle(t.key, !checked)}
              className="sr-only"
            />
          </label>
        )
      })}
    </>
  )
}

function VacancyFilters() {
  const vacancyFilters = useExplorerStore(
    useShallow((s) => ({
      vacancyUseFilter: s.subToggles.vacancyUseFilter,
      vacancyOwnerFilter: s.subToggles.vacancyOwnerFilter,
      vacancyTypeFilter: s.subToggles.vacancyTypeFilter,
      vacancyHoodFilter: s.subToggles.vacancyHoodFilter,
      vacancyMinScore: s.subToggles.vacancyMinScore,
      vacancyMaxScore: s.subToggles.vacancyMaxScore,
    })),
  )
  const setSubToggle = useExplorerStore((s) => s.setSubToggle)
  const vacancyData = useDataStore((s) => s.vacancyData)

  const neighborhoods = useMemo(() => {
    if (!vacancyData) return []
    return [...new Set(vacancyData.map((p) => p.neighborhood))].sort()
  }, [vacancyData])

  const selectClass =
    'w-full appearance-none rounded-md border border-border/60 bg-muted/60 px-2 py-1.5 text-[0.62rem] font-medium text-foreground outline-none transition-colors hover:border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20'

  return (
    <>
      <select
        value={vacancyFilters.vacancyUseFilter}
        onChange={(e) => setSubToggle('vacancyUseFilter', e.target.value)}
        className={selectClass}
      >
        <option value="all">All Best Uses</option>
        <option value="housing">Housing</option>
        <option value="solar">Solar</option>
        <option value="garden">Garden</option>
      </select>
      <select
        value={vacancyFilters.vacancyOwnerFilter}
        onChange={(e) => setSubToggle('vacancyOwnerFilter', e.target.value)}
        className={selectClass}
      >
        <option value="all">All Owners</option>
        <option value="lra">LRA</option>
        <option value="city">City</option>
        <option value="private">Private</option>
      </select>
      <select
        value={vacancyFilters.vacancyTypeFilter}
        onChange={(e) => setSubToggle('vacancyTypeFilter', e.target.value)}
        className={selectClass}
      >
        <option value="all">All Types</option>
        <option value="building">Buildings</option>
        <option value="lot">Lots</option>
      </select>
      <select
        value={vacancyFilters.vacancyHoodFilter}
        onChange={(e) => setSubToggle('vacancyHoodFilter', e.target.value)}
        className={selectClass}
      >
        <option value="all">All Neighborhoods</option>
        {neighborhoods.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      {/* Score range slider */}
      <div className="flex flex-col gap-1 pt-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.62rem] font-medium text-foreground/60">
            Score Range
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.62rem] font-bold tabular-nums text-foreground">
            {vacancyFilters.vacancyMinScore}–{vacancyFilters.vacancyMaxScore}
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[
            vacancyFilters.vacancyMinScore,
            vacancyFilters.vacancyMaxScore,
          ]}
          onValueChange={(values) => {
            setSubToggle('vacancyMinScore', values[0])
            setSubToggle('vacancyMaxScore', values[1])
          }}
        />
      </div>
    </>
  )
}

function FoodAccessFilters() {
  const foodToggles = useExplorerStore(
    useShallow((s) => ({
      foodDesertTracts: s.subToggles.foodDesertTracts,
      groceryStores: s.subToggles.groceryStores,
    })),
  )
  const setSubToggle = useExplorerStore((s) => s.setSubToggle)

  const toggles: Array<{
    key: 'foodDesertTracts' | 'groceryStores'
    label: string
    color: string
  }> = [
    {
      key: 'foodDesertTracts',
      label: 'Desert Tracts (LILA)',
      color: '#ef4444',
    },
    {
      key: 'groceryStores',
      label: 'Grocery Stores',
      color: '#10b981',
    },
  ]

  return (
    <>
      {toggles.map((t) => {
        const checked = foodToggles[t.key]
        return (
          <label
            key={t.key}
            className="group/sub flex cursor-pointer items-center gap-2 rounded-md px-1 py-[3px] transition-colors hover:bg-accent/60"
          >
            <div
              className={cn(
                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150',
                checked ? 'border-transparent' : 'border-muted-foreground/40 bg-transparent',
              )}
              style={{ background: checked ? t.color : undefined }}
            >
              {checked && (
                <svg
                  viewBox="0 0 12 12"
                  className="h-2.5 w-2.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6L5 8.5L9.5 3.5" />
                </svg>
              )}
            </div>
            <span className="text-[0.62rem] font-medium text-foreground/60 transition-colors group-hover/sub:text-foreground">
              {t.label}
            </span>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => setSubToggle(t.key, !checked)}
              className="sr-only"
            />
          </label>
        )
      })}
    </>
  )
}

function DemographicsFilters() {
  const demographicsMetric = useExplorerStore(
    (s) => s.subToggles.demographicsMetric,
  )
  const setSubToggle = useExplorerStore((s) => s.setSubToggle)

  const metrics: Array<{
    value: SubToggles['demographicsMetric']
    label: string
  }> = [
    { value: 'population', label: 'Population' },
    { value: 'vacancyRate', label: 'Vacancy Rate' },
    { value: 'popChange', label: 'Pop Change' },
  ]

  return (
    <div className="flex flex-wrap gap-1">
      {metrics.map((m) => (
        <TagButton
          key={m.value}
          label={m.label}
          isActive={demographicsMetric === m.value}
          activeClass="bg-purple-500/20 text-purple-600 dark:text-purple-400"
          onClick={() => setSubToggle('demographicsMetric', m.value)}
        />
      ))}
    </div>
  )
}

function HousingFilters() {
  const housingMetric = useExplorerStore((s) => s.subToggles.housingMetric)
  const setSubToggle = useExplorerStore((s) => s.setSubToggle)

  return (
    <PillToggle
      options={[
        { value: 'rent', label: 'Median Rent' },
        { value: 'value', label: 'Home Value' },
      ]}
      value={housingMetric}
      onChange={(v) => setSubToggle('housingMetric', v as 'rent' | 'value')}
    />
  )
}
