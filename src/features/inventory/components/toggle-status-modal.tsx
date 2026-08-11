import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialogSummarySection } from "@/components/modals/shared/modal-ui";
import { ConfirmationModal, ConfirmationProductIdentity } from "@/components/modals/shared/confirmation-modal";
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
  const confirmationTitle = isDeactivating ? "Confirmar desactivación" : "Confirmar reactivación";

  const handleConfirm = () => {
    const promise = toggleActive.mutateAsync(
      { id: product.id, active: !product.active },
      { onSuccess: () => onOpenChange(false) },
    );

    toast.promise(promise, {
      loading: isDeactivating ? "Desactivando producto…" : "Reactivando producto…",
      success: isDeactivating ? "Producto desactivado" : "Producto reactivado",
      error: isDeactivating
        ? "No pudimos desactivar el producto. Vuelve a intentarlo."
        : "No pudimos reactivar el producto. Vuelve a intentarlo.",
    });
  };

  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      presentation="direct"
      title={confirmationTitle}
      description={
        isDeactivating
          ? "No podrás registrar nuevas entradas para este producto. Podrás seguir vendiendo las existencias disponibles y registrando devoluciones."
          : "Podrás volver a registrar entradas para este producto. Las ventas y devoluciones seguirán disponibles."
      }
      confirmLabel={actionLabel}
      pendingLabel={isDeactivating ? "Desactivando…" : "Reactivando…"}
      isPending={toggleActive.isPending}
      onConfirm={handleConfirm}
      variant={isDeactivating ? "danger" : "default"}
    >
      <ConfirmDialogSummarySection className="bg-card gap-0 overflow-hidden p-0">
        <div className="border-border/60 border-b px-3 py-3">
          <ConfirmationProductIdentity code={product.code} description={product.description} />
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="text-muted-foreground font-medium">Estado</span>
          <span className="flex items-center gap-2">
            <Badge variant={isDeactivating ? "success" : "secondary"}>{isDeactivating ? "Activo" : "Inactivo"}</Badge>
            <ArrowRight className="text-muted-foreground size-3.5" aria-hidden="true" />
            <Badge variant={isDeactivating ? "secondary" : "success"}>{isDeactivating ? "Inactivo" : "Activo"}</Badge>
          </span>
        </div>
      </ConfirmDialogSummarySection>
    </ConfirmationModal>
  );
}
