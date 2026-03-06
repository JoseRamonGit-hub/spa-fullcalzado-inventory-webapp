import { MovementsPage } from '@/features/movements/movements-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/movements')({
  component: MovementsPage,
})
