import { CirclePause, CirclePlay, PackagePlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

type ProductMaintenanceActionsProps = {
  product: Product;
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
};

export function ProductMaintenanceActions({
  product,
  onEdit,
  onAdjustStock,
  onToggleStatus,
}: ProductMaintenanceActionsProps) {
  const statusAction = product.active ? "Desactivar" : "Reactivar";

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-primary"
        aria-label={`Editar datos del producto ${product.code}`}
        title="Editar datos del producto"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(product);
        }}
      >
        <Pencil data-icon="inline-start" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-primary"
        aria-label={`Ajustar existencias de ${product.code}`}
        title="Ajustar existencias"
        onClick={(event) => {
          event.stopPropagation();
          onAdjustStock(product);
        }}
      >
        <PackagePlus data-icon="inline-start" aria-hidden="true" />
      </Button>
      <Separator orientation="vertical" className="mx-0.5 h-4" />
      <Button
        variant="ghost"
        size="icon-xs"
        className={cn("text-muted-foreground", product.active ? "hover:text-warning-foreground" : "hover:text-success")}
        aria-label={`${statusAction} producto ${product.code}`}
        title={`${statusAction} producto`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleStatus(product);
        }}
      >
        {product.active ? (
          <CirclePause data-icon="inline-start" aria-hidden="true" />
        ) : (
          <CirclePlay data-icon="inline-start" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
