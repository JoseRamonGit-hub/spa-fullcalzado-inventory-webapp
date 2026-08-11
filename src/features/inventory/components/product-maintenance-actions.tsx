import { Boxes, CirclePause, CirclePlay, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

type ProductMaintenanceActionsProps = {
  product: Product;
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  presentation?: "table" | "toolbar";
};

export function ProductMaintenanceActions({
  product,
  onEdit,
  onAdjustStock,
  onToggleStatus,
  presentation = "table",
}: ProductMaintenanceActionsProps) {
  const isToolbar = presentation === "toolbar";
  const statusAction = product.active ? "Desactivar" : "Reactivar";

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant={isToolbar ? "outline" : "ghost"}
        size={isToolbar ? "sm" : "icon-xs"}
        className={cn(
          !isToolbar && "text-muted-foreground hover:text-primary",
          isToolbar && "text-foreground/80 hover:text-foreground hover:bg-muted/60",
        )}
        aria-label={`Editar datos del producto ${product.code}`}
        title="Editar datos del producto"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(product);
        }}
      >
        <Pencil data-icon="inline-start" aria-hidden="true" className={cn(isToolbar && "text-muted-foreground")} />
        {isToolbar ? <span className="hidden sm:inline">Editar</span> : null}
      </Button>
      <Button
        variant={isToolbar ? "outline" : "ghost"}
        size={isToolbar ? "sm" : "icon-xs"}
        className={cn(
          !isToolbar && "text-muted-foreground hover:text-primary",
          isToolbar && "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
        )}
        aria-label={`Ajustar existencias de ${product.code}`}
        title="Ajustar existencias"
        onClick={(event) => {
          event.stopPropagation();
          onAdjustStock(product);
        }}
      >
        <Boxes data-icon="inline-start" aria-hidden="true" />
        {isToolbar ? <span className="hidden md:inline">Ajustar</span> : null}
      </Button>
      <Separator orientation="vertical" className={cn("mx-0.5 h-4", isToolbar && "mx-1 h-5")} />
      <Button
        variant={isToolbar ? "outline" : "ghost"}
        size={isToolbar ? "sm" : "icon-xs"}
        className={cn(
          !isToolbar && "text-muted-foreground",
          product.active ? "hover:text-warning-foreground" : "hover:text-success",
          isToolbar &&
            (product.active
              ? "border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "border-success/40 bg-success/5 text-success hover:bg-success/10 hover:text-success"),
        )}
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
        {isToolbar ? <span className="hidden sm:inline">{statusAction}</span> : null}
      </Button>
    </div>
  );
}
