import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { accessibleBusinessesQueryOptions } from "@/features/business/hooks/useBusinessQueries";
import { queryClient } from "@/lib/queryClient";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      // Remember deep links so login can send the user back where they were headed.
      throw redirect({
        to: "/login",
        search: location.pathname === "/dashboard" ? {} : { redirect: location.href },
      });
    }

    const businesses = await queryClient.ensureQueryData(accessibleBusinessesQueryOptions(user.id));
    useBusinessStore.getState().syncBusinessContext(user, businesses);
  },
  component: AppLayout,
});
