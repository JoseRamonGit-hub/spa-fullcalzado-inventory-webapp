import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IterationCcw } from "lucide-react";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingReturnItem, PendingExchangeItem } from "../types";

interface ConfirmReturnDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  returnItems: readonly PendingReturnItem[];
  exchangeItems: readonly PendingExchangeItem[];
  returnType: "exchange" | "refund";
  creditUsd: number;
  differenceUsd: number;
  differenceVes: number;
  currentExchangeRate: number;
  isSubmissionPending: boolean;
  notes: string;
  onConfirmSubmit: () => void;
}

export function ConfirmReturnDialog({
  isOpen,
  onOpenChange,
  returnItems,
  exchangeItems,
  returnType,
  creditUsd,
  differenceUsd,
  differenceVes,
  currentExchangeRate,
  isSubmissionPending,
  notes,
  onConfirmSubmit,
}: ConfirmReturnDialogProps) {
  const isExchange = returnType === "exchange";
  const isRowStripe = (index: number) => index % 2 === 1;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <IterationCcw className="text-warning" />
          </AlertDialogMedia>
          <div>
            <AlertDialogTitle>{isExchange ? "¿Confirmar cambio?" : "¿Confirmar devolución?"}</AlertDialogTitle>
            <AlertDialogDescription className="mt-1">
              {isExchange
                ? "El cliente devuelve producto(s) y se lleva producto(s) nuevo(s). Esta acción no se puede deshacer."
                : "Se registrará una devolución pura. El crédito se devuelve al cliente. Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Returned items */}
        <section className="custom-scrollbar max-h-36 overflow-y-auto rounded-md border text-xs">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b">
                <th className="px-2.5 py-1.5 text-left font-semibold tracking-wider uppercase" colSpan={2}>
                  Productos devueltos
                </th>
                <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Cant.</th>
                <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Crédito</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {returnItems.map((item, index) => (
                <tr key={item._tempId} className={isRowStripe(index) ? "bg-table-stripe" : ""}>
                  <td className="px-2.5 py-1" colSpan={2}>
                    <span className="product-code mr-1.5 uppercase">{item.code}</span>
                    <span className="text-muted-foreground inline-flex max-w-64 truncate">{item.description}</span>
                  </td>
                  <td className="px-2.5 py-1 text-right tabular-nums">{item.quantity}</td>
                  <td className="px-2.5 py-1 text-right font-semibold tabular-nums">
                    {formatCurrencyUSD(item.totalUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Exchange items (if any) */}
        {isExchange && exchangeItems.length > 0 && (
          <section className="custom-scrollbar max-h-36 overflow-y-auto rounded-md border text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground border-b">
                  <th className="px-2.5 py-1.5 text-left font-semibold tracking-wider uppercase" colSpan={2}>
                    Productos nuevos
                  </th>
                  <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Cant.</th>
                  <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exchangeItems.map((item, index) => (
                  <tr key={item._tempId} className={isRowStripe(index) ? "bg-table-stripe" : ""}>
                    <td className="px-2.5 py-1" colSpan={2}>
                      <span className="product-code mr-1.5 uppercase">{item.code}</span>
                      <span className="text-muted-foreground inline-flex max-w-64 truncate">{item.description}</span>
                    </td>
                    <td className="px-2.5 py-1 text-right tabular-nums">{item.quantity}</td>
                    <td className="px-2.5 py-1 text-right font-semibold tabular-nums">
                      {formatCurrencyUSD(item.totalUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Totals */}
        <section className="bg-muted/30 space-y-1 rounded-md border p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tasa</span>
            <span className="font-medium tabular-nums">{formatCurrencyVES(currentExchangeRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Crédito</span>
            <span className="font-medium tabular-nums">{formatCurrencyUSD(creditUsd)}</span>
          </div>
          <div className="border-primary/20 flex justify-between border-t pt-1">
            <span className="text-muted-foreground font-semibold">
              {differenceUsd > 0 ? "Cliente paga" : differenceUsd < 0 ? "Tienda devuelve" : "Cambio exacto"}
            </span>
            <span
              className={`font-bold tabular-nums ${differenceUsd > 0 ? "text-success" : differenceUsd < 0 ? "text-destructive" : "text-foreground"}`}
            >
              {formatCurrencyUSD(Math.abs(differenceUsd))}
            </span>
          </div>
          {differenceUsd !== 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground" />
              <span className="text-muted-foreground tabular-nums">{formatCurrencyVES(Math.abs(differenceVes))}</span>
            </div>
          )}
          {notes && (
            <div className="border-border/50 border-t pt-1">
              <span className="text-muted-foreground">Motivo: </span>
              <span className="text-foreground">{notes}</span>
            </div>
          )}
        </section>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmissionPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmSubmit} disabled={isSubmissionPending}>
            {isSubmissionPending ? "Registrando..." : isExchange ? "Confirmar cambio" : "Confirmar devolución"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
