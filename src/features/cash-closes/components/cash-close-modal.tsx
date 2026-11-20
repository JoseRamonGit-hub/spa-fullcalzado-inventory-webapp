import type { ReactNode } from "react";
import { ResponsiveAlertModal } from "@/components/modals/shared/responsive-alert-modal";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES, formatInteger, formatTime } from "@/utils/formatters";
import { formatLedgerAmount, type CashCloseDayState, type CashCloseFigures } from "../cash-close-ledger";

type CashCloseModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
  dateLabel: string;
  figures: CashCloseFigures;
  update?: Extract<CashCloseDayState, { kind: "outdated" }>;
};

function AmountRow({
  label,
  usd,
  ves,
  difference = false,
  total = false,
}: {
  label: ReactNode;
  usd: number;
  ves: number;
  difference?: boolean;
  total?: boolean;
}) {
  return (
    <TableRow className={cn("border-border/50 hover:bg-transparent", total && "font-semibold")}>
      <th scope="row" className={cn("px-3 py-2 text-left text-xs font-normal", total && "font-semibold")}>
        {label}
      </th>
      <TableCell className={cn("data-value text-right", total && "text-sm")}>
        {formatLedgerAmount(usd, formatCurrencyUSD, difference)}
      </TableCell>
      <TableCell className={cn("data-value text-right", total && "text-sm")}>
        {formatLedgerAmount(ves, formatCurrencyVES, difference)}
      </TableCell>
    </TableRow>
  );
}

export function CashCloseModal({
  open,
  onOpenChange,
  isPending,
  onConfirm,
  dateLabel,
  figures,
  update,
}: CashCloseModalProps) {
  const sameTotal = update && update.deltaUsd === 0 && update.deltaVes === 0;
  const savedTime = formatTime(update?.cashClose.closed_at);

  return (
    <ResponsiveAlertModal
      open={open}
      onOpenChange={onOpenChange}
      title={update ? "Actualizar cierre de caja" : "Confirmar cierre de caja"}
      description={update ? "El nuevo cuadre reemplazará al guardado para este día." : undefined}
      confirmLabel={update ? "Actualizar cierre" : "Cerrar el día"}
      isPending={isPending}
      onConfirm={onConfirm}
    >
      <div className="bg-card @container overflow-hidden rounded-md border">
        <Table density="compact" scrollAreaLabel={`Cuadre del ${dateLabel}`}>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="whitespace-normal">
                <span className="sr-only">Cuadre del </span>
                {dateLabel}
              </TableHead>
              <TableHead scope="col" className="text-right">
                USD
              </TableHead>
              <TableHead scope="col" className="text-right">
                Bs.
              </TableHead>
            </TableRow>
          </TableHeader>
          {update && (
            <TableBody className="text-muted-foreground">
              <AmountRow
                label={
                  <>
                    Cierre guardado
                    {savedTime && <span className="tabular-value block whitespace-nowrap">{savedTime}</span>}
                  </>
                }
                usd={update.cashClose.total_usd}
                ves={update.cashClose.total_ves}
              />
              {!sameTotal && <AmountRow label="Diferencia" usd={update.deltaUsd} ves={update.deltaVes} difference />}
            </TableBody>
          )}
          <TableFooter className={cn("bg-card", update ? "border-foreground/30" : "border-t-0")}>
            <AmountRow label={update ? "Nuevo total producido" : "Total producido"} {...figures.produced} total />
          </TableFooter>
        </Table>
        {sameTotal && (
          <p className="text-muted-foreground border-t px-3 py-2 text-xs">
            Cambió el cuadre con el mismo total producido.
          </p>
        )}
        <dl className="text-muted-foreground grid divide-y border-t text-xs @min-[20rem]:grid-cols-[3fr_2fr] @min-[20rem]:divide-x @min-[20rem]:divide-y-0">
          <div className="flex items-baseline justify-between gap-2 px-3 py-2">
            <dt>Operaciones facturadas</dt>
            <dd className="data-value text-foreground font-medium">{formatInteger(figures.billedOperations)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2 px-3 py-2">
            <dt>Unidades</dt>
            <dd className="data-value text-foreground font-medium">{formatInteger(figures.units)}</dd>
          </div>
        </dl>
      </div>
    </ResponsiveAlertModal>
  );
}
