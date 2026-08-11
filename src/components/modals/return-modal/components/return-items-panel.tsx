import { PackageOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD } from "@/utils/formatters";
import { sumCurrencyTotals } from "@/components/modals/shared/currency-totals";
import type { PendingReturnItem, PendingExchangeItem } from "../types";
import { ReturnMovementBadge } from "./return-movement-badge";

type ReturnItemsPanelProps = {
  returnItems: readonly PendingReturnItem[];
  exchangeItems: readonly PendingExchangeItem[];
  onRemoveReturnItem: (id: string) => void;
  onRemoveExchangeItem: (id: string) => void;
};

type ItemRowProps = {
  code: string;
  description: string;
  quantity: number;
  totalUsd: number;
  striped: boolean;
  onRemove: () => void;
};

function ItemRow({ code, description, quantity, totalUsd, striped, onRemove }: ItemRowProps) {
  return (
    <TableRow className={cn("bg-card hover:bg-muted/30", striped && "bg-table-stripe")}>
      <TableCell>
        <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">
          <span className="product-code shrink-0 uppercase">{code}</span>
          <OverflowTooltip className="text-muted-foreground max-w-64">{description}</OverflowTooltip>
        </span>
      </TableCell>
      <TableCell className="tabular-value text-right font-medium">{quantity}</TableCell>
      <TableCell className="data-value text-right font-semibold">{formatCurrencyUSD(totalUsd)}</TableCell>
      <TableCell className="w-10 px-1.5 py-1 text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={`Eliminar ${code}`}
        >
          <Trash2 data-icon="inline-start" aria-hidden="true" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function GroupRow({ count, totalUsd, kind }: { count: number; totalUsd: number; kind: "entry" | "exit" }) {
  return (
    <TableRow className="bg-muted/35 hover:bg-muted/35">
      <TableCell colSpan={2}>
        <span className="flex items-center gap-2">
          <ReturnMovementBadge kind={kind} />
          <span className="text-muted-foreground text-[11px] font-medium">
            <span className="tabular-value">{count}</span> {count === 1 ? "producto" : "productos"}
          </span>
        </span>
      </TableCell>
      <TableCell className="data-value text-right font-bold">{formatCurrencyUSD(totalUsd)}</TableCell>
      <TableCell />
    </TableRow>
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
          <PackageOpen className="size-8 opacity-40" aria-hidden="true" />
          <span className="text-sm">Agrega productos de entrada para comenzar.</span>
        </div>
      </div>
    );
  }

  const returnTotals = sumCurrencyTotals(returnItems);
  const exchangeTotals = sumCurrencyTotals(exchangeItems);

  return (
    <div className="custom-scrollbar h-full overflow-auto">
      <Table density="compact" className="min-w-130" scrollAreaLabel="Productos de la devolución">
        <TableHeader className="bg-card sticky top-0 z-10">
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead>Producto</TableHead>
            <TableHead className="w-20 text-right">Cantidad</TableHead>
            <TableHead className="w-28 text-right">Total USD</TableHead>
            <TableHead className="h-8 w-10 px-1.5">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returnItems.length > 0 && (
            <>
              <GroupRow count={returnItems.length} totalUsd={returnTotals.usd} kind="entry" />
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
            </>
          )}

          {exchangeItems.length > 0 && (
            <>
              <GroupRow count={exchangeItems.length} totalUsd={exchangeTotals.usd} kind="exit" />
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
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
