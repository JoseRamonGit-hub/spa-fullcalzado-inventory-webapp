import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveModal } from "@/components/modals/shared/responsive-modal";
import { ConfirmDialogSummarySection } from "@/components/modals/shared/modal-ui";
import { ConfirmationModal, ConfirmationProductIdentity } from "@/components/modals/shared/confirmation-modal";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { COMPACT_FIELD_LABEL_CLASS_NAME } from "@/components/forms/field-wrapper";
import { useAdjustProductStock } from "@/features/inventory/hooks/useProductMutations";
import { useAppForm } from "@/hooks/form";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 240;
const DEFAULT_ADJUSTMENT_REASON = "Sin motivo indicado";

type AdjustProductStockModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
};

type PendingAdjustment = {
  stock: number;
  reason: string;
};

function validateStock(value: number) {
  if (!Number.isFinite(value)) return "Ingresa un total válido";
  if (!Number.isInteger(value)) return "Usa un número entero";
  if (value < 0) return "Las existencias no pueden ser negativas";
  return undefined;
}

function validateReason(value: string) {
  const reason = value.trim();
  if (!reason) return undefined;
  if (reason.length < MIN_REASON_LENGTH) return `Escribe al menos ${MIN_REASON_LENGTH} caracteres`;
  if (reason.length > MAX_REASON_LENGTH) return `Usa hasta ${MAX_REASON_LENGTH} caracteres`;
  return undefined;
}

function normalizeReason(value: string) {
  return value.trim() || DEFAULT_ADJUSTMENT_REASON;
}

function formatDelta(delta: number) {
  if (delta === 0) return "Sin cambios";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
}

function describeStockChange(currentStock: number, nextStock: number) {
  if (!Number.isFinite(nextStock)) return "Ingresa un total válido para continuar.";

  const delta = nextStock - currentStock;
  if (delta === 0) return "Cambia el total para continuar.";

  const direction = delta > 0 ? "aumentarán" : "se reducirán";
  const change = `Las existencias ${direction} de ${currentStock} a ${nextStock} (${formatDelta(delta)}).`;
  return nextStock === 0 ? `${change} El producto quedará sin existencias.` : change;
}

function getStockChangeSurfaceClass(currentStock: number, nextStock: number) {
  if (!Number.isFinite(nextStock) || nextStock === currentStock) return "bg-muted/40";
  if (nextStock === 0) return "bg-warning/15";
  return nextStock > currentStock ? "bg-success/10" : "bg-destructive/10";
}

export function AdjustProductStockModal({ open, onOpenChange, product }: AdjustProductStockModalProps) {
  const adjustStock = useAdjustProductStock();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);
  const submissionGuard = useRef(false);

  const form = useAppForm({
    defaultValues: {
      stock: product.stock,
      reason: "",
    },
    onSubmit: async ({ value }) => {
      if (value.stock === product.stock) return;
      setPendingAdjustment({ stock: value.stock, reason: normalizeReason(value.reason) });
      setConfirmOpen(true);
    },
  });

  const handleModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && adjustStock.isPending) return;
    if (!nextOpen) {
      form.reset();
      setPendingAdjustment(null);
      setConfirmOpen(false);
    }
    onOpenChange(nextOpen);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

  const handleConfirmSubmit = () => {
    if (!pendingAdjustment || submissionGuard.current) return;
    submissionGuard.current = true;

    const promise = adjustStock
      .mutateAsync(
        {
          p_product_id: product.id,
          p_expected_stock: product.stock,
          p_new_stock: pendingAdjustment.stock,
          p_reason: pendingAdjustment.reason,
        },
        {
          onSuccess: () => {
            setConfirmOpen(false);
            setPendingAdjustment(null);
            onOpenChange(false);
          },
        },
      )
      .finally(() => {
        submissionGuard.current = false;
      });

    void promise.catch((error: unknown) => {
      if (error instanceof Error && error.message.startsWith("Las existencias cambiaron")) {
        setConfirmOpen(false);
        setPendingAdjustment(null);
        onOpenChange(false);
      }
    });

    toast.promise(promise, {
      loading: "Aplicando ajuste de existencias…",
      success: "Ajuste de existencias aplicado",
      error: (error: Error) => error.message || "No pudimos aplicar el ajuste de existencias. Vuelve a intentarlo.",
    });
  };

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleModalOpenChange}
        title="Ajustar existencias"
        description="Ingresa el nuevo total disponible del producto."
        dialogClassName="sm:max-w-lg"
        headerClassName="px-6 pt-5 pb-4"
        titleClassName="text-base font-semibold normal-case tracking-normal"
        bodyClassName="px-4 py-5 sm:px-6"
        footerClassName="py-4"
        avoidCloseFromOutsideClick={adjustStock.isPending}
        avoidCloseFromEsc={adjustStock.isPending}
        footer={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={adjustStock.isPending}
              onClick={() => handleModalOpenChange(false)}
            >
              Cancelar
            </Button>
            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
                nextStock: state.values.stock,
              })}
            >
              {({ canSubmit, isSubmitting, nextStock }) => (
                <Button
                  type="submit"
                  form="adjust-product-stock-form"
                  disabled={!canSubmit || isSubmitting || adjustStock.isPending || nextStock === product.stock}
                >
                  Revisar ajuste
                </Button>
              )}
            </form.Subscribe>
          </div>
        }
      >
        <form id="adjust-product-stock-form" onSubmit={handleFormSubmit} className="flex flex-col gap-5">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <OverflowTooltip className="text-sm font-medium">{product.description}</OverflowTooltip>
              <p className="product-code mt-0.5 uppercase">{product.code}</p>
            </div>
            <Badge variant={product.active ? "success" : "secondary"} className="shrink-0">
              {product.active ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <form.Subscribe selector={(state) => state.values.stock}>
            {(nextStock) => {
              return (
                <div className="border-y py-4">
                  <section className="grid grid-cols-2 items-start gap-3" aria-label="Cambio de existencias">
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <span className={COMPACT_FIELD_LABEL_CLASS_NAME}>Total actual</span>
                      <strong className="bg-muted/40 border-input flex h-9 items-center rounded-md border px-3 font-mono text-sm font-semibold tabular-nums">
                        {product.stock}
                      </strong>
                    </div>

                    <form.AppField
                      name="stock"
                      validators={{
                        onBlur: ({ value }) => validateStock(value),
                        onSubmit: ({ value }) => validateStock(value),
                        onChange: ({ value }) => validateStock(value),
                      }}
                    >
                      {(field) => (
                        <field.NumberField
                          label="Nuevo total"
                          compact
                          showZero
                          step="1"
                          min="0"
                          required
                          autoFocus
                          emptyValue={Number.NaN}
                          className="h-9 font-mono text-sm font-semibold tabular-nums"
                        />
                      )}
                    </form.AppField>
                  </section>
                  {Number.isFinite(nextStock) ? (
                    <p
                      className={cn(
                        "text-foreground mt-3 rounded-md px-3 py-2 text-xs leading-relaxed font-medium transition-colors duration-150 motion-reduce:transition-none",
                        getStockChangeSurfaceClass(product.stock, nextStock),
                      )}
                      role="status"
                    >
                      {describeStockChange(product.stock, nextStock)}
                    </p>
                  ) : null}
                </div>
              );
            }}
          </form.Subscribe>

          <form.AppField
            name="reason"
            validators={{
              onBlur: ({ value }) => validateReason(value),
              onSubmit: ({ value }) => validateReason(value),
              onChange: ({ value, fieldApi }) => (fieldApi.state.meta.isTouched ? validateReason(value) : undefined),
            }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={field.name} className={COMPACT_FIELD_LABEL_CLASS_NAME}>
                    Motivo (opcional)
                  </Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Ej.: Corrección por conteo físico"
                    maxLength={MAX_REASON_LENGTH}
                    autoComplete="off"
                    rows={2}
                    aria-invalid={isInvalid}
                    aria-describedby={`${field.name}-description`}
                    className="min-h-16 resize-y text-sm"
                  />
                  {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  <p id={`${field.name}-description`} className="text-muted-foreground text-xs leading-relaxed">
                    Si lo dejas vacío, se guardará como “Sin motivo indicado” en el historial.
                  </p>
                </div>
              );
            }}
          </form.AppField>
        </form>
      </ResponsiveModal>

      <ConfirmationModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        presentation="review"
        title="Confirmar ajuste de existencias"
        description="Confirma el nuevo total y el motivo antes de ajustar las existencias."
        confirmLabel="Aplicar ajuste"
        pendingLabel="Aplicando ajuste…"
        isPending={adjustStock.isPending}
        onConfirm={handleConfirmSubmit}
        contentClassName="data-[size=default]:sm:max-w-lg"
      >
        <ConfirmDialogSummarySection className="bg-card gap-0 overflow-hidden p-0">
          <div className="border-border/60 border-b px-3 py-3">
            <ConfirmationProductIdentity code={product.code} description={product.description} />
          </div>
          <div className="border-border/60 grid grid-cols-2 divide-x">
            <span className="px-3 py-3">
              <span className="text-muted-foreground block">Total actual</span>
              <strong className="text-muted-foreground font-mono text-sm font-semibold tabular-nums">
                {product.stock}
              </strong>
            </span>
            <span className="px-3 py-3">
              <span className="text-muted-foreground block">Nuevo total</span>
              <strong className="font-mono text-sm tabular-nums">{pendingAdjustment?.stock ?? product.stock}</strong>
            </span>
          </div>
          <p
            className={cn(
              "border-border/60 text-foreground border-t px-3 py-2 text-xs leading-relaxed font-medium",
              getStockChangeSurfaceClass(product.stock, pendingAdjustment?.stock ?? product.stock),
            )}
          >
            {describeStockChange(product.stock, pendingAdjustment?.stock ?? product.stock)}
          </p>
          <div className="border-border/60 border-t px-3 py-3">
            <span className="text-muted-foreground block">Motivo</span>
            <strong
              className={cn(
                "break-words",
                pendingAdjustment?.reason === DEFAULT_ADJUSTMENT_REASON
                  ? "text-muted-foreground font-medium"
                  : "text-foreground",
              )}
            >
              {pendingAdjustment?.reason}
            </strong>
          </div>
        </ConfirmDialogSummarySection>
      </ConfirmationModal>
    </>
  );
}
