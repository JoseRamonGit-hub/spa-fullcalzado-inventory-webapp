import type { Row } from "@tanstack/react-table";
import type { ReturnWithRelations } from "@/types";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReturnMovementBadge } from "@/components/modals/return-modal/components/return-movement-badge";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { getReturnOutcome, getReturnPurchaseTotals } from "../return-display";

export function ExpandedReturnRow({ row }: { row: Row<ReturnWithRelations> }) {
  const data = row.original;
  const outcome = getReturnOutcome(data);
  const purchase = getReturnPurchaseTotals(data);
  const movements = [
    ...data.return_items.map((item) => ({
      id: item.id,
      kind: "entry" as const,
      product: item.products,
      quantity: item.quantity,
      totalUsd: item.price_usd * item.quantity,
      totalVes: item.price_ves * item.quantity,
    })),
    ...data.transactions.map((transaction) => ({
      id: transaction.id,
      kind: "exit" as const,
      product: transaction.products,
      quantity: transaction.quantity,
      totalUsd: transaction.total_usd ?? 0,
      totalVes: transaction.total_ves ?? 0,
    })),
  ];

  const summaryItems = [
    {
      label: "Crédito",
      usd: data.credit_usd,
      ves: data.credit_ves,
    },
    {
      label: "Nueva compra",
      usd: purchase.usd,
      ves: purchase.ves,
      empty: data.transactions.length === 0,
    },
  ];

  return (
    <div className="bg-muted/25 border-t px-3 py-3 md:px-4">
      <div className="bg-background overflow-hidden rounded-md border">
        <Table className="min-w-[42rem] text-xs">
          <TableHeader>
            <TableRow className="bg-muted/35 hover:bg-muted/35">
              <TableHead>Movimiento</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">USD</TableHead>
              <TableHead className="text-right">Bs.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement, index) => (
              <TableRow key={`${movement.kind}-${movement.id}`} className={index % 2 === 1 ? "bg-table-stripe" : ""}>
                <TableCell className="px-3 py-1.5">
                  <ReturnMovementBadge kind={movement.kind} />
                </TableCell>
                <TableCell className="max-w-80 px-3 py-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="product-code shrink-0 text-xs uppercase">{movement.product.code}</span>
                    <OverflowTooltip focusable={false} className="text-muted-foreground">
                      {movement.product.description}
                    </OverflowTooltip>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-1.5 text-right font-medium tabular-nums">{movement.quantity}</TableCell>
                <TableCell className="px-3 py-1.5 text-right font-medium tabular-nums">
                  {formatCurrencyUSD(movement.totalUsd)}
                </TableCell>
                <TableCell className="px-3 py-1.5 text-right font-medium tabular-nums">
                  {formatCurrencyVES(movement.totalVes)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="border-t">
          <div className="grid grid-cols-4">
            {summaryItems.map((item, index) => (
              <div
                key={item.label}
                className={cn("min-w-0 px-3 py-2", index > 0 && "border-l", index === 1 && "border-r")}
              >
                <p className="text-muted-foreground text-[10px] font-semibold uppercase">{item.label}</p>
                {item.empty ? (
                  <p className="text-muted-foreground mt-0.5 font-medium">No aplica</p>
                ) : (
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums">
                    <span className="inline-flex items-baseline gap-1.5">
                      <span className="text-muted-foreground text-[9px] font-semibold uppercase">USD</span>
                      <span className="font-semibold">{formatCurrencyUSD(item.usd)}</span>
                    </span>
                    <span className="inline-flex items-baseline gap-1.5">
                      <span className="text-muted-foreground text-[9px] font-semibold">Bs.</span>
                      <span className="font-semibold">{formatCurrencyVES(item.ves, { includeCurrency: false })}</span>
                    </span>
                  </div>
                )}
              </div>
            ))}

            <div className="min-w-0 px-3 py-2">
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">Resultado</p>
              <p className="text-foreground mt-0.5 text-xs font-medium">{outcome.label}</p>
              <div className={cn("flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums", outcome.className)}>
                <span className="inline-flex items-baseline gap-1.5">
                  <span className="text-[9px] font-semibold uppercase opacity-70">USD</span>
                  <span className="font-semibold">{formatCurrencyUSD(outcome.usd)}</span>
                </span>
                <span className="inline-flex items-baseline gap-1.5">
                  <span className="text-[9px] font-semibold opacity-70">Bs.</span>
                  <span className="font-semibold">{formatCurrencyVES(outcome.ves, { includeCurrency: false })}</span>
                </span>
              </div>
            </div>

            <div className="min-w-0 border-l px-3 py-2">
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">Tasa aplicada</p>
              <p className="mt-0.5 text-xs font-semibold tabular-nums">{formatCurrencyVES(data.exchange_rate)}</p>
            </div>
          </div>

          {data.notes && (
            <div className="border-t px-3 py-2 text-xs">
              <span className="text-muted-foreground font-medium">Motivo: </span>
              <span>{data.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
