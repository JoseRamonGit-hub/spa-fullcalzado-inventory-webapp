import { supabase } from "@/lib/supabase";
import type { InventoryMovementWithRelations, InventoryMovementCreateInput } from "@/types/index";
import { formatDateForBackend } from "@/utils/formatters";

const MOVEMENT_SELECT = "*, products(code, description), users(fullname)" as const;

export const inventoryMovementsService = {
  getAll: async (businessId: string, date?: string): Promise<InventoryMovementWithRelations[]> => {
    let query = supabase
      .from("inventory_movements")
      .select(MOVEMENT_SELECT)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (date) {
      query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);
    } else {
      // Default: last 30 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      query = query.gte("created_at", `${formatDateForBackend(cutoff)}T00:00:00`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  },

  createMany: async (
    businessId: string,
    payloads: InventoryMovementCreateInput[],
  ): Promise<InventoryMovementWithRelations[]> => {
    const { data, error } = await supabase
      .from("inventory_movements")
      .insert(payloads.map((movement) => ({ ...movement, business_id: businessId })))
      .select(MOVEMENT_SELECT);

    if (error) throw new Error(error.message);
    return data;
  },
};
