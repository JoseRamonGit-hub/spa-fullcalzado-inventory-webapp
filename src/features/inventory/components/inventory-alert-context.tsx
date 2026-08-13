import { useRef } from "react";
import { Info, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProductStockAlertType } from "@/types";
import { formatInteger } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const ALERT_CONTEXT_COPY = {
  low_stock: {
    title: "Stock bajo",
    definition: "Productos activos con 3 unidades o menos.",
    recommendedOrder: "menor stock primero",
  },
  stagnant: {
    title: "Estancado",
    definition: "30 días o más sin salidas comerciales · Incluye inactivos para liquidación",
    recommendedOrder: "mayor tiempo sin salida primero",
  },
} as const;

type InventoryAlertContextProps = {
  status: ProductStockAlertType;
  totalCount: number;
  visibleCount: number;
  isLoading: boolean;
  isError: boolean;
  hasCustomSorting: boolean;
  onResetRecommendedOrder: () => void;
  onClear: () => void;
};

function formatProductCount(count: number) {
  return `${formatInteger(count)} ${count === 1 ? "producto por revisar" : "productos por revisar"}`;
}

function formatVisibleProductCount(visibleCount: number, totalCount: number) {
  if (visibleCount === totalCount) return formatProductCount(totalCount);

  return `${formatInteger(visibleCount)} ${visibleCount === 1 ? "coincidencia" : "coincidencias"} de ${formatProductCount(totalCount)}`;
}

export function InventoryAlertContext({
  status,
  totalCount,
  visibleCount,
  isLoading,
  isError,
  hasCustomSorting,
  onResetRecommendedOrder,
  onClear,
}: InventoryAlertContextProps) {
  const clearFilterButtonRef = useRef<HTMLButtonElement>(null);
  const copy = ALERT_CONTEXT_COPY[status];
  const countLabel = formatVisibleProductCount(visibleCount, totalCount);
  const resultLabel = isLoading
    ? "Calculando productos por revisar…"
    : isError
      ? "No se pudo calcular el total por revisar"
      : countLabel;
  const orderLabel = hasCustomSorting ? "personalizado" : copy.recommendedOrder;

  return (
    <section
      className={cn(
        "border-warning/25 bg-warning/8 flex shrink-0 flex-row items-center justify-between gap-2 border-b px-3 py-1.5 md:px-4 md:py-2",
        hasCustomSorting && "flex-wrap md:flex-nowrap",
      )}
      aria-label={`Contexto del filtro ${copy.title}`}
      aria-busy={isLoading}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-warning-foreground text-sm leading-tight font-semibold">{resultLabel}</span>
        <span className="sr-only" role="status" aria-atomic="true">
          {!isLoading && !isError ? `${resultLabel}. Orden de revisión: ${orderLabel}.` : null}
        </span>
        <div className="flex min-w-0 items-center gap-1">
          <span className="text-warning-foreground/75 text-[11px] leading-tight">
            Orden de revisión: <span className="text-warning-foreground font-medium">{orderLabel}</span>
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="hidden md:inline-flex"
                aria-label={`Ver criterio del filtro ${copy.title}`}
              >
                <Info aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className="max-w-[min(18rem,calc(100vw-1.5rem))] leading-relaxed"
            >
              <span className="block font-semibold">Qué incluye {copy.title}</span>
              <span className="text-background/75 block">{copy.definition}</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center justify-end gap-1",
          hasCustomSorting ? "w-full md:w-auto" : "w-auto",
        )}
      >
        {hasCustomSorting ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              onResetRecommendedOrder();
              clearFilterButtonRef.current?.focus();
            }}
          >
            <RotateCcw aria-hidden="true" />
            Restablecer orden recomendado
          </Button>
        ) : null}
        <Button ref={clearFilterButtonRef} type="button" variant="ghost" size="xs" onClick={onClear}>
          <X aria-hidden="true" />
          Quitar filtro de stock
        </Button>
      </div>
    </section>
  );
}
