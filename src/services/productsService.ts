import { supabase } from "@/lib/supabase"
import type { Product, ProductInsert, ProductUpdate } from "@/types/index"

export const productsService = {
  getAll: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  getById: async (id: string): Promise<Product> => {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) throw new Error(error.message)
    return data
  },

  create: async (payload: ProductInsert): Promise<Product> => {
    const { data, error } = await supabase.from("products").insert(payload).select().single()

    if (error) throw new Error(error.message)
    return data
  },

  update: async (id: string, payload: ProductUpdate): Promise<Product> => {
    const { data, error } = await supabase.from("products").update(payload).eq("id", id).select().single()

    if (error) throw new Error(error.message)
    return data
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}
