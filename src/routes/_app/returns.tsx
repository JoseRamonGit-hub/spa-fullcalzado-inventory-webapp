import { ReturnsPage } from "@/features/returns/page";
import { Constants } from "@/types/supabase";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  date: z.string().optional(),
  returnId: z.string().optional(),
  type: z.enum(Constants.public.Enums.return_types).optional().catch(undefined),
  closedAt: z.iso.datetime({ offset: true }).optional().catch(undefined),
});

export const Route = createFileRoute("/_app/returns")({
  validateSearch: searchSchema,
  component: ReturnsPage,
});
