import { Lock, Hash, DollarSign, Banknote, ShoppingCart, AlertTriangle } from "lucide-react";
import { ResponsiveAlertModal } from "@/components/ResponsiveAlertModal";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

interface CashCloseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
  today: string;
  metrics: { count: number; units: number; totalUsd: number; totalVes: number };
}

export function CashCloseModal({
  open,
  onOpenChange,
  isPending,
  onConfirm,
  today,
  metrics,
}: CashCloseModalProps) {
  return (
    <ResponsiveAlertModal
      open={open}
      onOpenChange={onOpenChange}
      title="Confirmar Cierre de Caja"
      description="Estás a punto de cerrar el día de hoy. Esta acción consolidará todas las ventas registradas."
      confirmLabel="Sí, cerrar el día"
      cancelLabel="Cancelar"
      isPending={isPending}
      onConfirm={onConfirm}
    >
      <div className="space-y-3">
        <header className="bg-primary/8 border-primary/20 flex items-center gap-3 rounded-lg border px-4 py-3">
          <div className="bg-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <Lock className="text-primary h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-foreground text-sm font-semibold">Cierre del {today}</p>
            <p className="text-muted-foreground text-xs">
              {metrics.count} transacción{metrics.count !== 1 ? "es" : ""} registrada
              {metrics.count !== 1 ? "s" : ""}
            </p>
          </div>
        </header>

        <div className="bg-muted/40 grid grid-cols-2 gap-px overflow-hidden rounded-lg border">
          <div className="bg-card flex flex-col gap-0.5 px-3 py-2.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
              <DollarSign className="h-3 w-3" aria-hidden="true" /> Total USD
            </span>
            <span className="text-foreground text-sm font-bold tabular-nums">
              {formatCurrencyUSD(metrics.totalUsd)}
            </span>
          </div>
          <div className="bg-card flex flex-col gap-0.5 px-3 py-2.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
              <Banknote className="h-3 w-3" aria-hidden="true" /> Total Bs.
            </span>
            <span className="text-foreground text-sm font-bold tabular-nums">
              {formatCurrencyVES(metrics.totalVes)}
            </span>
          </div>
          <div className="bg-card flex flex-col gap-0.5 px-3 py-2.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
              <Hash className="h-3 w-3" aria-hidden="true" /> Ventas
            </span>
            <span className="text-foreground text-sm font-bold tabular-nums">{metrics.count}</span>
          </div>
          <div className="bg-card flex flex-col gap-0.5 px-3 py-2.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
              <ShoppingCart className="h-3 w-3" aria-hidden="true" /> Unidades
            </span>
            <span className="text-foreground text-sm font-bold tabular-nums">{metrics.units}</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Una vez confirmado, no se puede deshacer. Asegúrate de que todas las ventas del día están registradas.
          </p>
        </div>
      </div>
    </ResponsiveAlertModal>
  );
}
