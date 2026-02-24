import { createFileRoute } from '@tanstack/react-router'
import { PopulationDashboard } from '@/components/population/PopulationDashboard'

export const Route = createFileRoute('/_app/population')({
  component: PopulationPage,
})

function PopulationPage() {
  return <PopulationDashboard />
}
