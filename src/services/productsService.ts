import { supabase } from "@/lib/supabase";
import type {
  Product,
  ProductCreateInput,
  EditProductPayload,
  ProductDetail,
  ProductStockAlertType,
} from "@/types/index";

const ALL_MATCHING_PRODUCTS_LIMIT = 2_147_483_647;

export const productsService = {
  getAll: async (businessId: string, date?: string, stockStatus?: ProductStockAlertType): Promise<Product[]> => {
    if (stockStatus) {
      const { data, error } = await supabase.rpc("get_product_stock_alerts", {
        p_business_id: businessId,
        p_alert_type: stockStatus,
        p_limit: ALL_MATCHING_PRODUCTS_LIMIT,
      });

      if (error) throw new Error(error.message);
      return data.map((product) => ({
        id: product.product_id,
        business_id: product.business_id,
        code: product.code,
        description: product.description,
        stock: product.stock,
        price_usd: product.price_usd,
        active: product.active,
        created_at: product.created_at,
        updated_at: product.updated_at,
      }));
    }

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

  getDetail: async (businessId: string, productId: string): Promise<ProductDetail | null> => {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", businessId)
      .eq("id", productId)
      .maybeSingle();

    if (productError) throw new Error(productError.message);
    if (!product) return null;

    const { data: lastActivity, error: activityError } = await supabase
      .from("inventory_movements")
      .select("*")
      .eq("business_id", businessId)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activityError) throw new Error(activityError.message);
    return { product, lastActivity };
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
