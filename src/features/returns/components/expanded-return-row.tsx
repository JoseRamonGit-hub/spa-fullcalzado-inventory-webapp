import type { Row } from "@tanstack/react-table";
import type { ReturnWithRelations } from "@/types";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export function ExpandedReturnRow({ row }: { row: Row<ReturnWithRelations> }) {
  const data = row.original;
  const hasExchangeItems = data.transactions.length > 0;

  return (
    <div className="bg-muted/30 border-t px-4 py-2.5">
      <div className="flex max-w-full flex-col gap-2.5 lg:max-w-xl">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            Artículos devueltos
          </h4>
          <div className="border-refund/12 flex flex-col gap-1 border-l-2 pl-3">
            {data.return_items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_2.5rem_5rem_7rem] items-center gap-3 text-[13px]"
              >
                <span className="product-code text-xs uppercase">{item.products.code}</span>
                <span className="text-muted-foreground min-w-0 truncate">{item.products.description}</span>
                <span className="text-muted-foreground text-right tabular-nums">{item.quantity}</span>
                <span className="w-20 text-right font-medium tabular-nums">
                  {formatCurrencyUSD(item.price_usd * item.quantity)}
                </span>
                <span className="text-muted-foreground/70 text-right text-xs tabular-nums">
                  {formatCurrencyVES(item.price_ves * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {hasExchangeItems && (
          <div className="flex flex-col gap-1.5">
            <h4 className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Artículos de cambio
            </h4>
            <div className="border-exchange/12 flex flex-col gap-1 border-l-2 pl-3">
              {data.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_2.5rem_5rem_7rem] items-center gap-3 text-[13px]"
                >
                  <span className="product-code text-xs uppercase">{tx.products.code}</span>
                  <span className="text-muted-foreground min-w-0 truncate">{tx.products.description}</span>
                  <span className="text-muted-foreground text-right tabular-nums">{tx.quantity}</span>
                  <span className="w-20 text-right font-medium tabular-nums">
                    {formatCurrencyUSD(tx.total_usd ?? 0)}
                  </span>
                  <span className="text-muted-foreground/70 text-right text-xs tabular-nums">
                    {formatCurrencyVES(tx.total_ves ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 border-t pt-1.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-1 lg:max-w-xl">
            <span className="text-muted-foreground">
              Crédito:{" "}
              <span className="text-foreground font-semibold tabular-nums">{formatCurrencyUSD(data.credit_usd)}</span>
              <span className="text-muted-foreground/70 ml-1 tabular-nums">{formatCurrencyVES(data.credit_ves)}</span>
            </span>
            {hasExchangeItems && (
              <span className="text-muted-foreground">
                Diferencia:{" "}
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    data.difference_usd > 0
                      ? "text-success"
                      : data.difference_usd < 0
                        ? "text-destructive"
                        : "text-foreground",
                  )}
                >
                  {data.difference_usd > 0 ? "+" : ""}
                  {formatCurrencyUSD(data.difference_usd)}
                </span>
                <span className="text-muted-foreground/70 ml-1 tabular-nums">
                  {data.difference_ves > 0 ? "+" : ""}
                  {formatCurrencyVES(data.difference_ves)}
                </span>
              </span>
            )}
          </div>
          {data.notes && <span className="text-muted-foreground ml-auto italic">{data.notes}</span>}
        </div>
      </div>
    </div>
  );
}
