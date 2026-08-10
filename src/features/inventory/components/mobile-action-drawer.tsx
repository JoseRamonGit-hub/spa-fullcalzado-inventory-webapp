import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Boxes, CirclePause, CirclePlay, Eye, Pencil } from "lucide-react";
import type { Product } from "@/types";

type MobileActionDrawerProps = {
  product: Product | null;
  isAdmin: boolean;
  onClose: () => void;
  onViewDetail: (product: Product) => void;
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
};

export function MobileActionDrawer({
  product,
  isAdmin,
  onClose,
  onViewDetail,
  onEdit,
  onAdjustStock,
  onToggleStatus,
}: MobileActionDrawerProps) {
  const isActive = product?.active ?? true;

  return (
    <Drawer open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader className="border-b pb-3">
          <DrawerTitle className="flex min-w-0 items-center gap-2 text-left">
            <span className="product-code shrink-0 uppercase">{product?.code}</span>
            <span className="truncate text-sm font-semibold">{product?.description}</span>
          </DrawerTitle>
          <DrawerDescription className="sr-only">Selecciona una acción para el producto.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-3 p-4">
          <Button
            variant="outline"
            className="h-14 w-full justify-start gap-3 px-4 text-base"
            onClick={() => product && onViewDetail(product)}
          >
            <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
              <Eye className="text-foreground size-5" aria-hidden="true" />
            </div>
            <span className="text-foreground text-sm font-semibold">Ver detalle del producto</span>
          </Button>
          {isAdmin ? (
            <Button
              variant="outline"
              className="h-14 w-full justify-start gap-3 px-4 text-base"
              onClick={() => product && onEdit(product)}
            >
              <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                <Pencil className="text-primary size-5" aria-hidden="true" />
              </div>
              <span className="text-foreground text-sm font-semibold">Editar datos del producto</span>
            </Button>
          ) : null}
          {isAdmin ? (
            <Button
              variant="outline"
              className="h-14 w-full justify-start gap-3 px-4 text-base"
              onClick={() => product && onAdjustStock(product)}
            >
              <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                <Boxes className="text-primary size-5" aria-hidden="true" />
              </div>
              <span className="text-foreground text-sm font-semibold">Ajustar existencias</span>
            </Button>
          ) : null}
          {isAdmin ? (
            isActive ? (
              <Button
                variant="outline"
                className="border-warning/30 h-14 w-full justify-start gap-3 px-4 text-base"
                onClick={() => product && onToggleStatus(product)}
              >
                <div className="bg-warning/15 flex size-10 items-center justify-center rounded-lg">
                  <CirclePause className="text-warning-foreground size-5" aria-hidden="true" />
                </div>
                <span className="text-warning-foreground text-sm font-semibold">Desactivar producto</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-success/30 h-14 w-full justify-start gap-3 px-4 text-base"
                onClick={() => product && onToggleStatus(product)}
              >
                <div className="bg-success/10 flex size-10 items-center justify-center rounded-lg">
                  <CirclePlay className="text-success size-5" aria-hidden="true" />
                </div>
                <span className="text-success text-sm font-semibold">Reactivar producto</span>
              </Button>
            )
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
