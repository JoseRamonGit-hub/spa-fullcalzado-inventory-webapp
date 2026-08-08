import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, RotateCcw } from "lucide-react";
import type { Product } from "@/types";

type MobileActionDrawerProps = {
  product: Product | null;
  isAdmin: boolean;
  onClose: () => void;
  onViewDetail: (product: Product) => void;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
};

export function MobileActionDrawer({
  product,
  isAdmin,
  onClose,
  onViewDetail,
  onEdit,
  onToggleStatus,
}: MobileActionDrawerProps) {
  const isActive = product?.active ?? true;

  return (
    <Drawer open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader className="border-b pb-3">
          <DrawerTitle className="text-sm font-bold tracking-wide uppercase">
            {product?.code} — {product?.description}
          </DrawerTitle>
          <DrawerDescription className="sr-only">Selecciona una acción para el producto.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-3 p-4">
          <Button
            variant="outline"
            className="h-14 w-full justify-start gap-3 px-4 text-base"
            onClick={() => product && onViewDetail(product)}
          >
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <Eye className="text-primary h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold">Ver detalles</span>
          </Button>
          {isAdmin ? (
            <Button
              variant="outline"
              className="h-14 w-full justify-start gap-3 px-4 text-base"
              onClick={() => product && onEdit(product)}
            >
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Pencil className="text-primary h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold">Editar Producto</span>
            </Button>
          ) : null}
          {isAdmin ? (
            isActive ? (
              <Button
                variant="outline"
                className="border-destructive/30 h-14 w-full justify-start gap-3 px-4 text-base"
                onClick={() => product && onToggleStatus(product)}
              >
                <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Trash2 className="text-destructive h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-destructive text-sm font-semibold">Desactivar Producto</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-success/30 h-14 w-full justify-start gap-3 px-4 text-base"
                onClick={() => product && onToggleStatus(product)}
              >
                <div className="bg-success/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <RotateCcw className="text-success h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-success text-sm font-semibold">Reactivar Producto</span>
              </Button>
            )
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
