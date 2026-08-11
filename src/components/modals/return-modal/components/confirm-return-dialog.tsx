import { cn } from "@/lib/utils";
import { CurrencyStack } from "@/components/ui/currency-stack";
import { TableHead } from "@/components/ui/table";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingReturnItem, PendingExchangeItem, ReturnSummary } from "../types";
import { MODAL_SUBMISSION_ERROR_MESSAGES } from "@/components/modals/shared/submission-messages";
import { getReturnPresentation } from "../return-presentation";
import {
  ConfirmDialogSummarySection,
  ConfirmDialogTableSection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";
import { ReturnMovementBadge } from "./return-movement-badge";

type ConfirmReturnDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  returnItems: readonly PendingReturnItem[];
  exchangeItems: readonly PendingExchangeItem[];
  summary: ReturnSummary;
  exchangeRate: ModalExchangeRate;
  isSubmissionPending: boolean;
  notes: string;
  onConfirmSubmit: () => void | Promise<void>;
};

export function ConfirmReturnDialog({
  isOpen,
  onOpenChange,
  returnItems,
  exchangeItems,
  summary,
  exchangeRate,
  isSubmissionPending,
  notes,
  onConfirmSubmit,
}: ConfirmReturnDialogProps) {
  const { creditUsd, creditVes, newPurchaseUsd, newPurchaseVes } = summary;
  const presentation = getReturnPresentation(summary, true);
  const { isExchange } = presentation;
  const returnedUnitCount = returnItems.reduce((total, item) => total + item.quantity, 0);
  const exchangedUnitCount = exchangeItems.reduce((total, item) => total + item.quantity, 0);
  const allItems = [
    ...returnItems.map((item) => ({ ...item, movement: "Entrada" as const })),
    ...exchangeItems.map((item) => ({ ...item, movement: "Salida" as const })),
  ];

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={presentation.confirmTitle}
      description={
        isExchange ? (
          <>
            Se registrarán{" "}
            <strong className="text-foreground">
              {returnedUnitCount} {returnedUnitCount === 1 ? "unidad" : "unidades"} de entrada
            </strong>{" "}
            y{" "}
            <strong className="text-foreground">
              {exchangedUnitCount} {exchangedUnitCount === 1 ? "unidad" : "unidades"} de salida
            </strong>
            . Verifica productos e importes.
          </>
        ) : (
          <>
            Se registrará{returnedUnitCount === 1 ? "" : "n"}{" "}
            <strong className="text-foreground">
              {returnedUnitCount} {returnedUnitCount === 1 ? "unidad" : "unidades"} de entrada
            </strong>
            . Verifica el reembolso.
          </>
        )
      }
      confirmLabel={presentation.actionLabel}
      pendingLabel="Registrando..."
      submissionErrorMessage={
        isExchange ? MODAL_SUBMISSION_ERROR_MESSAGES.exchange : MODAL_SUBMISSION_ERROR_MESSAGES.refund
      }
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!exchangeRate.isReady}
      contentClassName="data-[size=default]:sm:max-w-xl"
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 max-h-52">
        <table className="w-full">
          <thead className="hidden sm:table-header-group">
            <tr className="bg-muted/35 text-muted-foreground border-b">
              <TableHead scope="col" className="py-1.5">
                Movimiento
              </TableHead>
              <TableHead scope="col" className="py-1.5">
                Producto
              </TableHead>
              <TableHead scope="col" className="py-1.5 text-right">
                Cantidad
              </TableHead>
              <TableHead scope="col" className="py-1.5 text-right">
                Importe USD
              </TableHead>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {allItems.map((item) => (
              <tr
                key={item.tempId}
                className="bg-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-2 sm:table-row sm:px-0 sm:py-0"
              >
                <td className="p-0 align-middle sm:px-3 sm:py-2">
                  <ReturnMovementBadge kind={item.movement === "Entrada" ? "entry" : "exit"} />
                </td>
                <td className="min-w-0 p-0 align-middle sm:px-3 sm:py-2">
                  <ModalProductIdentity code={item.code} description={item.description} />
                </td>
                <td className="p-0 align-middle whitespace-nowrap sm:px-3 sm:py-2 sm:text-right">
                  <span className="text-muted-foreground mr-1.5 text-[11px] font-medium sm:hidden">Cantidad</span>
                  <span className="font-semibold tabular-nums">{item.quantity}</span>
                </td>
                <td className="p-0 text-right align-middle whitespace-nowrap sm:px-3 sm:py-2">
                  <span className="text-muted-foreground mr-1.5 text-[11px] font-medium sm:hidden">Importe USD</span>
                  <span className="font-semibold tabular-nums">{formatCurrencyUSD(item.totalUsd)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConfirmDialogTableSection>

      <ConfirmDialogSummarySection className="border-primary/20 bg-card gap-0 overflow-hidden p-0">
        {!exchangeRate.isReady && <p className="text-warning px-3 py-2">{exchangeRate.statusMessage}</p>}

        <div className="bg-primary/5 flex items-center justify-between gap-3 border-b px-3 py-2">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase">Diferencia</p>
          <p className="font-semibold">{presentation.outcomeLabel}</p>
        </div>

        <div className="grid grid-cols-2 divide-x">
          <div className="min-w-0 p-3">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase">USD</p>
            <p
              className={cn(
                "mt-1 text-base leading-tight font-bold whitespace-nowrap tabular-nums sm:text-lg",
                presentation.differenceClassName,
              )}
            >
              {formatCurrencyUSD(presentation.differenceUsd)}
            </p>
          </div>
          <div className="min-w-0 p-3 text-right">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase">Bs.</p>
            <p
              className={cn(
                "mt-1 text-base leading-tight font-bold whitespace-nowrap tabular-nums sm:text-lg",
                presentation.differenceClassName,
              )}
            >
              {exchangeRate.isReady ? formatCurrencyVES(presentation.differenceVes) : "—"}
            </p>
          </div>
        </div>

        {isExchange && (
          <div className="bg-muted/20 grid grid-cols-2 divide-x border-t">
            <div className="min-w-0 px-3 py-2">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase">Crédito</p>
              <CurrencyStack usd={creditUsd} ves={creditVes} className="mt-1" />
            </div>
            <div className="min-w-0 px-3 py-2 text-right">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase">Nueva compra</p>
              <CurrencyStack usd={newPurchaseUsd} ves={newPurchaseVes} className="mt-1 justify-items-end" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase">Tasa aplicada</p>
          <p className="font-medium whitespace-nowrap tabular-nums">{exchangeRate.displayValue}</p>
        </div>

        {notes && (
          <div className="border-t px-3 py-2 break-words whitespace-pre-wrap">
            <span className="text-muted-foreground">Motivo: </span>
            <span className="text-foreground">{notes}</span>
          </div>
        )}
      </ConfirmDialogSummarySection>
    </ModalConfirmDialog>
  );
}
