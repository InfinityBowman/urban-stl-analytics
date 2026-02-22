import { createFileRoute, Link } from '@tanstack/react-router'
import { PopulationDashboard } from '@/components/population/PopulationDashboard'

export const Route = createFileRoute('/_app/population')({
  component: PopulationPage,
})

function PopulationPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card/50 px-6 py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Map
        </Link>
      </div>
      <PopulationDashboard />
    </div>
  )
}
