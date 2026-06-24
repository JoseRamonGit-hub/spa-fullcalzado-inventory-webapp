import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { UsersPage } from "@/features/users/page";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/users")({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== "admin") {
      throw redirect({ to: "/inventory" });
    }
  },
  component: UsersPage,
});
