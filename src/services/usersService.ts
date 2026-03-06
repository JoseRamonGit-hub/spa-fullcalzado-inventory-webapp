import { supabase } from "@/lib/supabase"
import type { User } from "@/types/index"

export const usersService = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },
}
