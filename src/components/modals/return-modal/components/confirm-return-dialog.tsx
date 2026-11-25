import { ConfirmationAmounts } from "../../shared/confirmation-amounts";
import { TableHead } from "@/components/ui/table";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { PendingReturnItem, PendingExchangeItem, ReturnSummary } from "../types";
import { MODAL_SUBMISSION_ERROR_MESSAGES } from "@/components/modals/shared/submission-messages";
import { getReturnPresentation } from "../return-presentation";
import {
  ConfirmDialogLineRow,
  ConfirmDialogLineTable,
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
      description={`${returnedUnitCount} ${returnedUnitCount === 1 ? "unidad" : "unidades"} de entrada${isExchange ? ` · ${exchangedUnitCount} ${exchangedUnitCount === 1 ? "unidad" : "unidades"} de salida` : ""}`}
      confirmLabel={presentation.actionLabel}
      pendingLabel="Registrando..."
      submissionErrorMessage={
        isExchange ? MODAL_SUBMISSION_ERROR_MESSAGES.exchange : MODAL_SUBMISSION_ERROR_MESSAGES.refund
      }
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!exchangeRate.isReady}
      contentClassName="data-[size=default]:sm:max-w-2xl"
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 sm:max-h-52">
        <ConfirmDialogLineTable
          header={
            <>
              <TableHead scope="col" className="hidden sm:table-cell">
                Movimiento
              </TableHead>
              <TableHead scope="col">Producto</TableHead>
              <TableHead scope="col" className="text-right">
                <span className="sm:hidden" aria-label="Cantidad">
                  Cant.
                </span>
                <span className="hidden sm:inline">Cantidad</span>
              </TableHead>
              <TableHead scope="col" className="text-right">
                Importe USD
              </TableHead>
            </>
          }
        >
          {allItems.map((item) => (
            <ConfirmDialogLineRow key={item.tempId}>
              <td className="hidden p-0 align-middle sm:table-cell">
                <ReturnMovementBadge kind={item.movement === "Entrada" ? "entry" : "exit"} />
              </td>
              <td className="min-w-0 p-0 align-middle">
                <ModalProductIdentity code={item.code} description={item.description} />
                <div className="mt-1 sm:hidden">
                  <ReturnMovementBadge kind={item.movement === "Entrada" ? "entry" : "exit"} />
                </div>
              </td>
              <td className="p-0 text-right align-middle whitespace-nowrap">
                <span className="tabular-value font-semibold">{item.quantity}</span>
              </td>
              <td className="p-0 text-right align-middle whitespace-nowrap">
                <span className="data-value font-semibold">{formatCurrencyUSD(item.totalUsd)}</span>
              </td>
            </ConfirmDialogLineRow>
          ))}
        </ConfirmDialogLineTable>
      </ConfirmDialogTableSection>

      <ConfirmationAmounts
        details={
          isExchange
            ? [
                { label: "Valor de lo devuelto", usd: creditUsd, ves: exchangeRate.isReady ? creditVes : null },
                { label: "Nueva compra", usd: newPurchaseUsd, ves: exchangeRate.isReady ? newPurchaseVes : null },
              ]
            : []
        }
        totalClassName={`text-sm leading-tight ${presentation.differenceClassName}`}
        total={{
          label: presentation.outcomeLabel,
          usd: presentation.differenceUsd,
          ves: exchangeRate.isReady ? presentation.differenceVes : null,
        }}
        rate={exchangeRate.isReady ? exchangeRate.displayValue : null}
      />
      {!exchangeRate.isReady && <p className="text-warning-foreground text-xs">{exchangeRate.statusMessage}</p>}
      {notes && (
        <p className="text-xs break-words whitespace-pre-wrap">
          <span className="text-muted-foreground">Motivo: </span>
          {notes}
        </p>
      )}
    </ModalConfirmDialog>
  );
}
