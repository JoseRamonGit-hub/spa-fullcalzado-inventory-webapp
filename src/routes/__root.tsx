import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store";
import { queryClient } from "@/lib/queryClient";

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

    // Already hydrated by a previous beforeLoad (client-side navigation)
    if (isInitialized) return;

    try {
      const profile = await authService.getAuthenticatedProfile();
      if (profile) {
        setAuth(profile);
        // Force React Query to refetch with the rehydrated session.
        // Without this, reopening the browser shows stale/empty data.
        queryClient.invalidateQueries();
      } else {
        clearAuth();
      }
    } catch {
      // Network error, Supabase down, etc. — default to logged out
      clearAuth();
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
