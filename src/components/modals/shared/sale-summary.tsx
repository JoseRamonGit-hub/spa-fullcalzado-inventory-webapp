import type { ReactNode } from "react";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

export type SaleSummaryLine = {
  key: string;
  code: string;
  description: string;
  quantity: number;
  totalUsd: number;
};

type SaleSummaryTableProps = {
  lines: SaleSummaryLine[];
  totalUsd: number;
  totalVes: number | null;
  exchangeRate: string | null;
  notice?: ReactNode;
};

const MAX_VISIBLE_LINES = 5;

const HEAD_CELL = "text-muted-foreground bg-muted h-8 border-b px-3 text-[11px] font-semibold uppercase";
const BODY_CELL = "border-border/60 h-10 border-b px-3 group-last:border-b-0";

export function SaleSummaryTable({ lines, totalUsd, totalVes, exchangeRate, notice }: SaleSummaryTableProps) {
  const unitCount = lines.reduce((total, line) => total + line.quantity, 0);

  return (
    <section
      aria-label="Productos de la venta"
      className={cn(
        "bg-card custom-scrollbar overflow-y-auto rounded-lg border",
        lines.length > MAX_VISIBLE_LINES && "max-h-[18.5rem]",
      )}
    >
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <colgroup>
          <col />
          <col className="w-12 sm:w-16" />
          <col className="w-24 sm:w-28" />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr>
            <th scope="col" className={cn(HEAD_CELL, "text-left")}>
              Producto
            </th>
            <th scope="col" className={cn(HEAD_CELL, "text-right")}>
              Cant.
            </th>
            <th scope="col" className={cn(HEAD_CELL, "text-right")}>
              Importe
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.key} className="group">
              <td className={BODY_CELL}>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="product-code shrink-0 text-xs uppercase">{line.code}</span>
                  <OverflowTooltip className="min-w-0">{line.description}</OverflowTooltip>
                </span>
              </td>
              <td className={cn(BODY_CELL, "tabular-value text-right")}>{line.quantity}</td>
              <td className={cn(BODY_CELL, "data-value text-right font-medium")}>{formatCurrencyUSD(line.totalUsd)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-muted sticky bottom-0">
          <tr>
            <th scope="row" className="h-10 border-t px-3 text-left font-semibold">
              Total
            </th>
            <td className="tabular-value text-muted-foreground h-10 border-t px-3 text-right">{unitCount}</td>
            <td className="data-value h-10 border-t px-3 text-right text-base font-bold whitespace-nowrap">
              {formatCurrencyUSD(totalUsd)}
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="text-muted-foreground px-3 pb-2 text-right text-xs whitespace-nowrap">
              <span className="data-value">{totalVes === null ? "— Bs." : formatCurrencyVES(totalVes)}</span>
              {exchangeRate && (
                <>
                  <span aria-hidden="true"> · </span>
                  Tasa <span className="data-value text-foreground font-medium">{exchangeRate}</span>
                </>
              )}
            </td>
          </tr>
          {notice && (
            <tr>
              <td colSpan={3} className="px-3 pb-2">
                {notice}
              </td>
            </tr>
          )}
        </tfoot>
      </table>
    </section>
  );
}
