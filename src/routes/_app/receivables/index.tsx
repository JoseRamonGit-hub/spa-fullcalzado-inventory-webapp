import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/receivables/")({
  beforeLoad: () => {
    throw redirect({ to: "/receivables/cashea", replace: true });
  },
});
