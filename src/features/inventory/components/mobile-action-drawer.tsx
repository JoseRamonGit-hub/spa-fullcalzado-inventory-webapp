import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types";

type MobileActionDrawerProps = {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export function MobileActionDrawer({ product, onClose, onEdit, onDelete }: MobileActionDrawerProps) {
  return (
    <Drawer open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader className="border-b pb-3">
          <DrawerTitle className="text-sm font-bold tracking-wide uppercase">
            {product?.code} — {product?.description}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-3 p-4">
          <Button
            variant="outline"
            className="h-14 w-full justify-start gap-3 px-4 text-base"
            onClick={() => product && onEdit(product)}
          >
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <Pencil className="text-primary h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Editar Producto</span>
          </Button>
          <Button
            variant="outline"
            className="border-destructive/30 h-14 w-full justify-start gap-3 px-4 text-base"
            onClick={() => product && onDelete(product)}
          >
            <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <Trash2 className="text-destructive h-5 w-5" />
            </div>
            <span className="text-destructive text-sm font-semibold">Eliminar Producto</span>
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
