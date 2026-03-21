import { ResponsiveAlertModal } from "@/components/ResponsiveAlertModal";
import { useDeleteProduct } from "@/features/inventory/hooks/useProductMutations";
import { toast } from "sonner";
import type { Product } from "@/types";

type DeleteProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
};

export function DeleteProductModal({ open, onOpenChange, product }: DeleteProductModalProps) {
  const deleteProduct = useDeleteProduct();

  const handleConfirm = () => {
    const promise = deleteProduct.mutateAsync(product.id, {
      onSuccess: () => onOpenChange(false),
    });

    toast.promise(promise, {
      loading: "Eliminando producto...",
      success: "Producto eliminado correctamente",
      error: "Error al eliminar el producto",
    });
  };

  return (
    <ResponsiveAlertModal
      open={open}
      onOpenChange={onOpenChange}
      title="Eliminar Producto"
      description={`¿Estás seguro de que deseas eliminar "${product.code} — ${product.description}"? Esta acción no se puede deshacer.`}
      onConfirm={handleConfirm}
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      variant="danger"
      isPending={deleteProduct.isPending}
    />
  );
}
