import { useNavigate } from "@tanstack/react-router";
import { ReceivableInvoice } from "@/components/icons/receivable-invoice";
import { formatCasheaAgeDays, getCasheaOrderAgeDays } from "@/features/cashea/cashea-receivables";
import { formatCurrencyUSD, formatInteger } from "@/utils/formatters";
import { useDashboardCasheaReceivable } from "../hooks/useDashboardMetrics";
import { DashboardMetricCard, DashboardMetricCardSkeleton } from "./dashboard-metric-card";

const CARD_CLASS_NAME = "min-[360px]:max-xl:col-span-2";
const TITLE = "Saldo pendiente Cashea";

export function CasheaReceivableCard() {
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = useDashboardCasheaReceivable();

  if (isPending) return <DashboardMetricCardSkeleton className={CARD_CLASS_NAME} />;

  if (isError) {
    return (
      <DashboardMetricCard
        className={CARD_CLASS_NAME}
        title={TITLE}
        value="—"
        description="No se pudo cargar el saldo."
        icon={ReceivableInvoice}
        actionLabel="Reintentar"
        onAction={() => refetch()}
      />
    );
  }

  const count = data.orders_count;
  const ageDays = data.oldest_sale_date ? getCasheaOrderAgeDays(data.oldest_sale_date) : null;
  const ordersLabel = `${formatInteger(count)} ${count === 1 ? "orden pendiente" : "órdenes pendientes"}`;

  return (
    <DashboardMetricCard
      className={CARD_CLASS_NAME}
      title={TITLE}
      value={formatCurrencyUSD(data.financed_usd)}
      description={ageDays == null ? ordersLabel : `${ordersLabel} · más antigua: ${formatCasheaAgeDays(ageDays)}`}
      icon={ReceivableInvoice}
      actionLabel={count > 0 ? "Ver pendientes" : undefined}
      onAction={() => navigate({ to: "/receivables/cashea" })}
    />
  );
}
