import type { ReturnWithRelations, TransactionWithRelations } from "@/types";

type SaleSummarySource = Pick<
  TransactionWithRelations,
  "sale_id" | "return_id" | "quantity" | "price_usd" | "price_ves"
>;
type ReturnSummarySource = Pick<ReturnWithRelations, "credit_usd" | "credit_ves">;

export function getSalesSummary(transactions: readonly SaleSummarySource[], returns: readonly ReturnSummarySource[]) {
  const countedSaleIds = new Set<string>();
  const sales = transactions.reduce(
    (summary, transaction) => {
      const isFirstLineOfGroupedSale = transaction.sale_id !== null && !countedSaleIds.has(transaction.sale_id);
      const isLegacySale = transaction.sale_id === null && transaction.return_id === null;
      if (transaction.sale_id !== null) countedSaleIds.add(transaction.sale_id);

      return {
        salesCount: summary.salesCount + (isLegacySale || isFirstLineOfGroupedSale ? 1 : 0),
        units: summary.units + transaction.quantity,
        grossUsd: summary.grossUsd + transaction.price_usd * transaction.quantity,
        grossVes: summary.grossVes + transaction.price_ves * transaction.quantity,
      };
    },
    { salesCount: 0, units: 0, grossUsd: 0, grossVes: 0 },
  );

  const returnCredits = returns.reduce(
    (summary, record) => ({
      count: summary.count + 1,
      usd: summary.usd + record.credit_usd,
      ves: summary.ves + record.credit_ves,
    }),
    { count: 0, usd: 0, ves: 0 },
  );

  return {
    ...sales,
    returnsCount: returnCredits.count,
    returnsCreditUsd: returnCredits.usd,
    returnsCreditVes: returnCredits.ves,
    netUsd: sales.grossUsd - returnCredits.usd,
    netVes: sales.grossVes - returnCredits.ves,
  };
}
