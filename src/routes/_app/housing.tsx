import { createFileRoute } from '@tanstack/react-router'
import { HousingDashboard } from '@/components/housing/HousingDashboard'

export const Route = createFileRoute('/_app/housing')({
  component: HousingPage,
})

function HousingPage() {
  return <HousingDashboard />
}
