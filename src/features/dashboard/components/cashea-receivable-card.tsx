import { useNavigate } from "@tanstack/react-router";
import { formatCasheaAgeDays, getCasheaOrderAgeDays } from "@/features/cashea/cashea-receivables";
import { CasheaHorizontalLogo } from "@/features/cashea/components/cashea-logo-icon";
import { formatCurrencyUSD, formatInteger } from "@/utils/formatters";
import { useDashboardCasheaReceivable } from "../hooks/useDashboardMetrics";
import { DashboardMetricCard, DashboardMetricCardSkeleton } from "./dashboard-metric-card";

const CARD_PROPS = { className: "col-span-full", inline: true };
const TITLE = (
  <span className="flex items-center gap-3">
    <CasheaHorizontalLogo />
    Saldo pendiente
  </span>
);

export function CasheaReceivableCard() {
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = useDashboardCasheaReceivable();

  if (isPending) return <DashboardMetricCardSkeleton {...CARD_PROPS} />;

  if (isError) {
    return (
      <DashboardMetricCard
        {...CARD_PROPS}
        title={TITLE}
        value="—"
        description="No se pudo cargar el saldo."
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
      {...CARD_PROPS}
      title={TITLE}
      value={formatCurrencyUSD(data.financed_usd)}
      description={ageDays == null ? ordersLabel : `${ordersLabel} · más antigua: ${formatCasheaAgeDays(ageDays)}`}
      actionLabel={count > 0 ? "Ver pendientes" : undefined}
      onAction={() => navigate({ to: "/receivables/cashea" })}
    />
  );
}
