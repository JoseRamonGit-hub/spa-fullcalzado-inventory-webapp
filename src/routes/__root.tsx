import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : React.lazy(() =>
      import("@tanstack/react-router-devtools").then((res) => ({
        default: res.TanStackRouterDevtools,
      })),
    );

const ReactQueryDevtools = import.meta.env.PROD
  ? () => null
  : React.lazy(() =>
      import("@tanstack/react-query-devtools").then((res) => ({
        default: res.ReactQueryDevtools,
      })),
    );

export const Route = createRootRoute({
  /**
   * Runs once per full page load (hard refresh / first visit).
   * Validates the Supabase session server-side (getUser) and hydrates the store.
   *
   * Wrapped in try/catch so that network failures never produce a blank page —
   * worst case, the user is redirected to /login.
   */
  beforeLoad: async () => {
    const { isInitialized, setAuth, clearAuth } = useAuthStore.getState();

    const validateSession = async () => {
      try {
        const profile = await authService.getAuthenticatedProfile();
        if (profile) {
          setAuth(profile);
        } else {
          clearAuth();
        }
      } catch (error) {
        // Network error (handled by authService throwing) => DO NOT clearAuth.
        // The user keeps their persisted session offline.
        console.warn("Autenticación en segundo plano falló (offline)", error);
      }
    };

    if (!isInitialized) {
      // First load ever (no local storage state yet)
      await validateSession();
    } else {
      // Already hydrated from localStorage persist.
      // Do a background sync so rendering is not blocked and network issues don't log them out.
      validateSession();
    }
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <TooltipProvider>
        <Outlet />
        <Toaster />
      </TooltipProvider>
      <React.Suspense fallback={null}>
        <TanStackRouterDevtools position="bottom-right" />
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      </React.Suspense>
    </ThemeProvider>
  );
}
