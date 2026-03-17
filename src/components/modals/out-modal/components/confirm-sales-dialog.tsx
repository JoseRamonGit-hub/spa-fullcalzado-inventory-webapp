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
import { ShoppingCart } from "lucide-react";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingSale } from "../types";

interface ConfirmSalesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pendingSales: PendingSale[];
  currentExchangeRate: number;
  totalAmountUsd: number;
  totalAmountVes: number;
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void;
}

export function ConfirmSalesDialog({
  isOpen,
  onOpenChange,
  pendingSales,
  currentExchangeRate,
  totalAmountUsd,
  totalAmountVes,
  isSubmissionPending,
  onConfirmSubmit,
}: ConfirmSalesDialogProps) {
  const pendingSalesCount = pendingSales.length;
  const isMultipleSales = pendingSalesCount > 1;
  const isRowStripe = (index: number) => index % 2 === 1;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <ShoppingCart className="text-primary" />
          </AlertDialogMedia>
          <div>
            <AlertDialogTitle>¿Confirmar registro de ventas?</AlertDialogTitle>
            <AlertDialogDescription className="mt-1">
              Estás a punto de registrar{" "}
              <strong className="text-foreground">
                {pendingSalesCount} venta{isMultipleSales ? "s" : ""}
              </strong>
              . Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Items summary table */}
        <section className="custom-scrollbar max-h-48 overflow-y-auto rounded-md border text-xs">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b">
                <th className="px-2.5 py-1.5 text-left font-semibold tracking-wider uppercase">Producto</th>
                <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Cant.</th>
                <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Total USD</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pendingSales.map((sale, index) => (
                <tr key={sale._tempId} className={isRowStripe(index) ? "bg-table-stripe" : ""}>
                  <td className="px-2.5 py-1">
                    <span className="product-code mr-1.5 uppercase">{sale.code}</span>
                    <span className="text-muted-foreground inline-flex max-w-64 truncate">{sale.description}</span>
                  </td>
                  <td className="px-2.5 py-1 text-right tabular-nums">{sale.quantity}</td>
                  <td className="px-2.5 py-1 text-right font-semibold tabular-nums">
                    {formatCurrencyUSD(sale.totalUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals block */}
        <section className="bg-muted/30 space-y-1 rounded-md border p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tasa</span>
            <span className="font-medium tabular-nums">{formatCurrencyVES(currentExchangeRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total lote USD</span>
            <span className="text-foreground font-bold tabular-nums">{formatCurrencyUSD(totalAmountUsd)}</span>
          </div>
          <div className="border-primary/20 flex justify-between border-t pt-1">
            <span className="text-muted-foreground">Total lote Bs</span>
            <span className="text-foreground font-bold tabular-nums">{formatCurrencyVES(totalAmountVes)}</span>
          </div>
        </section>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmissionPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmSubmit} disabled={isSubmissionPending}>
            {isSubmissionPending ? "Registrando..." : "Confirmar ventas"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
