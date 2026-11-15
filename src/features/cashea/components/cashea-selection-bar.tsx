import { Button } from "@/components/ui/button";
import type { CasheaOrder } from "@/types";
import { formatCurrencyUSD, formatInteger } from "@/utils/formatters";
import { getCasheaPendingSummary } from "../cashea-receivables";

type CasheaSelectionBarProps = {
  orders: CasheaOrder[];
  onClear: () => void;
  onRegisterDeposit: () => void;
};

export function CasheaSelectionBar({ orders, onClear, onRegisterDeposit }: CasheaSelectionBarProps) {
  const { count, expectedNetUsd } = getCasheaPendingSummary(orders);

  return (
    <section
      aria-label="Órdenes seleccionadas"
      className="bg-muted/60 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2 md:px-4"
    >
      <p className="min-w-0 truncate text-sm">
        <span className="font-semibold tabular-nums">{formatInteger(count)}</span>{" "}
        {count === 1 ? "orden seleccionada" : "órdenes seleccionadas"}
        <span className="text-muted-foreground"> · Neto esperado </span>
        <span className="data-value font-semibold">{formatCurrencyUSD(expectedNetUsd)}</span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClear}>
          Quitar selección
        </Button>
        <Button size="sm" onClick={onRegisterDeposit}>
          Registrar depósito
        </Button>
      </div>
    </section>
  );
}
