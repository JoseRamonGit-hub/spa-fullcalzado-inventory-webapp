import { ReturnsPage } from "@/features/returns/page";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  date: z.string().optional(),
  returnId: z.string().optional(),
});

export const Route = createFileRoute("/_app/returns")({
  validateSearch: searchSchema,
  component: ReturnsPage,
});
