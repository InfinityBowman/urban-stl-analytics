import { createFileRoute } from '@tanstack/react-router'
import { AffectedDashboard } from '@/components/affected/AffectedDashboard'

export const Route = createFileRoute('/_app/affected')({
  component: AffectedPage,
})

function AffectedPage() {
  return <AffectedDashboard />
}
