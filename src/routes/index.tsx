import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

/**
 * Root index route — redirects to the correct page based on auth state.
 * No network call needed — the root beforeLoad already hydrated the store.
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (useAuthStore.getState().user) {
      throw redirect({ to: "/inventory" });
    } else {
      throw redirect({ to: "/login" });
    }
  },
});
