type CurrencyTotalItem = {
  totalUsd: number;
  totalVes: number;
};

export type CurrencyTotals = {
  usd: number;
  ves: number;
};

const EMPTY_CURRENCY_TOTALS: CurrencyTotals = { usd: 0, ves: 0 };

export function sumCurrencyTotals(items: readonly CurrencyTotalItem[]): CurrencyTotals {
  return items.reduce(
    (totals, item) => ({
      usd: totals.usd + item.totalUsd,
      ves: totals.ves + item.totalVes,
    }),
    EMPTY_CURRENCY_TOTALS,
  );
}
