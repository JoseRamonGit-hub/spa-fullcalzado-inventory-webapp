import type { Row } from "@tanstack/react-table";
import type { ReturnWithRelations } from "@/types";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
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
        <ScrollShadow
          containerClassName="w-full"
          className="custom-scrollbar overflow-x-auto"
          role="region"
          aria-label="Movimientos y resumen de la devolución"
          tabIndex={0}
        >
          <Table density="compact" className="min-w-[42rem]" scrollShadow={false}>
            <TableHeader>
              <TableRow className="bg-muted/35 hover:bg-muted/35">
                <TableHead>Movimiento</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead className="text-right">Bs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement, index) => (
                <TableRow key={`${movement.kind}-${movement.id}`} className={index % 2 === 1 ? "bg-table-stripe" : ""}>
                  <TableCell>
                    <ReturnMovementBadge kind={movement.kind} />
                  </TableCell>
                  <TableCell className="max-w-80">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="product-code shrink-0 text-xs uppercase">{movement.product.code}</span>
                      <OverflowTooltip focusable={false} className="text-muted-foreground">
                        {movement.product.description}
                      </OverflowTooltip>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-value text-right font-medium">{movement.quantity}</TableCell>
                  <TableCell className="data-value text-right font-medium">
                    {formatCurrencyUSD(movement.totalUsd)}
                  </TableCell>
                  <TableCell className="data-value text-right font-medium">
                    {formatCurrencyVES(movement.totalVes)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="min-w-[42rem] border-t">
            <div className="bg-muted/10 grid grid-cols-4 divide-x">
              {summaryItems.map((item) => (
                <div key={item.label} className="min-w-0 px-3 py-2">
                  <p className="text-muted-foreground text-[11px] leading-none font-semibold tracking-[0.05em] uppercase">
                    {item.label}
                  </p>
                  {item.empty ? (
                    <p className="text-muted-foreground mt-0.5 font-medium">No aplica</p>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span className="inline-flex items-baseline gap-1.5">
                        <span className="text-muted-foreground text-[11px] leading-none font-semibold tracking-[0.05em] uppercase">
                          USD
                        </span>
                        <span className="data-value font-semibold">{formatCurrencyUSD(item.usd)}</span>
                      </span>
                      <span className="inline-flex items-baseline gap-1.5">
                        <span className="text-muted-foreground text-[11px] leading-none font-semibold tracking-[0.05em] uppercase">
                          Bs.
                        </span>
                        <span className="data-value font-semibold">
                          {formatCurrencyVES(item.ves, { includeCurrency: false })}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              ))}

              <div className="min-w-0 px-3 py-2">
                <p className="text-muted-foreground text-[11px] leading-none font-semibold tracking-[0.05em] uppercase">
                  Resultado
                </p>
                <p className="text-foreground mt-0.5 text-xs font-medium">{outcome.label}</p>
                <div className={cn("mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs", outcome.className)}>
                  <span className="inline-flex items-baseline gap-1.5">
                    <span className="text-[11px] leading-none font-semibold tracking-[0.05em] uppercase opacity-70">
                      USD
                    </span>
                    <span className="data-value font-semibold">{formatCurrencyUSD(outcome.usd)}</span>
                  </span>
                  <span className="inline-flex items-baseline gap-1.5">
                    <span className="text-[11px] leading-none font-semibold tracking-[0.05em] uppercase opacity-70">
                      Bs.
                    </span>
                    <span className="data-value font-semibold">
                      {formatCurrencyVES(outcome.ves, { includeCurrency: false })}
                    </span>
                  </span>
                </div>
              </div>

              <div className="min-w-0 px-3 py-2">
                <p className="text-muted-foreground text-[11px] leading-none font-semibold tracking-[0.05em] uppercase">
                  Tasa aplicada
                </p>
                <p className="data-value mt-1 text-xs font-semibold">{formatCurrencyVES(data.exchange_rate)}</p>
              </div>
            </div>

            {data.notes && (
              <div className="border-t px-3 py-2 text-xs">
                <span className="text-muted-foreground font-medium">Motivo: </span>
                <span>{data.notes}</span>
              </div>
            )}
          </div>
        </ScrollShadow>
      </div>
    </div>
  );
}
