import { IterationCcw, PackagePlus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useModalStore } from "@/components/modals/store/useModalStore";

type MobileQuickActionsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileQuickActionsDrawer({ open, onOpenChange }: MobileQuickActionsDrawerProps) {
  const setInModalOpen = useModalStore((state) => state.setInModalOpen);
  const setOutModalOpen = useModalStore((state) => state.setOutModalOpen);
  const setReturnModalOpen = useModalStore((state) => state.setReturnModalOpen);

  const openModal = (setModalOpen: (open: boolean) => void) => {
    onOpenChange(false);
    setModalOpen(true);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-sm font-bold tracking-wide uppercase">Nueva operación</DrawerTitle>
          <DrawerDescription className="sr-only">
            Selecciona si deseas cargar inventario, registrar una venta o registrar una devolución.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-3 p-4 pb-10">
          <Button
            variant="outline"
            className="h-14 w-full justify-start gap-3 px-4 text-base"
            onClick={() => openModal(setInModalOpen)}
          >
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
              <PackagePlus className="text-primary size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-foreground text-sm font-semibold">Cargar inventario</span>
              <span className="text-muted-foreground text-xs">Agregar o reponer productos</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-14 w-full justify-start gap-3 px-4 text-base"
            onClick={() => openModal(setOutModalOpen)}
          >
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
              <ShoppingCart className="text-primary size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-foreground text-sm font-semibold">Registrar Venta</span>
              <span className="text-muted-foreground text-xs">Vender un producto del inventario</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-14 w-full justify-start gap-3 px-4 text-base"
            onClick={() => openModal(setReturnModalOpen)}
          >
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
              <IterationCcw className="text-primary size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-foreground text-sm font-semibold">Registrar Devolución</span>
              <span className="text-muted-foreground text-xs">Cambio o devolución de producto</span>
            </div>
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
