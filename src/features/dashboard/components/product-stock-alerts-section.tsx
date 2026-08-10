import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, PackageX, RefreshCw, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductStockAlertType } from "@/types";
import { useDashboardProductStockAlerts } from "../hooks/useDashboardMetrics";
import { ProductStockAlertsTable } from "./product-stock-alerts-table";

const INVENTORY_ATTENTION_ICON_CLASS =
  "bg-warning/10 text-warning flex size-9 shrink-0 items-center justify-center rounded-lg";

const ALERT_COPY = {
  low_stock: {
    title: "Productos con stock bajo",
    description: "Productos activos con 3 unidades o menos",
    emptyLabel: "Stock bajo",
    icon: TriangleAlert,
  },
  stagnant: {
    title: "Productos estancados",
    description: "Sin salidas comerciales durante 30 días completos",
    emptyLabel: "Estancado",
    icon: PackageX,
  },
} as const;

export function ProductStockAlertsSection() {
  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-2">
      <ProductStockAlertCard type="low_stock" />
      <ProductStockAlertCard type="stagnant" />
    </div>
  );
}

function ProductStockAlertCard({ type }: { type: ProductStockAlertType }) {
  const navigate = useNavigate({ from: "/dashboard" });
  const query = useDashboardProductStockAlerts(type);
  const copy = ALERT_COPY[type];
  const Icon = copy.icon;
  const hasResults = (query.data?.length ?? 0) > 0;

  return (
    <Card className="min-h-0 gap-0 py-0">
      <CardHeader className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={INVENTORY_ATTENTION_ICON_CLASS}>
            <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="font-heading text-sm">{copy.title}</CardTitle>
            <CardDescription className="text-xs">{copy.description}</CardDescription>
          </div>
        </div>
        {hasResults ? (
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-normal"
            onClick={() => navigate({ to: "/inventory", search: { status: type } })}
            aria-label={`Ver ${copy.emptyLabel} en Inventario`}
          >
            Ver todos
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 p-0">
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
    </Card>
  );
}
