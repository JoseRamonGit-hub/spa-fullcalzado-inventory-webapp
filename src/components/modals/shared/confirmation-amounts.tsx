import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

type Amount = { label: string; usd: number; ves: number | null };

export function ConfirmationAmounts({
  details = [],
  total,
  rate,
  totalClassName,
}: {
  details?: Amount[];
  total: Amount;
  rate: string | null;
  totalClassName?: string;
}) {
  return (
    <div className="bg-card min-w-0 overflow-hidden rounded-md border">
      <table className="w-full text-xs">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr className="border-b">
            <th scope="col" className="operational-label px-3 pt-[calc(var(--spacing)*1+1px)] pb-[calc(var(--spacing)*1-1px)] text-left">
              Importes
            </th>
            <th scope="col" className="operational-label px-2 pt-[calc(var(--spacing)*1+1px)] pb-[calc(var(--spacing)*1-1px)] text-right">
              USD
            </th>
            <th scope="col" className="operational-label border-l px-3 pt-[calc(var(--spacing)*1+1px)] pb-[calc(var(--spacing)*1-1px)] text-right">
              Bs.
            </th>
          </tr>
        </thead>
        <tbody className="divide-border/60 divide-y">
          {[...details, total].map((row) => (
            <tr key={row.label} className={cn(row === total && "font-semibold", row === total && totalClassName)}>
              <th scope="row" className={cn("px-3 py-1.5 text-left", row === total ? "font-semibold" : "font-normal")}>
                {row.label}
              </th>
              <td className="data-value px-2 py-1.5 text-right">{formatCurrencyUSD(row.usd)}</td>
              <td
                className={cn(
                  "data-value border-l px-3 py-1.5 text-right font-normal",
                  row === total ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {row.ves === null ? "—" : formatCurrencyVES(row.ves)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rate && (
        <p className="bg-muted/30 text-muted-foreground flex justify-between gap-2 border-t px-3 py-1.5 text-xs">
          Tasa aplicada <span className="data-value">{rate}</span>
        </p>
      )}
    </div>
  );
}
