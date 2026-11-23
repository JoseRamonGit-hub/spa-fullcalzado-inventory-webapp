import type { CasheaOrder } from "@/types";
import { formatCurrencyUSD } from "@/utils/formatters";
import { getCasheaCommissionUsd } from "../cashea-receivables";

export function getCasheaOrderAmountRows(order: CasheaOrder) {
  const commission = getCasheaCommissionUsd(order);
  return [
    { label: "Total de la orden", value: formatCurrencyUSD(order.total_usd) },
    { label: "Inicial", value: formatCurrencyUSD(order.paid_today_usd) },
    { label: "Monto financiado", value: formatCurrencyUSD(order.financed_usd) },
    { label: "Comisión Cashea", value: formatCurrencyUSD(commission === 0 ? 0 : -commission) },
  ];
}
