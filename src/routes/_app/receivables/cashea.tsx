import { CasheaPage } from "@/features/cashea/page";
import { casheaStatusFilters, isCalendarDate } from "@/features/cashea/cashea-receivables";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const calendarDate = z.string().refine(isCalendarDate).optional().catch(undefined);

const searchSchema = z.object({
  orderId: z.uuid().optional().catch(undefined),
  onlyOrder: z.literal(true).optional().catch(undefined),
  sheet: z.literal("closed").optional().catch(undefined),
  status: z.enum(casheaStatusFilters).optional().catch(undefined),
  from: calendarDate,
  to: calendarDate,
  cashClose: z
    .union([z.literal("day"), z.iso.datetime({ offset: true })])
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/_app/receivables/cashea")({
  validateSearch: searchSchema,
  component: CasheaPage,
});
