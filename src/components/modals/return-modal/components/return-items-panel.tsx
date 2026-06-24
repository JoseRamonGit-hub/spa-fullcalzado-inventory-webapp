import { PackageOpen, Undo2, ArrowRightLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { PendingReturnItem, PendingExchangeItem } from "../types";

type ReturnItemsPanelProps = {
  returnItems: readonly PendingReturnItem[];
  exchangeItems: readonly PendingExchangeItem[];
  onRemoveReturnItem: (id: string) => void;
  onRemoveExchangeItem: (id: string) => void;
};

function ItemRow({
  code,
  description,
  quantity,
  totalUsd,
  striped,
  onRemove,
}: {
  code: string;
  description: string;
  quantity: number;
  totalUsd: number;
  striped: boolean;
  onRemove: () => void;
}) {
  return (
    <div
      className={`border-border/40 flex items-center gap-3 border-b px-4 py-1.5 ${striped ? "bg-table-stripe" : ""}`}
    >
      <span className="product-code text-xs uppercase">{code}</span>
      <span className="text-muted-foreground hidden min-w-0 flex-1 truncate text-[13px] md:block">{description}</span>
      <span className="text-muted-foreground ml-auto text-[13px] tabular-nums md:ml-0">{quantity}</span>
      <span className="text-muted-foreground w-20 text-right text-[13px] tabular-nums">
        {formatCurrencyUSD(totalUsd)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive h-6 w-6 shrink-0"
        onClick={onRemove}
        aria-label={`Eliminar ${code}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function ReturnItemsPanel({
  returnItems,
  exchangeItems,
  onRemoveReturnItem,
  onRemoveExchangeItem,
}: ReturnItemsPanelProps) {
  const isEmpty = returnItems.length === 0 && exchangeItems.length === 0;

  if (isEmpty) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground flex flex-col items-center gap-2">
          <PackageOpen className="h-8 w-8 opacity-40" />
          <span className="text-sm">Agrega productos a devolver.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto">
      {/* ── Return items group ─────────────────────────────── */}
      {returnItems.length > 0 && (
        <div>
          <div className="bg-muted/50 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-1.5">
            <div className="flex items-center gap-1.5">
              <Undo2 className="text-muted-foreground size-3" />
              <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                Entrada ({returnItems.length})
              </span>
            </div>
            <span className="text-foreground text-xs font-bold tabular-nums">
              {formatCurrencyUSD(returnItems.reduce((sum, i) => sum + i.totalUsd, 0))}
            </span>
          </div>
          {returnItems.map((item, index) => (
            <ItemRow
              key={item.tempId}
              code={item.code}
              description={item.description}
              quantity={item.quantity}
              totalUsd={item.totalUsd}
              striped={index % 2 === 1}
              onRemove={() => onRemoveReturnItem(item.tempId)}
            />
          ))}
        </div>
      )}

      {/* ── Exchange items group ───────────────────────────── */}
      {exchangeItems.length > 0 && (
        <div>
          <div className="bg-muted/50 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-1.5">
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft className="text-muted-foreground size-3" />
              <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                Salida ({exchangeItems.length})
              </span>
            </div>
            <span className="text-foreground text-xs font-bold tabular-nums">
              {formatCurrencyUSD(exchangeItems.reduce((sum, i) => sum + i.totalUsd, 0))}
            </span>
          </div>
          {exchangeItems.map((item, index) => (
            <ItemRow
              key={item.tempId}
              code={item.code}
              description={item.description}
              quantity={item.quantity}
              totalUsd={item.totalUsd}
              striped={index % 2 === 1}
              onRemove={() => onRemoveExchangeItem(item.tempId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
