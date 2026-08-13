import { InventoryPage } from "@/features/inventory/page";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z
  .object({
    date: z.string().optional(),
    status: z.enum(["low_stock", "stagnant"]).optional(),
  })
  .transform(({ date, status }) => ({ date: status ? undefined : date, status }));

export const Route = createFileRoute("/_app/inventory")({
  validateSearch: searchSchema,
  component: InventoryPage,
});
