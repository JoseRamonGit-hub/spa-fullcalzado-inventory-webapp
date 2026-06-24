import { supabase } from "@/lib/supabase";
import type { Product, ProductCreateInput, EditProductPayload } from "@/types/index";

export const productsService = {
  getAll: async (businessId: string, date?: string): Promise<Product[]> => {
    let query = supabase
      .from("products")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (date) {
      query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  },

  createMany: async (businessId: string, payload: ProductCreateInput[]): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .insert(payload.map((product) => ({ ...product, business_id: businessId })))
      .select();

    if (error) throw new Error(error.message);
    return data;
  },

  editProduct: async (businessId: string, payload: EditProductPayload): Promise<void> => {
    const { error } = await supabase.rpc("edit_product", {
      p_business_id: businessId,
      ...payload,
    });
    if (error) throw new Error(error.message);
  },

  toggleActive: async (businessId: string, id: string, active: boolean): Promise<void> => {
    const { error } = await supabase.rpc("set_product_active", {
      p_business_id: businessId,
      p_product_id: id,
      p_active: active,
    });
    if (error) throw new Error(error.message);
  },
};
