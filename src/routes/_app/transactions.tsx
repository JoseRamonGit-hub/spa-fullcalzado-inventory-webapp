import { TransactionsPage } from "@/features/transactions/transactions-page";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  date: z.string().optional(),
});

export const Route = createFileRoute("/_app/transactions")({
  validateSearch: searchSchema,
  component: TransactionsPage,
});
