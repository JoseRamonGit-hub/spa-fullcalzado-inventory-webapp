import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { TableHead } from "@/components/ui/table";
import { ResponsiveModal } from "@/components/modals/shared/responsive-modal";
import { ConfirmDialogTableSection, ModalConfirmDialog } from "@/components/modals/shared/modal-ui";
import { useAppForm } from "@/hooks/form";
import { useUpdateProductCatalog } from "@/features/inventory/hooks/useProductMutations";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { Product } from "@/types";

const REQUIRED = "Requerido";
const MIN_PRICE = 0;
const MAX_PRICE = 9_999_999_999.99;
const MAX_CODE_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 120;

type EditProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
};

type PendingChanges = {
  code: string;
  description: string;
  priceUsd: number;
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
  return changes;
}

function validateRequiredText(value: string, maxLength: number) {
  const normalizedValue = value.trim();
  if (!normalizedValue) return REQUIRED;
  if (normalizedValue.length > maxLength) return `Máximo ${maxLength} caracteres`;
  return undefined;
}

function validatePrice(value: number) {
  if (!Number.isFinite(value)) return "Indica un precio válido";
  if (value < MIN_PRICE) return "El precio no puede ser negativo";
  if (value > MAX_PRICE) return "El precio supera el máximo permitido";
  return undefined;
}

export function EditProductModal({ open, onOpenChange, product }: EditProductModalProps) {
  const updateProduct = useUpdateProductCatalog();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<PendingChanges | null>(null);
  const submissionGuard = useRef(false);

  const form = useAppForm({
    defaultValues: {
      code: product.code,
      description: product.description,
      priceUsd: product.price_usd,
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
    if (!pendingValues || submissionGuard.current) return;
    submissionGuard.current = true;

    const promise = updateProduct
      .mutateAsync(
        {
          p_product_id: product.id,
          p_code: pendingValues.code.trim(),
          p_description: pendingValues.description.trim(),
          p_price_usd: pendingValues.priceUsd,
        },
        {
          onSuccess: () => {
            setConfirmOpen(false);
            setPendingValues(null);
            onOpenChange(false);
          },
        },
      )
      .finally(() => {
        submissionGuard.current = false;
      });

    toast.promise(promise, {
      loading: "Actualizando datos del producto…",
      success: "Datos del producto actualizados",
      error: (error: Error) => error.message || "No pudimos actualizar los datos del producto.",
    });
  };

  const handleModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && updateProduct.isPending) return;
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
        title="Editar datos del producto"
        description="Actualiza el código, la descripción y el precio. Las existencias se ajustan por separado."
        avoidCloseFromOutsideClick={updateProduct.isPending}
        avoidCloseFromEsc={updateProduct.isPending}
        dialogClassName="sm:max-w-xl"
        headerClassName="px-6 pt-5 pb-4"
        titleClassName="text-base font-semibold normal-case tracking-normal"
        bodyClassName="px-4 py-5 sm:px-6"
        footerClassName="py-4"
        footer={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={updateProduct.isPending}
              onClick={() => handleModalOpenChange(false)}
            >
              Cancelar
            </Button>
            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
                values: state.values,
              })}
            >
              {({ canSubmit, isSubmitting, values }) => {
                const hasChanges = getChangedFields(product, values).length > 0;

                return (
                  <Button
                    type="submit"
                    form="edit-product-form"
                    disabled={!canSubmit || !hasChanges || isSubmitting || updateProduct.isPending}
                  >
                    Revisar cambios
                  </Button>
                );
              }}
            </form.Subscribe>
          </div>
        }
      >
        <form id="edit-product-form" onSubmit={handleFormSubmit} className="flex flex-col gap-5">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <OverflowTooltip className="text-sm font-medium">{product.description}</OverflowTooltip>
              <p className="product-code mt-0.5 uppercase">{product.code}</p>
            </div>
            <Badge variant={product.active ? "success" : "secondary"} className="shrink-0">
              {product.active ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <form.AppField
            name="description"
            validators={{
              onBlur: ({ value }) => validateRequiredText(value, MAX_DESCRIPTION_LENGTH),
              onSubmit: ({ value }) => validateRequiredText(value, MAX_DESCRIPTION_LENGTH),
              onChange: ({ value, fieldApi }) =>
                fieldApi.state.meta.isTouched ? validateRequiredText(value, MAX_DESCRIPTION_LENGTH) : undefined,
            }}
          >
            {(field) => (
              <field.TextField
                label="Descripción"
                compact
                required
                maxLength={MAX_DESCRIPTION_LENGTH}
                className="h-9 w-full text-sm"
                autoComplete="off"
              />
            )}
          </form.AppField>

          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <form.AppField
              name="code"
              validators={{
                onBlur: ({ value }) => validateRequiredText(value, MAX_CODE_LENGTH),
                onSubmit: ({ value }) => validateRequiredText(value, MAX_CODE_LENGTH),
                onChange: ({ value, fieldApi }) =>
                  fieldApi.state.meta.isTouched ? validateRequiredText(value, MAX_CODE_LENGTH) : undefined,
              }}
            >
              {(field) => (
                <field.TextField
                  label="Código"
                  compact
                  required
                  maxLength={MAX_CODE_LENGTH}
                  className="h-9 text-sm uppercase"
                  autoComplete="off"
                />
              )}
            </form.AppField>
            <form.AppField
              name="priceUsd"
              validators={{
                onBlur: ({ value }) => validatePrice(value),
                onSubmit: ({ value }) => validatePrice(value),
                onChange: ({ value, fieldApi }) => (fieldApi.state.meta.isTouched ? validatePrice(value) : undefined),
              }}
            >
              {(field) => (
                <field.NumberField
                  label="Precio USD"
                  compact
                  step="0.01"
                  min={String(MIN_PRICE)}
                  max={String(MAX_PRICE)}
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
        title="Confirmar cambios de datos"
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
                <TableHead className="py-1.5">Campo</TableHead>
                <TableHead className="py-1.5">Actual</TableHead>
                <TableHead className="py-1.5">Nuevo</TableHead>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {changedFields.map((change) => (
                <tr key={change.label} className="bg-card">
                  <td className="px-3 py-2 font-medium">{change.label}</td>
                  <td className="max-w-48 px-3 py-2">
                    <OverflowTooltip className="text-muted-foreground">{change.from}</OverflowTooltip>
                  </td>
                  <td className="max-w-48 px-3 py-2">
                    <OverflowTooltip className="font-semibold">{change.to}</OverflowTooltip>
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
