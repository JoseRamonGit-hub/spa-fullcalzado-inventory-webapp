import { CashClosesPage } from '@/features/cash-closes/cash-closes-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/cash-closes')({
  component: CashClosesPage,
})
