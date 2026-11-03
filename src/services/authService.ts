import type { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.",
  email_not_confirmed: "Tu correo aún no está confirmado. Pide ayuda al administrador.",
  user_banned: "Tu acceso está suspendido. Habla con el administrador.",
  over_request_rate_limit: "Demasiados intentos seguidos. Espera un minuto antes de volver a intentarlo.",
};

const NETWORK_ERROR_MESSAGE = "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.";
const GENERIC_ERROR_MESSAGE = "No pudimos iniciar sesión. Inténtalo de nuevo en unos segundos.";

/** Translates Supabase auth errors into actionable Spanish copy for the login form. */
function getLoginErrorMessage(error: AuthError): string {
  if (error.code && error.code in LOGIN_ERROR_MESSAGES) return LOGIN_ERROR_MESSAGES[error.code];
  // Older GoTrue versions omit `code` and only send the English message.
  if (error.message === "Invalid login credentials") return LOGIN_ERROR_MESSAGES.invalid_credentials;
  if (error.name === "AuthRetryableFetchError" || error.status === 0) return NETWORK_ERROR_MESSAGE;
  return GENERIC_ERROR_MESSAGE;
}

async function getProfile(userId: string): Promise<User | null> {
  const { data } = await supabase.from("users").select("*").eq("id", userId).single();
  return data ?? null;
}

export const authService = {
  /**
   * Sign in with email + password.
   * Returns the app user profile on success, or an error message.
   */
  login: async (
    email: string,
    password: string,
  ): Promise<{ success: true; user: User } | { success: false; error: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error ? getLoginErrorMessage(error) : GENERIC_ERROR_MESSAGE };
      }

      const profile = await getProfile(data.user.id);

      if (!profile) {
        await supabase.auth.signOut({ scope: "local" });
        return { success: false, error: "Tu usuario no tiene un perfil activo. Habla con el administrador." };
      }

      return { success: true, user: profile };
    } catch {
      return { success: false, error: NETWORK_ERROR_MESSAGE };
    }
  },

  getProfile,

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

  getAuthenticatedProfile: async (): Promise<User | null> => {
    // 1. Fast path: check if we have a local session. If not, don't hit the network.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return null;

    // 2. Validate session with the server. This guarantees the JWT is not revoked.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // If it's a network error (fetch failed, offline), we throw it so the caller
      // can decide not to log the user out on offline scenarios.
      if (error.status === 0 || error.message.includes("Failed to fetch")) {
        throw error;
      }
      return null;
    }

    if (!user) return null;

    return getProfile(user.id);
  },
};
