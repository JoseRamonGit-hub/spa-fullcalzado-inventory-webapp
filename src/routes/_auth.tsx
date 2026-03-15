import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireGuest } from "@/features/auth/routeGuards";

/**
 * Public layout route for unauthenticated pages (e.g. /login).
 *
 * Root route already validated the session via getAuthenticatedProfile()
 * and passes auth state through route context.
 */
export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    requireGuest(context);
  },
  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
