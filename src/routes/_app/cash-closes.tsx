import { CashClosesPage } from "@/features/cash-closes/page";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  date: z.string().optional(),
});

export const Route = createFileRoute("/_app/cash-closes")({
  validateSearch: searchSchema,
  component: CashClosesPage,
});
