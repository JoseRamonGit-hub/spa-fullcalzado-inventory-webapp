import type { ReactNode } from "react";
import { ResponsiveAlertModal } from "@/components/modals/shared/responsive-alert-modal";
import { cn } from "@/lib/utils";
import type { CashClose } from "@/types";
import { formatCurrencyUSD, formatCurrencyVES, formatInteger, formatTime } from "@/utils/formatters";
import type { CashCloseFigures } from "../cash-close-ledger";

type CashCloseModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
  dateLabel: string;
  figures: CashCloseFigures;
  /** El cierre que se va a reemplazar, cuando el día ya se había cerrado. */
  previousClose?: CashClose;
};

function SummaryRow({ label, children, isKey }: { label: string; children: ReactNode; isKey?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2.5">
      <dt className={cn("text-muted-foreground", isKey && "text-foreground font-medium")}>{label}</dt>
      <dd className="data-value text-right">{children}</dd>
    </div>
  );
}

/** Confirmación corta: el cuadre completo ya está en la vista, aquí solo va la cifra que se guarda. */
export function CashCloseModal({
  open,
  onOpenChange,
  isPending,
  onConfirm,
  dateLabel,
  figures,
  previousClose,
}: CashCloseModalProps) {
  const isUpdate = Boolean(previousClose);

  return (
    <ResponsiveAlertModal
      open={open}
      onOpenChange={onOpenChange}
      title={isUpdate ? `Actualizar el cierre del ${dateLabel}` : `Cerrar el día ${dateLabel}`}
      description={isUpdate ? "Se reemplazará el cierre guardado de este día." : undefined}
      confirmLabel={isUpdate ? "Actualizar cierre" : "Cerrar el día"}
      isPending={isPending}
      onConfirm={onConfirm}
    >
      <dl className="flex flex-col border-t text-sm">
        {previousClose && (
          <SummaryRow label={`Cierre de las ${formatTime(previousClose.closed_at)}`}>
            <span className="text-muted-foreground block">{formatCurrencyUSD(previousClose.total_usd)}</span>
            <span className="text-muted-foreground block text-xs">{formatCurrencyVES(previousClose.total_ves)}</span>
          </SummaryRow>
        )}
        <SummaryRow label={isUpdate ? "Nuevo total producido" : "Total producido"} isKey>
          <span className="font-heading block text-xl leading-tight font-bold tracking-tight">
            {formatCurrencyUSD(figures.produced.usd)}
          </span>
          <span className="text-muted-foreground text-xs font-semibold">{formatCurrencyVES(figures.produced.ves)}</span>
        </SummaryRow>
        <SummaryRow label="Operaciones facturadas">{formatInteger(figures.billedOperations)}</SummaryRow>
      </dl>
    </ResponsiveAlertModal>
  );
}
