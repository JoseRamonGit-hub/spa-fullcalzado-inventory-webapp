import { ResponsiveAlertModal } from "@/components/ResponsiveAlertModal";
import { useToggleProductActive } from "@/features/inventory/hooks/useProductMutations";
import { toast } from "sonner";
import type { Product } from "@/types";

type ToggleStatusModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
};

export function ToggleStatusModal({ open, onOpenChange, product }: ToggleStatusModalProps) {
  const toggleActive = useToggleProductActive();
  const isDeactivating = product.active;

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
      title={isDeactivating ? "Desactivar Producto" : "Reactivar Producto"}
      description={
        isDeactivating
          ? `¿Estás seguro de que deseas desactivar "${product.code} — ${product.description}"? No podrá recibir cargas de inventario, pero sí podrá venderse si tiene stock.`
          : `¿Deseas reactivar "${product.code} — ${product.description}"? Volverá a estar disponible para operaciones de inventario.`
      }
      onConfirm={handleConfirm}
      confirmLabel={isDeactivating ? "Desactivar" : "Reactivar"}
      cancelLabel="Cancelar"
      variant={isDeactivating ? "danger" : "default"}
      isPending={toggleActive.isPending}
    />
  );
}
