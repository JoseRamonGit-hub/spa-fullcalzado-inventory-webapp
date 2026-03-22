import { MovementsPage } from "@/features/movements/page";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  date: z.string().optional(),
});

export const Route = createFileRoute("/_app/movements")({
  validateSearch: searchSchema,
  component: MovementsPage,
});
