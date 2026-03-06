import { TransactionsPage } from "@/features/transactions/transactions-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/transactions")({
  component: TransactionsPage,
});
