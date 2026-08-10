import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/modals/shared/responsive-modal";
import {
  ConfirmDialogSummarySection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";
import { useAdjustProductStock } from "@/features/inventory/hooks/useProductMutations";
import { useAppForm } from "@/hooks/form";
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
  if (!Number.isFinite(value)) return "Indica una cantidad válida";
  if (!Number.isInteger(value)) return "Usa un número entero";
  if (value < 0) return "Las existencias no pueden ser negativas";
  return undefined;
}

function validateReason(value: string) {
  const reason = value.trim();
  if (!reason) return undefined;
  if (reason.length < MIN_REASON_LENGTH) return `Indica al menos ${MIN_REASON_LENGTH} caracteres`;
  if (reason.length > MAX_REASON_LENGTH) return `Máximo ${MAX_REASON_LENGTH} caracteres`;
  return undefined;
}

function normalizeReason(value: string) {
  return value.trim() || DEFAULT_ADJUSTMENT_REASON;
}

function formatDelta(delta: number) {
  if (delta === 0) return "Sin cambio";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
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
      if (value.stock === product.stock) {
        toast.info("Las nuevas existencias deben ser diferentes a las actuales.");
        return;
      }

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
      loading: "Ajustando existencias…",
      success: "Existencias ajustadas",
      error: (error: Error) => error.message || "No pudimos ajustar las existencias.",
    });
  };

  const confirmedDelta = pendingAdjustment ? pendingAdjustment.stock - product.stock : 0;

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleModalOpenChange}
        title="Ajustar existencias"
        description="Corrige el total disponible. El ajuste quedará registrado en el historial."
        dialogClassName="sm:max-w-lg"
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
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  form="adjust-product-stock-form"
                  disabled={!canSubmit || isSubmitting || adjustStock.isPending}
                >
                  Revisar ajuste
                </Button>
              )}
            </form.Subscribe>
          </div>
        }
      >
        <form id="adjust-product-stock-form" onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <header className="bg-muted/30 flex min-w-0 items-center justify-between gap-3 rounded-md px-3 py-2.5">
            <ModalProductIdentity code={product.code} description={product.description} />
            <Badge variant={product.active ? "success" : "secondary"}>{product.active ? "Activo" : "Inactivo"}</Badge>
          </header>

          <form.Subscribe selector={(state) => state.values.stock}>
            {(nextStock) => {
              const delta = nextStock - product.stock;

              return (
                <section
                  className="grid grid-cols-[minmax(3.5rem,0.75fr)_minmax(6.5rem,1fr)_auto] items-end gap-3 border-y py-3"
                  aria-label="Cambio de existencias"
                >
                  <div className="flex min-w-0 flex-col gap-1 pb-0.5">
                    <span className="text-muted-foreground text-[10px] leading-tight font-semibold tracking-wider uppercase">
                      Actual
                    </span>
                    <strong className="flex h-9 items-center text-base font-semibold tabular-nums">
                      {product.stock}
                    </strong>
                  </div>

                  <form.AppField
                    name="stock"
                    validators={{
                      onBlur: ({ value }) => validateStock(value),
                      onSubmit: ({ value }) => validateStock(value),
                      onChange: ({ value, fieldApi }) =>
                        fieldApi.state.meta.isTouched ? validateStock(value) : undefined,
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
                        className="h-9 text-sm tabular-nums"
                      />
                    )}
                  </form.AppField>

                  <div className="flex min-w-0 flex-col gap-1 pb-0.5">
                    <span className="text-muted-foreground text-[10px] leading-tight font-semibold tracking-wider uppercase">
                      Diferencia
                    </span>
                    <span className="flex h-9 items-center" role="status" aria-live="polite">
                      <Badge variant={delta > 0 ? "success" : delta < 0 ? "destructive" : "secondary"}>
                        {Number.isFinite(delta) ? formatDelta(delta) : "—"}
                      </Badge>
                    </span>
                  </div>
                </section>
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
            {(field) => (
              <field.TextareaField
                label="Motivo (opcional)"
                description="Si lo dejas vacío, el historial mostrará «Sin motivo indicado»."
                placeholder="Ej.: Corrección por conteo físico"
                compact
                descriptionBelow
                maxLength={MAX_REASON_LENGTH}
                autoComplete="off"
                rows={2}
                className="min-h-16 resize-y text-sm"
              />
            )}
          </form.AppField>
        </form>
      </ResponsiveModal>

      <ModalConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar ajuste de existencias"
        description="El cambio quedará registrado con tu usuario en el historial del producto."
        confirmLabel="Aplicar ajuste"
        pendingLabel="Ajustando…"
        isSubmissionPending={adjustStock.isPending}
        onConfirmSubmit={handleConfirmSubmit}
        contentClassName="data-[size=default]:sm:max-w-lg"
      >
        <ConfirmDialogSummarySection className="gap-2">
          <div className="grid grid-cols-3 gap-3">
            <span>
              <span className="text-muted-foreground block">Actual</span>
              <strong className="text-sm tabular-nums">{product.stock}</strong>
            </span>
            <span>
              <span className="text-muted-foreground block">Nuevo</span>
              <strong className="text-sm tabular-nums">{pendingAdjustment?.stock ?? product.stock}</strong>
            </span>
            <span>
              <span className="text-muted-foreground block">Diferencia</span>
              <strong className="text-sm tabular-nums">{formatDelta(confirmedDelta)}</strong>
            </span>
          </div>
          <div className="border-border/60 border-t pt-2">
            <span className="text-muted-foreground block">Motivo</span>
            <strong className="text-foreground break-words">{pendingAdjustment?.reason}</strong>
          </div>
        </ConfirmDialogSummarySection>
      </ModalConfirmDialog>
    </>
  );
}
