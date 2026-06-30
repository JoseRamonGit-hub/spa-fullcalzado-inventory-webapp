import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/modals/shared/responsive-modal";
import {
  ConfirmDialogTableSection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";
import { useAppForm } from "@/hooks/form";
import { useUpdateProduct } from "@/features/inventory/hooks/useProductMutations";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { Product } from "@/types";

const REQUIRED = "Requerido";
const INVALID = "Inválido";
const MIN_PRICE = 0;
const MIN_STOCK = 0;

type EditProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
};

type PendingChanges = {
  code: string;
  description: string;
  priceUsd: number;
  stock: number;
};

type ChangedField = {
  label: string;
  from: string;
  to: string;
};

function getChangedFields(product: Product, values: PendingChanges): ChangedField[] {
  const changes: ChangedField[] = [];
  const nextCode = values.code.trim();
  const nextDescription = values.description.trim();

  if (nextCode !== product.code) {
    changes.push({ label: "Código", from: product.code, to: nextCode });
  }
  if (nextDescription !== product.description) {
    changes.push({ label: "Descripción", from: product.description, to: nextDescription });
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
      if (getChangedFields(product, value).length === 0) {
        toast.info("No se detectaron cambios.");
        return;
      }

      setPendingValues(value);
      setConfirmOpen(true);
    },
  });

  const handleConfirmSubmit = () => {
    if (!pendingValues || !currentUser) return;

    const promise = updateProduct.mutateAsync(
      {
        p_product_id: product.id,
        p_code: pendingValues.code.trim(),
        p_description: pendingValues.description.trim(),
        p_price_usd: pendingValues.priceUsd,
        p_stock: pendingValues.stock,
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setPendingValues(null);
          onOpenChange(false);
        },
      },
    );

    toast.promise(promise, {
      loading: "Actualizando producto...",
      success: "Producto actualizado correctamente",
      error: "Error al actualizar el producto",
    });
  };

  const handleModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset();
      setPendingValues(null);
      setConfirmOpen(false);
    }
    onOpenChange(nextOpen);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

  const changedFields = pendingValues ? getChangedFields(product, pendingValues) : [];
  const hasMultipleChanges = changedFields.length !== 1;

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleModalOpenChange}
        title="Editar producto"
        description="Modifica la información del producto seleccionado."
        dialogClassName="sm:max-w-xl"
        footer={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button type="button" variant="outline" onClick={() => handleModalOpenChange(false)}>
              Cancelar
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  form="edit-product-form"
                  disabled={!canSubmit || isSubmitting || updateProduct.isPending}
                >
                  Revisar cambios
                </Button>
              )}
            </form.Subscribe>
          </div>
        }
      >
        <form id="edit-product-form" onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <header className="flex min-w-0 items-center justify-between gap-3 border-b pb-3">
            <ModalProductIdentity code={product.code} description={product.description} />
            <Badge variant={product.active ? "success" : "secondary"}>{product.active ? "Activo" : "Inactivo"}</Badge>
          </header>

          <div className="grid min-w-0 gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <form.AppField
              name="code"
              validators={{
                onBlur: ({ value }) => (!value.trim() ? REQUIRED : undefined),
                onChange: ({ value, fieldApi }) =>
                  fieldApi.state.meta.isTouched && !value.trim() ? REQUIRED : undefined,
              }}
            >
              {(field) => (
                <field.TextField label="Código" compact required className="h-9 text-sm uppercase" autoComplete="off" />
              )}
            </form.AppField>

            <form.AppField
              name="description"
              validators={{
                onBlur: ({ value }) => (!value.trim() ? REQUIRED : undefined),
                onChange: ({ value, fieldApi }) =>
                  fieldApi.state.meta.isTouched && !value.trim() ? REQUIRED : undefined,
              }}
            >
              {(field) => (
                <field.TextField label="Descripción" compact required className="h-9 text-sm" autoComplete="off" />
              )}
            </form.AppField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <form.AppField
              name="priceUsd"
              validators={{
                onBlur: ({ value }) => (value < MIN_PRICE ? INVALID : undefined),
                onChange: ({ value, fieldApi }) =>
                  fieldApi.state.meta.isTouched && value < MIN_PRICE ? INVALID : undefined,
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
                onBlur: ({ value }) => (value < MIN_STOCK ? INVALID : undefined),
                onChange: ({ value, fieldApi }) =>
                  fieldApi.state.meta.isTouched && value < MIN_STOCK ? INVALID : undefined,
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
          </div>
        </form>
      </ResponsiveModal>

      <ModalConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar edición"
        description={
          <>
            Se actualizará{hasMultipleChanges ? "n" : ""}{" "}
            <strong className="text-foreground">
              {changedFields.length} {hasMultipleChanges ? "campos" : "campo"}
            </strong>{" "}
            de <strong className="text-foreground">{product.code}</strong>. Revisa los valores.
          </>
        }
        confirmLabel="Guardar cambios"
        pendingLabel="Guardando..."
        isSubmissionPending={updateProduct.isPending}
        onConfirmSubmit={handleConfirmSubmit}
        contentClassName="data-[size=default]:sm:max-w-xl"
      >
        <ConfirmDialogTableSection className="bg-card border-border/80 max-h-56">
          <table className="w-full min-w-120">
            <thead>
              <tr className="bg-muted/35 text-muted-foreground border-b">
                <th className="px-3 py-1.5 text-left font-semibold tracking-wider uppercase">Campo</th>
                <th className="px-3 py-1.5 text-left font-semibold tracking-wider uppercase">Actual</th>
                <th className="px-3 py-1.5 text-left font-semibold tracking-wider uppercase">Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {changedFields.map((change) => (
                <tr key={change.label} className="bg-card">
                  <td className="px-3 py-2 font-medium">{change.label}</td>
                  <td className="text-muted-foreground max-w-48 truncate px-3 py-2" title={change.from}>
                    {change.from}
                  </td>
                  <td className="max-w-48 truncate px-3 py-2 font-semibold" title={change.to}>
                    {change.to}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ConfirmDialogTableSection>
      </ModalConfirmDialog>
    </>
  );
}
