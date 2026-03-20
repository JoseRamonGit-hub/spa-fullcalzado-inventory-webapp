import { useState, useCallback, useRef } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { Button } from "@/components/ui/button";
import {
  ConfirmDialogSummarySection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";
import { useAppForm } from "@/hooks/form";
import { useUpdateProduct } from "@/features/inventory/hooks/useProducts";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { Product } from "@/types";

const REQUIRED = "Requerido";
const INVALID = "Inválido";
const MIN_PRICE = 0;
const MIN_STOCK = 0;

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

interface PendingChanges {
  code: string;
  description: string;
  priceUsd: number;
  stock: number;
}

type ChangedField = { label: string; from: string; to: string };

function getChangedFields(product: Product, values: PendingChanges): ChangedField[] {
  const changes: ChangedField[] = [];
  if (values.code.trim() !== product.code) {
    changes.push({ label: "Código", from: product.code, to: values.code.trim() });
  }
  if (values.description.trim() !== product.description) {
    changes.push({ label: "Descripción", from: product.description, to: values.description.trim() });
  }
  if (values.priceUsd !== product.price_usd) {
    changes.push({
      label: "Precio USD",
      from: formatCurrencyUSD(product.price_usd),
      to: formatCurrencyUSD(values.priceUsd),
    });
  }
  if (values.stock !== product.stock) {
    changes.push({ label: "Stock", from: String(product.stock), to: String(values.stock) });
  }
  return changes;
}

export function EditProductModal({ open, onOpenChange, product }: EditProductModalProps) {
  const updateProduct = useUpdateProduct();
  const currentUser = useAuthStore((state) => state.user);
  const formRef = useRef<HTMLFormElement>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<PendingChanges | null>(null);

  const form = useAppForm({
    defaultValues: {
      code: product.code,
      description: product.description,
      priceUsd: product.price_usd,
      stock: product.stock,
    },
    onSubmit: async ({ value }) => {
      const changes = getChangedFields(product, value);
      if (changes.length === 0) {
        toast.info("No se detectaron cambios.");
        return;
      }
      setPendingValues(value);
      setConfirmOpen(true);
    },
  });

  const handleConfirmSubmit = useCallback(() => {
    if (!pendingValues || !currentUser) return;

    const promise = updateProduct.mutateAsync({
      p_product_id: product.id,
      p_code: pendingValues.code.trim(),
      p_description: pendingValues.description.trim(),
      p_price_usd: pendingValues.priceUsd,
      p_stock: pendingValues.stock,
      p_user_id: currentUser.id,
    });

    toast.promise(promise, {
      loading: "Actualizando producto...",
      success: "Producto actualizado correctamente",
      error: "Error al actualizar el producto",
    });

    promise.then(() => {
      setConfirmOpen(false);
      setPendingValues(null);
      onOpenChange(false);
    });
  }, [pendingValues, currentUser, updateProduct, product.id, onOpenChange]);

  const handleModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setPendingValues(null);
      setConfirmOpen(false);
    }
    onOpenChange(isOpen);
  };

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  const changedFields = pendingValues ? getChangedFields(product, pendingValues) : [];

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleModalClose}
        title="Editar Producto"
        footer={
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" form="edit-product-form" className="mt-1 h-9 w-full gap-2" disabled={!canSubmit || isSubmitting}>
                <Pencil className="h-4 w-4" />
                Guardar Cambios
              </Button>
            )}
          </form.Subscribe>
        }
      >
        <form id="edit-product-form" ref={formRef} onSubmit={handleFormSubmit} className="flex flex-col gap-3 p-4">
          <form.AppField
            name="code"
            validators={{
              onChange: ({ value }) => (!value.trim() ? REQUIRED : undefined),
            }}
          >
            {(field) => (
              <field.TextField label="Código" compact required className="h-9 text-sm uppercase" autoComplete="off" />
            )}
          </form.AppField>

          <form.AppField
            name="description"
            validators={{
              onChange: ({ value }) => (!value.trim() ? REQUIRED : undefined),
            }}
          >
            {(field) => (
              <field.TextField label="Descripción" compact required className="h-9 text-sm" autoComplete="off" />
            )}
          </form.AppField>

          <fieldset className="m-0 grid grid-cols-2 gap-3 border-0 p-0">
            <form.AppField
              name="priceUsd"
              validators={{
                onChange: ({ value }) => {
                  if (value === undefined || value === null || String(value) === "") return REQUIRED;
                  if (value < MIN_PRICE) return INVALID;
                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.NumberField
                  label="Precio USD"
                  compact
                  step="0.01"
                  min={String(MIN_PRICE)}
                  required
                  className="h-9 text-sm tabular-nums"
                />
              )}
            </form.AppField>

            <form.AppField
              name="stock"
              validators={{
                onChange: ({ value }) => {
                  if (value === undefined || value === null || String(value) === "") return REQUIRED;
                  if (value < MIN_STOCK) return INVALID;
                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.NumberField
                  label="Stock"
                  compact
                  step="1"
                  min={String(MIN_STOCK)}
                  required
                  className="h-9 text-sm tabular-nums"
                />
              )}
            </form.AppField>
          </fieldset>
        </form>
      </ResponsiveModal>

      <ModalConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={<Pencil className="text-primary" />}
        title="¿Confirmar edición?"
        description={
          <>
            Estás a punto de modificar{" "}
            <strong className="text-foreground">
              {changedFields.length} campo{changedFields.length > 1 ? "s" : ""}
            </strong>{" "}
            del producto:
          </>
        }
        confirmLabel="Confirmar cambios"
        pendingLabel="Guardando..."
        isSubmissionPending={updateProduct.isPending}
        onConfirmSubmit={handleConfirmSubmit}
        contentClassName="max-w-md"
      >
        <ConfirmDialogSummarySection>
          <div className="mb-2">
            <ModalProductIdentity code={product.code} description={product.description} />
          </div>
          <div className="divide-border divide-y">
            {changedFields.map((change) => (
              <div key={change.label} className="flex items-baseline justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                <span className="text-muted-foreground shrink-0 font-medium">{change.label}</span>
                <span className="inline-flex items-center gap-1.5 text-right tabular-nums">
                  <span className="text-muted-foreground line-through">{change.from}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-foreground font-medium">{change.to}</span>
                </span>
              </div>
            ))}
          </div>
        </ConfirmDialogSummarySection>
      </ModalConfirmDialog>
    </>
  );
}
