import { CasheaPage } from "@/features/cashea/page";
import { casheaStatusFilters, isCalendarDate } from "@/features/cashea/cashea-receivables";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const calendarDate = z.string().refine(isCalendarDate).optional().catch(undefined);

const searchSchema = z.object({
  status: z.enum(casheaStatusFilters).optional().catch(undefined),
  from: calendarDate,
  to: calendarDate,
});

export const Route = createFileRoute("/_app/receivables/cashea")({
  validateSearch: searchSchema,
  component: CasheaPage,
});
