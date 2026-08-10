import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailPage } from "@/features/product-detail/page";

export const Route = createFileRoute("/_app/inventory_/$productId")({
  component: ProductDetailPage,
});
