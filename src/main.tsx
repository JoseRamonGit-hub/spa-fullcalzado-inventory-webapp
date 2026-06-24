import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { queryClient } from "@/lib/queryClient";
import { authService } from "@/services/authService";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/**
 * Lightweight auth state listener.
 *
 * Responsibilities are intentionally minimal:
 * - Login   → handled by useLogin hook (sets store + navigates)
 * - Logout  → handled by useLogout hook (clears store + cache + navigates)
 * - Initial → handled by __root.tsx beforeLoad (hydrates store)
 *
 * This listener only handles TOKEN_REFRESHED to keep the user profile
 * in sync when Supabase silently refreshes the JWT.
 */
const {
  data: { subscription: authSubscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    // Session was terminated (user logged out, session expired, or revoked)
    useAuthStore.getState().clearAuth();
    useBusinessStore.getState().clear();
    queryClient.clear();

    // Kick user out of protected routes immediately
    router.navigate({ to: "/login", replace: true });
    return;
  }

  if (event === "TOKEN_REFRESHED" && session?.user) {
    // Avoid Supabase client deadlocks/token freezes:
    // Do not await db calls inside the onAuthStateChange callback.
    // Dispatch them asynchronously outside this event loop tick.
    setTimeout(async () => {
      try {
        const profile = await authService.getProfile(session.user.id);

        if (profile) {
          useAuthStore.getState().setAuth(profile);
        }
      } catch {
        // Non-critical — profile stays as-is
      }
    }, 0);
  }
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => authSubscription.unsubscribe());
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
