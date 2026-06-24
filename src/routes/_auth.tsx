import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

/**
 * Public layout route for unauthenticated pages (e.g. /login).
 *
 * Root route already validated the session via getAuthenticatedProfile().
 * This guard is a synchronous store check — no extra network call.
 */
export const Route = createFileRoute("/_auth")({
  beforeLoad: () => {
    if (useAuthStore.getState().user) {
      throw redirect({ to: "/inventory" });
    }
  },
  component: Outlet,
});
