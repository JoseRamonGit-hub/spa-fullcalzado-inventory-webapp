import { useNavigate } from "@tanstack/react-router";
import { ArchiveX, ChevronRight, RefreshCw, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductStockAlertType } from "@/types";
import { useDashboardProductStockAlerts } from "../hooks/useDashboardMetrics";
import { ProductStockAlertsTable } from "./product-stock-alerts-table";

const ALERT_COPY = {
  low_stock: {
    title: "Productos con Stock bajo",
    description: "Productos activos con 3 unidades o menos",
    emptyLabel: "Stock bajo",
    icon: TriangleAlert,
  },
  stagnant: {
    title: "Productos estancados",
    description: "Sin salidas comerciales durante 30 días completos",
    emptyLabel: "Estancado",
    icon: ArchiveX,
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

  return (
    <Card className="min-h-0 gap-0 py-0">
      <CardHeader className="flex grid-cols-[1fr_auto] items-start gap-3 px-4 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="bg-warning/15 text-warning-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Icon className="size-4" aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription className="text-xs">{copy.description}</CardDescription>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/inventory", search: { status: type } })}
          aria-label={`Ver ${copy.emptyLabel} en Inventario`}
        >
          Ver todos
          <ChevronRight data-icon="inline-end" aria-hidden="true" />
        </Button>
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
