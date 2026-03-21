import { supabase } from "@/lib/supabase";
import type { Product, ProductInsert, EditProductPayload } from "@/types/index";

export const productsService = {
  getAll: async (date?: string): Promise<Product[]> => {
    let query = supabase.from("products").select("*").order("created_at", { ascending: false });

    if (date) {
      query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  },

  getById: async (id: string): Promise<Product> => {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();

    if (error) throw new Error(error.message);
    return data;
  },

  create: async (payload: ProductInsert): Promise<Product> => {
    const { data, error } = await supabase.from("products").insert(payload).select().single();

    if (error) throw new Error(error.message);
    return data;
  },

  createMany: async (payload: ProductInsert[]): Promise<Product[]> => {
    const { data, error } = await supabase.from("products").insert(payload).select();

    if (error) throw new Error(error.message);
    return data;
  },

  editProduct: async (payload: EditProductPayload): Promise<void> => {
    const { error } = await supabase.rpc("edit_product", payload);
    if (error) throw new Error(error.message);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
