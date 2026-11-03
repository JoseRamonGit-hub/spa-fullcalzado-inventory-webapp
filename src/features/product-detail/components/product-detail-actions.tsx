import { CirclePause, CirclePlay, Ellipsis, PackagePlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/types";

type ProductDetailActionsProps = {
  product: Product;
  isMobile: boolean;
  onEdit: () => void;
  onAdjustStock: () => void;
  onToggleStatus: () => void;
  onOpenMobileActions: () => void;
};

/**
 * Stock adjustment is the everyday action, editing is secondary and (de)activation is rare,
 * so it lives behind the overflow menu instead of competing as a red button.
 */
export function ProductDetailActions({
  product,
  isMobile,
  onEdit,
  onAdjustStock,
  onToggleStatus,
  onOpenMobileActions,
}: ProductDetailActionsProps) {
  if (isMobile) {
    return (
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={`Abrir acciones del producto ${product.code}`}
        title="Acciones del producto"
        onClick={onOpenMobileActions}
      >
        <Ellipsis aria-hidden="true" />
      </Button>
    );
  }

  const statusAction = product.active ? "Desactivar" : "Reactivar";

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button variant="outline" size="sm" aria-label={`Editar datos del producto ${product.code}`} onClick={onEdit}>
        <Pencil data-icon="inline-start" aria-hidden="true" />
        Editar
      </Button>
      <Button size="sm" aria-label={`Ajustar existencias de ${product.code}`} onClick={onAdjustStock}>
        <PackagePlus data-icon="inline-start" aria-hidden="true" />
        Ajustar stock
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Más acciones del producto ${product.code}`}>
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem
            variant={product.active ? "destructive" : "default"}
            aria-label={`${statusAction} producto ${product.code}`}
            onSelect={onToggleStatus}
          >
            {product.active ? <CirclePause aria-hidden="true" /> : <CirclePlay aria-hidden="true" />}
            {statusAction} producto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
