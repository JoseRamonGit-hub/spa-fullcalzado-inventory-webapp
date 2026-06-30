import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ModalProductIdentity } from "@/components/modals/shared/modal-ui";
import { ResponsiveAlertModal } from "@/components/modals/shared/responsive-alert-modal";
import { useToggleProductActive } from "@/features/inventory/hooks/useProductMutations";
import type { Product } from "@/types";

type ToggleStatusModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
};

export function ToggleStatusModal({ open, onOpenChange, product }: ToggleStatusModalProps) {
  const toggleActive = useToggleProductActive();
  const isDeactivating = product.active;
  const actionLabel = isDeactivating ? "Desactivar producto" : "Reactivar producto";

  const handleConfirm = () => {
    const promise = toggleActive.mutateAsync(
      { id: product.id, active: !product.active },
      { onSuccess: () => onOpenChange(false) },
    );

    toast.promise(promise, {
      loading: isDeactivating ? "Desactivando producto..." : "Reactivando producto...",
      success: isDeactivating ? "Producto desactivado correctamente" : "Producto reactivado correctamente",
      error: isDeactivating ? "Error al desactivar el producto" : "Error al reactivar el producto",
    });
  };

  return (
    <ResponsiveAlertModal
      open={open}
      onOpenChange={onOpenChange}
      title={actionLabel}
      description={
        isDeactivating
          ? "Dejará de estar disponible para nuevas cargas, pero podrá venderse mientras tenga stock."
          : "Volverá a estar disponible para operaciones de inventario."
      }
      confirmLabel={actionLabel}
      isPending={toggleActive.isPending}
      onConfirm={handleConfirm}
      variant={isDeactivating ? "danger" : "default"}
    >
      <section className="bg-card overflow-hidden rounded-md border text-xs">
        <div className="border-b px-3 py-2.5">
          <ModalProductIdentity code={product.code} description={product.description} />
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="text-muted-foreground font-medium">Estado</span>
          <span className="flex items-center gap-2">
            <Badge variant={isDeactivating ? "success" : "secondary"}>{isDeactivating ? "Activo" : "Inactivo"}</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant={isDeactivating ? "secondary" : "success"}>{isDeactivating ? "Inactivo" : "Activo"}</Badge>
          </span>
        </div>
      </section>
    </ResponsiveAlertModal>
  );
}
