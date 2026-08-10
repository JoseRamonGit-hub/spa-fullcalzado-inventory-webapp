import type { ReturnWithRelations } from "@/types";

type ReturnOutcomeSource = Pick<ReturnWithRelations, "type" | "difference_usd" | "difference_ves">;
type ReturnMovementSource = Pick<ReturnWithRelations, "return_items" | "transactions">;
type ReturnCreditSource = Pick<ReturnWithRelations, "credit_usd" | "credit_ves"> & ReturnMovementSource;

export type ReturnOutcome = {
  label: "Tienda devuelve" | "Cliente paga" | "Cambio exacto";
  usd: number;
  ves: number;
  className: "text-success" | "text-destructive" | "text-foreground";
};

export function getReturnOutcome(record: ReturnOutcomeSource): ReturnOutcome {
  const label =
    record.type === "refund" || record.difference_usd < 0
      ? "Tienda devuelve"
      : record.difference_usd > 0
        ? "Cliente paga"
        : "Cambio exacto";

  return {
    label,
    usd: Math.abs(record.difference_usd),
    ves: Math.abs(record.difference_ves),
    className:
      record.difference_usd > 0 ? "text-success" : record.difference_usd < 0 ? "text-destructive" : "text-foreground",
  };
}

export function getReturnMovementTotals(record: ReturnMovementSource) {
  return {
    entries: record.return_items.reduce((total, item) => total + item.quantity, 0),
    exits: record.transactions.reduce((total, transaction) => total + transaction.quantity, 0),
  };
}

export function getReturnPurchaseTotals(record: Pick<ReturnWithRelations, "transactions">) {
  return record.transactions.reduce(
    (totals, transaction) => ({
      usd: totals.usd + (transaction.total_usd ?? 0),
      ves: totals.ves + (transaction.total_ves ?? 0),
    }),
    { usd: 0, ves: 0 },
  );
}

export function getReturnsSummary(records: readonly ReturnCreditSource[]) {
  return records.reduce(
    (summary, record) => {
      const movements = getReturnMovementTotals(record);

      return {
        operations: summary.operations + 1,
        entries: summary.entries + movements.entries,
        exits: summary.exits + movements.exits,
        creditUsd: summary.creditUsd + record.credit_usd,
        creditVes: summary.creditVes + record.credit_ves,
      };
    },
    { operations: 0, entries: 0, exits: 0, creditUsd: 0, creditVes: 0 },
  );
}
