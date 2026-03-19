import { ReturnsPage } from "@/features/returns/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/returns")({
  component: ReturnsPage,
});
