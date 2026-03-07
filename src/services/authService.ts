import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

export const authService = {
  /**
   * Sign in with email + password.
   * Returns the app user profile on success, or an error message.
   */
  login: async (
    email: string,
    password: string,
  ): Promise<{ success: true; user: User } | { success: false; error: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message ?? "Credenciales incorrectas" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut({ scope: "local" });
      return { success: false, error: "No se encontró el perfil de usuario" };
    }

    return { success: true, user: profile };
  },

  /**
   * Sign out the current user.
   *
   * Uses scope 'local' so it only terminates THIS browser's session.
   * This avoids cross-tab/device issues and is faster than the default 'global'.
   *
   * IMPORTANT: This is best-effort and NEVER throws.
   * The supabase-js client will always:
   * 1. Clear the local storage (session tokens)
   * 2. Fire the 'SIGNED_OUT' event on onAuthStateChange
   * Even if the network request to revoke the server-side session fails.
   *
   * The onAuthStateChange listener in main.tsx handles all post-logout cleanup.
   */
  logout: async (): Promise<void> => {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {
      // Intentional no-op. signOut may fail if the token is already expired
      // or the network is down. The supabase-js client still clears local
      // storage and fires SIGNED_OUT, which our listener handles.
    });
  },

  /**
   * Verify the current session with the Supabase server (network-validated)
   * and return the app user profile, or null if no valid session exists.
   *
   * Uses `getUser()` (not `getSession()`) so the JWT is always server-verified.
   */
  getAuthenticatedProfile: async (): Promise<User | null> => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();

    return profile ?? null;
  },
};
