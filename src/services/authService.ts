import { supabase } from "@/lib/supabase"
import type { User } from "@/types/index"

export const authService = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error || !data.user) {
      return { success: false as const, error: error?.message ?? "Credenciales incorrectas" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      return { success: false as const, error: "No se encontró el perfil de usuario" }
    }

    return { success: true as const, user: profile }
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  getSession: async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session?.user) return null

    const { data: profile } = await supabase.from("users").select("*").eq("id", data.session.user.id).single()

    return profile
  },

  getCurrentUser: async (): Promise<User | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

    return profile
  },
}
