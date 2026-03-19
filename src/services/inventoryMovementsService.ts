import { supabase } from "@/lib/supabase";
import type { InventoryMovementWithRelations, InventoryMovementInsert } from "@/types/index";

const MOVEMENT_SELECT = "*, products(code, description), users(fullname)" as const;

export const inventoryMovementsService = {
  getAll: async (date?: string): Promise<InventoryMovementWithRelations[]> => {
    let query = supabase.from("inventory_movements").select(MOVEMENT_SELECT).order("created_at", { ascending: false });

    if (date) {
      query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  },

  create: async (payload: InventoryMovementInsert): Promise<InventoryMovementWithRelations> => {
    const { data, error } = await supabase.from("inventory_movements").insert(payload).select(MOVEMENT_SELECT).single();

    if (error) throw new Error(error.message);
    return data;
  },

  createMany: async (payloads: InventoryMovementInsert[]): Promise<InventoryMovementWithRelations[]> => {
    const { data, error } = await supabase.from("inventory_movements").insert(payloads).select(MOVEMENT_SELECT);

    if (error) throw new Error(error.message);
    return data;
  },
};
