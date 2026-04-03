import { IterationCcw } from "lucide-react";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ModalFooterActionRow, ModalShortcutActionButton } from "@/components/modals/shared/modal-ui";

type ReturnSummaryFooterProps = {
  hasReturnItems: boolean;
  returnType: "exchange" | "refund";
  creditUsd: number;
  newPurchaseUsd: number;
  differenceUsd: number;
  differenceVes: number;
  currentExchangeRate: number;
  isExchangeRateLoading: boolean;
  isSubmissionPending: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  onOpenConfirmDialog: () => void;
};

export function ReturnSummaryFooter({
  hasReturnItems,
  returnType,
  creditUsd,
  newPurchaseUsd,
  differenceUsd,
  differenceVes,
  currentExchangeRate,
  isExchangeRateLoading,
  isSubmissionPending,
  notes,
  onNotesChange,
  onOpenConfirmDialog,
}: ReturnSummaryFooterProps) {
  const userRole = useAuthStore((s) => s.user?.role);
  const isEmployee = userRole === "employee";
  const isExchangeRateReady = currentExchangeRate > 0;
  const exchangeRateDisplayValue = isExchangeRateReady ? formatCurrencyVES(currentExchangeRate) : "Sin tasa vigente";
  const exchangeRateTitle = isExchangeRateLoading ? "Cargando tasa" : "Tasa no disponible";
  const exchangeRateMessage = isExchangeRateLoading
    ? "Cargando tasa de cambio vigente..."
    : "No hay una tasa de cambio vigente. Actualizala en Ajustes para continuar.";

  // Employees cannot process refunds or negative differences
  const isBlockedByRole = isEmployee && (returnType === "refund" || differenceUsd < 0);

  const isBlockedByExchangeRate = !isExchangeRateReady;
  const canSubmit = hasReturnItems && !isSubmissionPending && !isBlockedByRole && !isBlockedByExchangeRate;

  const buttonLabel =
    returnType === "exchange"
      ? isSubmissionPending
        ? "Registrando..."
        : "Registrar cambio"
      : isSubmissionPending
        ? "Registrando..."
        : "Registrar devolución";

  const blockedTooltip = isBlockedByRole
    ? returnType === "refund"
      ? "Solo un administrador puede procesar devoluciones"
      : "Solo un administrador puede procesar cambios con saldo a favor"
    : isBlockedByExchangeRate
      ? exchangeRateMessage
      : undefined;

  return (
    <footer className="flex w-full flex-col gap-3">
      {!isExchangeRateReady && (
        <section className="border-warning/40 bg-warning/8 rounded-md border px-3 py-2 text-xs">
          <p className="text-warning-foreground font-medium">{exchangeRateTitle}</p>
          <p className="text-muted-foreground mt-1">{exchangeRateMessage}</p>
        </section>
      )}

      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Motivo de la devolución (opcional)"
        className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 h-9 w-full resize-none rounded-md border px-3 py-2 text-xs focus-visible:ring-[3px] focus-visible:outline-none"
        rows={1}
      />

      {/* Summary grid */}
      <section
        className={`bg-background grid gap-2 rounded-md border p-2 ${returnType === "exchange" ? "grid-cols-3 md:grid-cols-4" : "grid-cols-3"}`}
      >
        <div className={`min-w-0 ${returnType === "exchange" ? "hidden md:block" : ""}`}>
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Tasa</p>
          <p className="text-muted-foreground truncate text-[11px] font-medium tabular-nums">
            {exchangeRateDisplayValue}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Crédito</p>
          <p className="truncate text-[11px] font-semibold tabular-nums">{formatCurrencyUSD(creditUsd)}</p>
          <p className="text-muted-foreground truncate text-[10px] tabular-nums">
            {isExchangeRateReady ? formatCurrencyVES(creditUsd * currentExchangeRate) : "—"}
          </p>
        </div>
        {returnType === "exchange" && (
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Nueva Compra</p>
            <p className="truncate text-[11px] font-semibold tabular-nums">{formatCurrencyUSD(newPurchaseUsd)}</p>
            <p className="text-muted-foreground truncate text-[10px] tabular-nums">
              {isExchangeRateReady ? formatCurrencyVES(newPurchaseUsd * currentExchangeRate) : "—"}
            </p>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Diferencia</p>
          <p
            className={`truncate text-[11px] font-bold tabular-nums ${differenceUsd > 0 ? "text-success" : differenceUsd < 0 ? "text-destructive" : ""}`}
          >
            {differenceUsd > 0 ? "+" : ""}
            {formatCurrencyUSD(differenceUsd)}
          </p>
          <p className="text-muted-foreground truncate text-[10px] tabular-nums">
            {isExchangeRateReady ? `${differenceVes > 0 ? "+" : ""}${formatCurrencyVES(differenceVes)}` : "—"}
          </p>
        </div>
      </section>

      <ModalFooterActionRow
        message={
          differenceUsd > 0
            ? "Cliente paga la diferencia"
            : differenceUsd < 0
              ? "Tienda devuelve la diferencia"
              : hasReturnItems
                ? "Cambio exacto — sin pago"
                : "Agrega productos a devolver"
        }
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="w-full md:w-auto">
              <ModalShortcutActionButton
                icon={<IterationCcw data-icon="inline-start" />}
                label={buttonLabel}
                disabled={!canSubmit}
                onClick={onOpenConfirmDialog}
              />
            </span>
          </TooltipTrigger>
          {blockedTooltip && (
            <TooltipContent>
              <p>{blockedTooltip}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </ModalFooterActionRow>
    </footer>
  );
}
