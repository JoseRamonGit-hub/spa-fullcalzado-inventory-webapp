import { IterationCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ModalFooterActionRow, ModalShortcutActionButton } from "@/components/modals/shared/modal-ui";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { ReturnSummary } from "../types";
import { getReturnPresentation } from "../return-presentation";

type ReturnSummaryFooterProps = {
  hasReturnItems: boolean;
  summary: ReturnSummary;
  exchangeRate: ModalExchangeRate;
  isSubmissionPending: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  onOpenConfirmDialog: () => void;
};

export function ReturnSummaryFooter({
  hasReturnItems,
  summary,
  exchangeRate,
  isSubmissionPending,
  notes,
  onNotesChange,
  onOpenConfirmDialog,
}: ReturnSummaryFooterProps) {
  const { returnType, differenceUsd } = summary;
  const userRole = useAuthStore((state) => state.user?.role);
  const presentation = getReturnPresentation(summary, hasReturnItems);
  const isEmployee = userRole === "employee";

  const isBlockedByRole = isEmployee && (returnType === "refund" || differenceUsd < 0);
  const isBlockedByExchangeRate = !exchangeRate.isReady;
  const canSubmit = hasReturnItems && !isSubmissionPending && !isBlockedByRole && !isBlockedByExchangeRate;

  const buttonLabel = isSubmissionPending ? "Registrando..." : presentation.actionLabel;

  const blockedTooltip = isBlockedByRole
    ? returnType === "refund"
      ? "Solo un administrador puede procesar devoluciones"
      : "Solo un administrador puede procesar cambios con saldo a favor"
    : isBlockedByExchangeRate
      ? exchangeRate.statusMessage
      : undefined;

  return (
    <footer className="flex w-full flex-col gap-3">
      {!exchangeRate.isReady && (
        <section className="border-warning/40 bg-warning/8 rounded-md border px-3 py-2 text-xs">
          <p className="text-warning-foreground font-medium">{exchangeRate.statusTitle}</p>
          <p className="text-muted-foreground mt-1">{exchangeRate.statusMessage}</p>
        </section>
      )}

      <Input
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        placeholder="Motivo de la devolución (opcional)"
        aria-label="Motivo de la devolución"
        className="h-9 text-xs"
      />

      <section className="bg-card overflow-hidden rounded-md border">
        <header className="flex items-center justify-between gap-3 border-b px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <Badge variant={presentation.isExchange ? "exchange" : "refund"} className="px-1.5 py-0.5 text-[9px]">
              {presentation.operationLabel}
            </Badge>
            <span className="truncate text-xs font-semibold">{presentation.outcomeLabel}</span>
          </span>
          <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
            Tasa {exchangeRate.displayValue}
          </span>
        </header>

        <div className="bg-primary/5 grid grid-cols-2 divide-x">
          <div className="min-w-0 px-3 py-2">
            <p className="text-muted-foreground text-[9px] font-semibold tracking-wider uppercase">Diferencia USD</p>
            <p
              className={cn(
                "mt-0.5 text-base leading-tight font-bold whitespace-nowrap tabular-nums",
                presentation.differenceClassName,
              )}
            >
              {formatCurrencyUSD(presentation.differenceUsd)}
            </p>
          </div>
          <div className="min-w-0 px-3 py-2 text-right">
            <p className="text-muted-foreground text-[9px] font-semibold tracking-wider uppercase">Diferencia Bs.</p>
            <p
              className={cn(
                "mt-0.5 text-base leading-tight font-bold whitespace-nowrap tabular-nums",
                presentation.differenceClassName,
              )}
            >
              {exchangeRate.isReady ? formatCurrencyVES(presentation.differenceVes) : "—"}
            </p>
          </div>
        </div>
      </section>

      <ModalFooterActionRow message={hasReturnItems ? presentation.outcomeLabel : "Agrega productos de entrada"}>
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
