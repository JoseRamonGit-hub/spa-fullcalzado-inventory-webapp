import type { Row } from "@tanstack/react-table";
import type { ReturnWithRelations } from "@/types";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export function ExpandedReturnRow({ row }: { row: Row<ReturnWithRelations> }) {
  const data = row.original;
  const hasExchangeItems = data.transactions.length > 0;

  return (
    <div className="bg-muted/30 space-y-3 border-t px-4 py-3">
      {/* Returned items */}
      <div>
        <h4 className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
          Artículos devueltos
        </h4>
        <div className="space-y-0.5">
          {data.return_items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-[13px]">
              <span className="product-code text-xs uppercase">{item.products.code}</span>
              <span className="text-muted-foreground hidden min-w-0 flex-1 truncate md:block">
                {item.products.description}
              </span>
              <span className="text-muted-foreground ml-auto tabular-nums md:ml-0">{item.quantity}</span>
              <span className="w-20 text-right font-medium tabular-nums">
                {formatCurrencyUSD(item.price_usd * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Exchange items */}
      {hasExchangeItems && (
        <div>
          <h4 className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
            Artículos de cambio
          </h4>
          <div className="space-y-0.5">
            {data.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 text-[13px]">
                <span className="product-code text-xs uppercase">{tx.products.code}</span>
                <span className="text-muted-foreground hidden min-w-0 flex-1 truncate md:block">
                  {tx.products.description}
                </span>
                <span className="text-muted-foreground ml-auto tabular-nums md:ml-0">{tx.quantity}</span>
                <span className="w-20 text-right font-medium tabular-nums">
                  {formatCurrencyUSD(tx.total_usd ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary + notes */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-xs">
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
                data.difference_usd > 0 ? "text-success" : data.difference_usd < 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {data.difference_usd > 0 ? "+" : ""}
              {formatCurrencyUSD(data.difference_usd)}
            </span>
          </span>
        )}
        {data.notes && (
          <span className="text-muted-foreground ml-auto italic">"{data.notes}"</span>
        )}
      </div>
    </div>
  );
}
