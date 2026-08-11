import { useRef, useState } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { TableHead } from "@/components/ui/table";
import { ResponsiveModal } from "@/components/modals/shared/responsive-modal";
import { ConfirmDialogSummarySection } from "@/components/modals/shared/modal-ui";
import { ConfirmationModal, ConfirmationProductIdentity } from "@/components/modals/shared/confirmation-modal";
import { useAppForm } from "@/hooks/form";
import { useUpdateProductCatalog } from "@/features/inventory/hooks/useProductMutations";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { Product } from "@/types";

const REQUIRED = "Este campo es obligatorio";
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
  if (normalizedValue.length > maxLength) return `Usa hasta ${maxLength} caracteres`;
  return undefined;
}

function validatePrice(value: number) {
  if (!Number.isFinite(value)) return "Ingresa un precio válido";
  if (value < MIN_PRICE) return "El precio debe ser igual o mayor que $0.00";
  if (value > MAX_PRICE) return `El precio no puede superar ${formatCurrencyUSD(MAX_PRICE)}`;
  return undefined;
}

function describePendingChanges(changeCount: number, productCode: string) {
  if (changeCount === 1) {
    return `Se actualizará 1 campo de ${productCode}. Revisa el valor antes de guardar.`;
  }

  return `Se actualizarán ${changeCount} campos de ${productCode}. Revisa los valores antes de guardar.`;
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
        toast.info("No hay cambios por revisar.");
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
      loading: "Guardando cambios del producto…",
      success: "Cambios del producto guardados",
      error: (error: Error) => error.message || "No pudimos guardar los cambios del producto. Vuelve a intentarlo.",
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

      <ConfirmationModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        presentation="review"
        title="Confirmar cambios del producto"
        description={describePendingChanges(changedFields.length, product.code)}
        confirmLabel="Guardar cambios"
        pendingLabel="Guardando cambios…"
        isPending={updateProduct.isPending}
        onConfirm={handleConfirmSubmit}
        contentClassName="data-[size=default]:sm:max-w-xl"
      >
        <ConfirmDialogSummarySection className="bg-card gap-0 overflow-hidden p-0">
          <div className="border-border/60 border-b px-3 py-3">
            <ConfirmationProductIdentity code={product.code} description={product.description} />
          </div>

          <div className="divide-border/60 divide-y sm:hidden" aria-label="Cambios del producto">
            {changedFields.map((change) => (
              <section key={change.label} className="px-3 py-3">
                <h3 className="text-foreground font-medium">{change.label}</h3>
                <div className="mt-2 grid items-start gap-2 min-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <span className="text-muted-foreground block text-[11px] font-medium">Actual</span>
                    <p className="text-muted-foreground mt-0.5 break-words">{change.from}</p>
                  </div>
                  <ArrowDown className="text-muted-foreground mx-auto size-3.5 min-[480px]:hidden" aria-hidden="true" />
                  <ArrowRight
                    className="text-muted-foreground mt-4 hidden size-3.5 min-[480px]:block"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <span className="text-muted-foreground block text-[11px] font-medium">Nuevo</span>
                    <p className="mt-0.5 font-semibold break-words">{change.to}</p>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <table className="hidden w-full sm:table">
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
        </ConfirmDialogSummarySection>
      </ConfirmationModal>
    </>
  );
}
