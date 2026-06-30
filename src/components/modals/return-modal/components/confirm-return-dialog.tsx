import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingReturnItem, PendingExchangeItem, ReturnSummary } from "../types";
import { getReturnPresentation } from "../return-presentation";
import {
  ConfirmDialogSummarySection,
  ConfirmDialogTableSection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";

type ConfirmReturnDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  returnItems: readonly PendingReturnItem[];
  exchangeItems: readonly PendingExchangeItem[];
  summary: ReturnSummary;
  exchangeRate: ModalExchangeRate;
  isSubmissionPending: boolean;
  notes: string;
  onConfirmSubmit: () => void;
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
  const { creditUsd, newPurchaseUsd } = summary;
  const presentation = getReturnPresentation(summary, true);
  const { isExchange } = presentation;
  const returnCount = returnItems.length;
  const exchangeCount = exchangeItems.length;
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
            Se registrarán <strong className="text-foreground">{returnCount} de entrada</strong> y{" "}
            <strong className="text-foreground">{exchangeCount} de salida</strong>. Verifica productos e importes.
          </>
        ) : (
          <>
            Se registrará{returnCount === 1 ? "" : "n"}{" "}
            <strong className="text-foreground">
              {returnCount} {returnCount === 1 ? "producto" : "productos"} de entrada
            </strong>
            . Verifica el reembolso.
          </>
        )
      }
      confirmLabel={presentation.actionLabel}
      pendingLabel="Registrando..."
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!exchangeRate.isReady}
      contentClassName="data-[size=default]:sm:max-w-xl"
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 max-h-52">
        <table className="w-full min-w-120">
          <thead>
            <tr className="bg-muted/35 text-muted-foreground border-b">
              <th className="px-3 py-1.5 text-left font-semibold tracking-wider uppercase">Movimiento</th>
              <th className="px-3 py-1.5 text-left font-semibold tracking-wider uppercase">Producto</th>
              <th className="px-3 py-1.5 text-right font-semibold tracking-wider uppercase">Cant.</th>
              <th className="px-3 py-1.5 text-right font-semibold tracking-wider uppercase">USD</th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {allItems.map((item) => (
              <tr key={item.tempId} className="bg-card">
                <td className="px-3 py-2 align-middle">
                  <Badge
                    variant={item.movement === "Entrada" ? "success" : "destructive"}
                    className="px-1.5 py-0.5 text-[9px]"
                  >
                    {item.movement}
                  </Badge>
                </td>
                <td className="px-3 py-2 align-middle">
                  <ModalProductIdentity code={item.code} description={item.description} />
                </td>
                <td className="px-3 py-2 text-right align-middle font-semibold tabular-nums">{item.quantity}</td>
                <td className="px-3 py-2 text-right align-middle font-semibold tabular-nums">
                  {formatCurrencyUSD(item.totalUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConfirmDialogTableSection>

      <ConfirmDialogSummarySection className="border-primary/20 bg-card gap-0 overflow-hidden p-0">
        {!exchangeRate.isReady && <p className="text-warning px-3 py-2">{exchangeRate.statusMessage}</p>}

        <div className="bg-primary/5 flex items-center justify-between gap-3 border-b px-3 py-2">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Diferencia</p>
          <p className="font-semibold">{presentation.outcomeLabel}</p>
        </div>

        <div className="grid grid-cols-2 divide-x">
          <div className="min-w-0 p-3">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">USD</p>
            <p
              className={cn(
                "mt-1 text-lg leading-tight font-bold whitespace-nowrap tabular-nums",
                presentation.differenceClassName,
              )}
            >
              {formatCurrencyUSD(presentation.differenceUsd)}
            </p>
          </div>
          <div className="min-w-0 p-3 text-right">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Bs.</p>
            <p
              className={cn(
                "mt-1 text-lg leading-tight font-bold whitespace-nowrap tabular-nums",
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
              <p className="text-muted-foreground text-[9px] font-semibold tracking-wider uppercase">Crédito</p>
              <p className="mt-0.5 font-medium tabular-nums">{formatCurrencyUSD(creditUsd)}</p>
            </div>
            <div className="min-w-0 px-3 py-2 text-right">
              <p className="text-muted-foreground text-[9px] font-semibold tracking-wider uppercase">Nueva compra</p>
              <p className="mt-0.5 font-medium tabular-nums">{formatCurrencyUSD(newPurchaseUsd)}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Tasa aplicada</p>
          <p className="font-medium whitespace-nowrap tabular-nums">{exchangeRate.displayValue}</p>
        </div>

        {notes && (
          <div className="border-t px-3 py-2">
            <span className="text-muted-foreground">Motivo: </span>
            <span className="text-foreground">{notes}</span>
          </div>
        )}
      </ConfirmDialogSummarySection>
    </ModalConfirmDialog>
  );
}
