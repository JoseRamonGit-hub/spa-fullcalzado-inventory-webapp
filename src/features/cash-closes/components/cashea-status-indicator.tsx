import { Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CasheaCollectionStatus } from "@/types";

function pluralizeOrders(count: number) {
  return count === 1 ? "orden" : "órdenes";
}

/** Una sola frase en lenguaje llano: qué falta por cobrar, o que ya se cobró todo. */
function describeCollection(ordersCount: number, collectedCount: number) {
  const pendingCount = ordersCount - collectedCount;

  if (pendingCount === 0) {
    return ordersCount === 1 ? "Orden cobrada" : `${ordersCount} órdenes cobradas`;
  }

  if (collectedCount === 0) {
    return `${pendingCount} ${pluralizeOrders(pendingCount)} por cobrar`;
  }

  return `Faltan ${pendingCount} de ${ordersCount} órdenes por cobrar`;
}

/**
 * Estado de cobro Cashea de un cierre. Lo pendiente resalta solo por contraste (texto pleno y un
 * punto del color primario, el del botón de cierre de día) frente a lo cobrado, que queda tenue.
 * La fracción solo aparece en cobros parciales, donde aporta algo. Sin Cashea, la celda queda vacía.
 */
export function CasheaStatusIndicator({ status }: { status?: CasheaCollectionStatus }) {
  if (!status) return null;

  const { orders_count, collected_count } = status;
  const isCollected = collected_count === orders_count;
  const isPartial = !isCollected && collected_count > 0;
  const description = describeCollection(orders_count, collected_count);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex items-center gap-1.5", isCollected && "text-muted-foreground")}>
          {isCollected ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <span className="bg-primary size-1.5 shrink-0 rounded-full" aria-hidden="true" />
          )}
          {isCollected ? "Cobrado" : "Pendiente"}
          {isPartial && (
            <span className="tabular-value text-muted-foreground" aria-hidden="true">
              {collected_count}/{orders_count}
            </span>
          )}
          <span className="sr-only">, {description}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4} aria-hidden="true">
        {description}
      </TooltipContent>
    </Tooltip>
  );
}
