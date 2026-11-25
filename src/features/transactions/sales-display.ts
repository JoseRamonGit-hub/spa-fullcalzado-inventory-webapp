import type { CashCloseSummary, ReturnWithRelations, TransactionWithRelations } from "@/types";

export type SaleTableRow = TransactionWithRelations & { lines?: TransactionWithRelations[] };

function combineSaleLines(lines: TransactionWithRelations[]) {
  const combined = new Map<string, TransactionWithRelations>();
  for (const line of lines) {
    const key = JSON.stringify([line.product_id, line.price_usd, line.price_ves, line.return_id]);
    const previous = combined.get(key);
    if (!previous) {
      combined.set(key, { ...line });
      continue;
    }
    previous.total_usd =
      (previous.total_usd ?? previous.price_usd * previous.quantity) +
      (line.total_usd ?? line.price_usd * line.quantity);
    previous.total_ves =
      (previous.total_ves ?? previous.price_ves * previous.quantity) +
      (line.total_ves ?? line.price_ves * line.quantity);
    previous.quantity += line.quantity;
  }
  return [...combined.values()];
}

export function groupSaleRows(transactions: readonly TransactionWithRelations[]): SaleTableRow[] {
  const groups = new Map<string, TransactionWithRelations[]>();
  for (const line of transactions) {
    const key = line.sale_id ? `sale-${line.sale_id}` : `line-${line.id}`;
    const group = groups.get(key);
    if (group) group.push(line);
    else groups.set(key, [line]);
  }

  return Array.from(groups, ([key, lines]) => {
    const first = lines[0];
    if (lines.length === 1) return first;
    const detail = combineSaleLines(lines);
    const quantity = detail.reduce((sum, line) => sum + line.quantity, 0);
    const codes = new Set(detail.map((line) => line.products?.code).filter(Boolean));
    return {
      ...first,
      id: key,
      lines: detail,
      products: {
        code: codes.size === 1 ? [...codes][0] : "Varios",
        description: `${quantity} ${quantity === 1 ? "unidad" : "unidades"}`,
      },
      quantity,
      total_usd: lines.reduce((sum, line) => sum + (line.total_usd ?? line.price_usd * line.quantity), 0),
      total_ves: lines.reduce((sum, line) => sum + (line.total_ves ?? line.price_ves * line.quantity), 0),
    };
  });
}

/** La Orden Cashea vigente (no anulada) de la Venta del Renglón; `null` si no es una Venta Cashea. */
export function getActiveCasheaOrder(transaction: Pick<TransactionWithRelations, "sales">) {
  return transaction.sales?.cashea_orders.find((order) => order.status !== "voided") ?? null;
}

type AttachCasheaOrderSource = Pick<TransactionWithRelations, "sale_id" | "return_id" | "date" | "sales">;

/**
 * «Asociar orden Cashea» se ofrece en los Renglones de una Venta sin Orden Cashea vigente: al empleado solo si la
 * venta es de hoy; al Administrador, de cualquier fecha. La base de datos aplica la misma regla.
 */
export function canAttachCasheaOrder(
  transaction: AttachCasheaOrderSource,
  { isAdmin, today }: { isAdmin: boolean; today: string },
) {
  if (transaction.sale_id === null || transaction.return_id !== null) return false;
  if (getActiveCasheaOrder(transaction)) return false;
  return isAdmin || transaction.date === today;
}

export type SaleSummarySource = Pick<
  TransactionWithRelations,
  "sale_id" | "return_id" | "quantity" | "price_usd" | "price_ves"
>;
export type ReturnSummarySource = Pick<ReturnWithRelations, "credit_usd" | "credit_ves">;
/** Importes Cashea del resumen del cierre del día; no se recalculan en el cliente. */
export type CasheaSummarySource = Pick<
  CashCloseSummary,
  "casheaReceivableUsd" | "casheaReceivableVes" | "casheaVoidedReturnUsd" | "casheaVoidedReturnVes"
>;

const NO_CASHEA: CasheaSummarySource = {
  casheaReceivableUsd: 0,
  casheaReceivableVes: 0,
  casheaVoidedReturnUsd: 0,
  casheaVoidedReturnVes: 0,
};

export function getSalesSummary(
  transactions: readonly SaleSummarySource[],
  returns: readonly ReturnSummarySource[],
  cashea: CasheaSummarySource = NO_CASHEA,
) {
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
    netUsd: sales.grossUsd - returnCredits.usd - cashea.casheaReceivableUsd + cashea.casheaVoidedReturnUsd,
    netVes: sales.grossVes - returnCredits.ves - cashea.casheaReceivableVes + cashea.casheaVoidedReturnVes,
  };
}
