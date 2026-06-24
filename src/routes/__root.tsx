import { createRootRoute } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/root-layout";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";

let authBootstrapPromise: Promise<void> | null = null;

function bootstrapAuth() {
  if (authBootstrapPromise) return authBootstrapPromise;

  authBootstrapPromise = (async () => {
    const { setAuth, clearAuth } = useAuthStore.getState();

    try {
      const profile = await authService.getAuthenticatedProfile();
      if (profile) {
        setAuth(profile);
      } else {
        clearAuth();
        useBusinessStore.getState().clear();
      }
    } catch (error) {
      // Keep the persisted local session during temporary network failures.
      console.warn("Autenticación en segundo plano falló (offline)", error);
    }
  })();

  return authBootstrapPromise;
}

export const Route = createRootRoute({
  beforeLoad: bootstrapAuth,
  component: RootLayout,
});
