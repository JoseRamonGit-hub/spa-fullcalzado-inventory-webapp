import { supabase } from "@/lib/supabase";
import type {
  Product,
  ProductCreateInput,
  AdjustProductStockPayload,
  ProductDetail,
  ProductStockAlertType,
  UpdateProductCatalogPayload,
} from "@/types/index";

const ALL_MATCHING_PRODUCTS_LIMIT = 2_147_483_647;

export const productsService = {
  getAll: async (businessId: string, date?: string, stockStatus?: ProductStockAlertType): Promise<Product[]> => {
    if (stockStatus) {
      const { data, error } = await supabase.rpc("get_product_stock_alerts", {
        p_business_id: businessId,
        p_alert_type: stockStatus,
        p_limit: ALL_MATCHING_PRODUCTS_LIMIT,
        p_created_date: date,
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

    const [activityResult, stagnationResult] = await Promise.all([
      supabase
        .from("inventory_movements")
        .select("*")
        .eq("business_id", businessId)
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.rpc("get_product_stagnation", { p_business_id: businessId, p_product_id: productId }).maybeSingle(),
    ]);

    if (activityResult.error) throw new Error(activityResult.error.message);
    if (stagnationResult.error) throw new Error(stagnationResult.error.message);
    return {
      product,
      lastActivity: activityResult.data,
      stagnantSince: stagnationResult.data?.stagnant_since ?? null,
      stagnantDays: stagnationResult.data?.stagnant_days ?? null,
    };
  },

  createMany: async (businessId: string, payload: ProductCreateInput[]): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .insert(payload.map((product) => ({ ...product, business_id: businessId })))
      .select();

    if (error) throw new Error(error.message);
    return data;
  },

  updateCatalog: async (businessId: string, payload: UpdateProductCatalogPayload): Promise<void> => {
    const { error } = await supabase.rpc("edit_product", {
      p_business_id: businessId,
      ...payload,
    });
    if (error) throw new Error(error.message);
  },

  adjustStock: async (businessId: string, payload: AdjustProductStockPayload): Promise<void> => {
    const { error } = await supabase.rpc("adjust_product_stock", {
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
