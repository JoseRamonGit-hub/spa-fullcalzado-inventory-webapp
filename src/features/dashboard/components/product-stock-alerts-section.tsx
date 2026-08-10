import { useNavigate } from "@tanstack/react-router";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ProductStockAlertType } from "@/types";
import { useDashboardProductStockAlerts } from "../hooks/useDashboardMetrics";
import { ProductStockAlertsTable } from "./product-stock-alerts-table";

const ALERT_COPY = {
  low_stock: {
    title: "Productos con stock bajo",
    description: "Productos activos con 3 unidades o menos",
    actionLabel: "Ver todas las alertas",
  },
  stagnant: {
    title: "Productos estancados",
    description: "Sin salidas comerciales durante 30 días completos",
    actionLabel: "Ver todos los estancados",
  },
} as const;

export function ProductStockAlertsSection() {
  return (
    <div className="grid min-h-0 min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
      <ProductStockAlertCard type="low_stock" />
      <ProductStockAlertCard type="stagnant" />
    </div>
  );
}

function ProductStockAlertCard({ type }: { type: ProductStockAlertType }) {
  const navigate = useNavigate({ from: "/dashboard" });
  const query = useDashboardProductStockAlerts(type);
  const copy = ALERT_COPY[type];
  const hasResults = (query.data?.length ?? 0) > 0;

  return (
    <Card className="min-h-0 min-w-0 gap-0 py-0">
      <CardHeader className="gap-1 px-4 py-3">
        <CardTitle className="font-heading text-sm">{copy.title}</CardTitle>
        <CardDescription className="text-xs">{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 w-full min-w-0 flex-1 p-0">
        {query.isError ? (
          <Alert variant="destructive" className="m-4">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>No se pudo cargar la lista</AlertTitle>
            <AlertDescription>
              <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                <RefreshCw data-icon="inline-start" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <ProductStockAlertsTable
            type={type}
            products={query.data ?? []}
            isLoading={query.isPending}
            onProductClick={(product) =>
              navigate({ to: "/inventory/$productId", params: { productId: product.productId } })
            }
          />
        )}
      </CardContent>
      {hasResults ? (
        <>
          <Separator />
          <CardFooter className="px-4 py-2.5">
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => navigate({ to: "/inventory", search: { status: type } })}
            >
              {copy.actionLabel}
            </Button>
          </CardFooter>
        </>
      ) : null}
    </Card>
  );
}
