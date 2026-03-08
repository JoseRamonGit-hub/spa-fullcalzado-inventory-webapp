import { supabase } from "@/lib/supabase";
import type { InventoryMovementWithRelations, InventoryMovementInsert } from "@/types/index";

const MOVEMENT_SELECT = "*, products(code, description), users(fullname)" as const;

export const inventoryMovementsService = {
  getAll: async (): Promise<InventoryMovementWithRelations[]> => {
    const { data, error } = await supabase
      .from("inventory_movements")
      .select(MOVEMENT_SELECT)
      .order("date", { ascending: false })
      .order("time", { ascending: false });

    if (error) throw new Error(error.message);
    return data as unknown as InventoryMovementWithRelations[];
  },

  create: async (payload: InventoryMovementInsert): Promise<InventoryMovementWithRelations> => {
    const { data, error } = await supabase.from("inventory_movements").insert(payload).select(MOVEMENT_SELECT).single();

    if (error) throw new Error(error.message);
    return data as unknown as InventoryMovementWithRelations;
  },
};
