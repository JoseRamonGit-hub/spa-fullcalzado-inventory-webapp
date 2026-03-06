import type { Database } from "@/types/supabase"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = createClient<Database>(supabaseUrl ?? "http://localhost", supabaseAnonKey ?? "placeholder", {
  auth: {
    persistSession: true,
    storageKey: "supabase-auth-storage",
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})