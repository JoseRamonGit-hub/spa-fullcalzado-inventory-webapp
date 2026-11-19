import type {
  CashClose,
  CashCloseSummary,
  CashCloseWithRelations,
  CasheaCollectionStatus,
  CasheaOrder,
  UnclosedCashCloseDay,
  Return,
  Transaction,
} from "@/types";
import { formatDateForBackend } from "@/utils/formatters";

export type Money = { usd: number; ves: number };

/** Lo que hace falta para cuadrar un día: del Total facturado al Total producido. */
export type CashCloseFigures = {
  billedOperations: number;
  units: number;
  returnsCount: number;
  billed: Money;
  returnsCredit: Money;
  casheaReceivable: Money;
  casheaVoidedReturn: Money;
  produced: Money;
};

type LedgerReturn = Pick<Return, "type" | "credit_usd" | "credit_ves"> & {
  transactions: Pick<Transaction, "quantity" | "total_usd" | "total_ves">[];
};

export type ExchangeBreakdown = { count: number; units: number; delivered: Money; credit: Money };
type LedgerCasheaOrder = Pick<
  CasheaOrder,
  "sale_id" | "status" | "void_reason" | "voided_at" | "paid_today_usd" | "financed_usd" | "exchange_rate"
> & { sale: { transactions: LedgerReturn["transactions"] } | null };

export type CasheaBreakdown = { count: number; units: number; billed: Money; initial: Money; roundingUsd: number };
export type LedgerLineId = "sales" | "sales-and-exchanges" | "exchanges" | "returns" | "cashea";

export type LedgerDetail = {
  label: string;
  amount: Money;
  reference?: boolean;
  help?: string;
};

export type LedgerLine = {
  id: LedgerLineId;
  label: string;
  amount: Money;
  details?: LedgerDetail[];
};

const roundCents = (value: number) => Math.round(value * 100) / 100;
const CASHEA_VOIDED_RETURN_HELP =
  "La devolución restó el crédito completo, pero de caja solo salió lo cobrado en tienda.";

const isZero = (money: Money) => roundCents(money.usd) === 0 && roundCents(money.ves) === 0;

export function getSummaryFigures(summary: CashCloseSummary): CashCloseFigures {
  return {
    billedOperations: summary.billedOperations,
    units: summary.units,
    returnsCount: summary.returnsCount,
    billed: { usd: summary.totalUsd, ves: summary.totalVes },
    returnsCredit: { usd: summary.returnsCreditUsd, ves: summary.returnsCreditVes },
    casheaReceivable: { usd: summary.casheaReceivableUsd, ves: summary.casheaReceivableVes },
    casheaVoidedReturn: { usd: summary.casheaVoidedReturnUsd, ves: summary.casheaVoidedReturnVes },
    produced: { usd: summary.netUsd, ves: summary.netVes },
  };
}

/** Operaciones facturadas de un cierre; los cierres anteriores al conteo exacto solo guardan renglones. */
export function getCashCloseBilledOperations(cashClose: CashClose) {
  return cashClose.total_billed_operations ?? cashClose.total_transactions;
}

/**
 * Un cierre guarda el Total producido y cada ajuste, pero no el Total facturado: se reconstruye deshaciendo la misma
 * cuenta que hace el resumen (facturado − devoluciones − por cobrar Cashea + Cashea anulado = producido).
 */
export function getCashCloseFigures(cashClose: CashClose): CashCloseFigures {
  const returnsCredit = { usd: cashClose.total_returns_usd, ves: cashClose.total_returns_ves };
  const casheaReceivable = { usd: cashClose.cashea_receivable_usd ?? 0, ves: cashClose.cashea_receivable_ves ?? 0 };
  const casheaVoidedReturn = {
    usd: cashClose.cashea_voided_return_usd ?? 0,
    ves: cashClose.cashea_voided_return_ves ?? 0,
  };
  const produced = { usd: cashClose.total_usd, ves: cashClose.total_ves };

  return {
    billedOperations: getCashCloseBilledOperations(cashClose),
    units: cashClose.total_units_sold,
    returnsCount: cashClose.total_returns,
    billed: {
      usd: roundCents(produced.usd + returnsCredit.usd + casheaReceivable.usd - casheaVoidedReturn.usd),
      ves: roundCents(produced.ves + returnsCredit.ves + casheaReceivable.ves - casheaVoidedReturn.ves),
    },
    returnsCredit,
    casheaReceivable,
    casheaVoidedReturn,
    produced,
  };
}

const zero: Money = { usd: 0, ves: 0 };
const subtract = (a: Money, b: Money): Money => ({ usd: roundCents(a.usd - b.usd), ves: roundCents(a.ves - b.ves) });
const add = (a: Money, b: Money): Money => ({ usd: roundCents(a.usd + b.usd), ves: roundCents(a.ves + b.ves) });

export function getCasheaBreakdown(
  receivable: Money,
  date: string,
  orders?: LedgerCasheaOrder[],
  closedAt?: string,
): CasheaBreakdown | undefined {
  const breakdown = { count: 0, units: 0, billed: { ...zero }, initial: { ...zero }, roundingUsd: 0 };
  if (isZero(receivable)) return breakdown;
  if (!orders) return undefined;

  const financed = { ...zero };
  const sales = new Set<string>();
  for (const order of orders) {
    const voidedAfterClose = closedAt && order.voided_at && Date.parse(order.voided_at) > Date.parse(closedAt);
    const voidedOnLaterDay =
      order.void_reason === "customer_return" && order.voided_at && formatDateForBackend(order.voided_at) > date;
    if (order.status === "voided" && !voidedAfterClose && !voidedOnLaterDay) continue;
    const items = order.sale?.transactions;
    if (!items?.length || sales.has(order.sale_id)) return undefined;
    sales.add(order.sale_id);
    breakdown.count++;
    breakdown.initial.usd += order.paid_today_usd;
    financed.usd += order.financed_usd;
    const financedCents = Math.round(order.financed_usd * 100);
    const rate = Math.round(order.exchange_rate * 10_000);
    financed.ves += Math.round((financedCents * rate) / 10_000) / 100;
    for (const item of items) {
      breakdown.units += item.quantity;
      breakdown.billed.usd += item.total_usd ?? 0;
      breakdown.billed.ves += item.total_ves ?? 0;
    }
  }

  // El desglose debe reconciliar con el financiamiento del cuadre, incluso para cierres guardados.
  if (!isZero(subtract(financed, receivable))) return undefined;
  breakdown.initial.usd = roundCents(breakdown.initial.usd);
  breakdown.initial.ves = roundCents(breakdown.billed.ves - financed.ves);
  breakdown.roundingUsd = roundCents(breakdown.billed.usd - financed.usd - breakdown.initial.usd);
  return breakdown;
}

export function getExchangeBreakdown(
  figures: CashCloseFigures,
  records?: LedgerReturn[],
): ExchangeBreakdown | undefined {
  const exchanges = { count: 0, units: 0, delivered: { ...zero }, credit: { ...zero } };
  if (figures.returnsCount === 0 && isZero(figures.returnsCredit)) return exchanges;
  // Los movimientos deben respaldar el cierre guardado antes de desglosar sus cifras.
  if (!records || records.length !== figures.returnsCount) return undefined;
  const totalCredit = { ...zero };
  for (const record of records) {
    totalCredit.usd += record.credit_usd;
    totalCredit.ves += record.credit_ves;
    if (record.type !== "exchange") continue;
    exchanges.count++;
    exchanges.credit.usd += record.credit_usd;
    exchanges.credit.ves += record.credit_ves;
    for (const item of record.transactions) {
      exchanges.units += item.quantity;
      exchanges.delivered.usd += item.total_usd ?? 0;
      exchanges.delivered.ves += item.total_ves ?? 0;
    }
  }
  return isZero(subtract(totalCredit, figures.returnsCredit)) ? exchanges : undefined;
}

export function getLedgerLines(
  figures: CashCloseFigures,
  exchanges?: ExchangeBreakdown,
  cashea?: CasheaBreakdown,
): LedgerLine[] {
  const lines: LedgerLine[] = [];
  const billed = subtract(figures.billed, cashea?.billed ?? zero);
  if (exchanges) {
    lines.push({
      id: "sales",
      label: cashea ? "Ventas" : "Ventas con y sin Cashea",
      amount: subtract(billed, exchanges.delivered),
    });
    lines.push({
      id: "exchanges",
      label: "Cambios",
      amount: subtract(exchanges.delivered, exchanges.credit),
      details:
        exchanges.count > 0
          ? [
              { label: "Entregado al cliente", amount: exchanges.delivered },
              { label: "Crédito por lo devuelto", amount: subtract(zero, exchanges.credit) },
            ]
          : undefined,
    });
    lines.push({ id: "returns", label: "Devoluciones", amount: subtract(exchanges.credit, figures.returnsCredit) });
  } else {
    lines.push({
      id: "sales-and-exchanges",
      label: cashea?.count ? "Ventas y cambios sin Cashea" : "Ventas y cambios",
      amount: billed,
    });
    lines.push({
      id: "returns",
      label: "Crédito por cambios y devoluciones",
      amount: subtract(zero, figures.returnsCredit),
    });
  }
  lines.push(getCasheaLine(figures, cashea));

  return lines;
}

function getCasheaLine(figures: CashCloseFigures, cashea?: CasheaBreakdown): LedgerLine {
  const { casheaReceivable, casheaVoidedReturn } = figures;
  const details: LedgerDetail[] = [];
  if (cashea?.count) {
    details.push({ label: "Iniciales cobradas", amount: cashea.initial });
  }
  if (!isZero(casheaReceivable)) {
    details.push({
      label: cashea ? "Monto financiado · fuera del total" : "Por cobrar a Cashea",
      amount: cashea ? casheaReceivable : subtract(zero, casheaReceivable),
      reference: Boolean(cashea),
    });
  }
  if (cashea && cashea.roundingUsd !== 0) {
    details.push({ label: "Redondeo Cashea", amount: { usd: cashea.roundingUsd, ves: 0 } });
  }
  if (!isZero(casheaVoidedReturn)) {
    details.push({
      label: "Cashea anulado por devolución",
      amount: casheaVoidedReturn,
      help: CASHEA_VOIDED_RETURN_HELP,
    });
  }

  return {
    id: "cashea",
    label: "Cashea",
    amount: add(subtract(cashea?.billed ?? zero, casheaReceivable), casheaVoidedReturn),
    details: details.length > 0 ? details : undefined,
  };
}

export function isLedgerAmountZero(amount: Money) {
  return isZero(amount);
}

type HistoryRowBase = {
  id: string;
  date: string;
  figures: CashCloseFigures;
  cashea?: CasheaCollectionStatus;
};

/** Una fila del historial: un cierre, o un día con ventas que nadie cerró. Las dos se leen con la misma cuenta. */
export type CashCloseHistoryRow =
  | (HistoryRowBase & { kind: "closed"; cashClose: CashCloseWithRelations })
  | (HistoryRowBase & { kind: "unclosed" });

type HistoryInput = {
  cashCloses: CashCloseWithRelations[];
  unclosedDays: UnclosedCashCloseDay[];
  casheaStatuses: CasheaCollectionStatus[];
};

export function buildCashCloseHistory({ cashCloses, unclosedDays, casheaStatuses }: HistoryInput) {
  const casheaByDate = new Map(casheaStatuses.map((status) => [status.sale_date, status]));

  const rows: CashCloseHistoryRow[] = [
    ...cashCloses.map((cashClose) => ({
      kind: "closed" as const,
      id: cashClose.id,
      date: cashClose.date,
      figures: getCashCloseFigures(cashClose),
      cashea: casheaByDate.get(cashClose.date),
      cashClose,
    })),
    ...unclosedDays.map((day) => ({
      kind: "unclosed" as const,
      id: `unclosed-${day.date}`,
      date: day.date,
      figures: getSummaryFigures(day.summary),
      cashea: casheaByDate.get(day.date),
    })),
  ];

  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export type CashCloseDayState<T extends CashClose = CashClose> =
  /** Hoy, todavía sin cierre. `skippedDays`: días con ventas sin cerrar desde el último cierre. */
  | { kind: "open"; lastClose?: T; isLastCloseYesterday: boolean; skippedDays: number }
  /** El cierre guardado coincide con lo que se ve. */
  | { kind: "closed"; cashClose: T }
  /** Hoy se cerró, pero después hubo operaciones: el cierre guardado ya no cuadra con el día. */
  | { kind: "outdated"; cashClose: T; deltaUsd: number; deltaVes: number }
  /** Un día pasado que nadie cerró; sin ventas, no cerrarlo no es un olvido. */
  | { kind: "unclosed"; hadSales: boolean };

type DayStateInput<T extends CashClose> = {
  viewedDate: string;
  todayKey: string;
  figures: CashCloseFigures;
  cashClose?: T;
  lastClose?: T;
  /** Días anteriores a hoy con ventas y sin cierre. */
  unclosedDates: string[];
};

function isCashCloseOutdated(cashClose: CashClose, figures: CashCloseFigures) {
  return (
    roundCents(cashClose.total_usd) !== roundCents(figures.produced.usd) ||
    roundCents(cashClose.total_ves) !== roundCents(figures.produced.ves) ||
    getCashCloseBilledOperations(cashClose) !== figures.billedOperations ||
    cashClose.total_units_sold !== figures.units ||
    cashClose.total_returns !== figures.returnsCount
  );
}

export function getCashCloseDayState<T extends CashClose>({
  viewedDate,
  todayKey,
  figures,
  cashClose,
  lastClose,
  unclosedDates,
}: DayStateInput<T>): CashCloseDayState<T> {
  const isToday = viewedDate === todayKey;

  if (!cashClose) {
    if (!isToday) return { kind: "unclosed", hadSales: figures.billedOperations > 0 };

    return {
      kind: "open",
      lastClose,
      isLastCloseYesterday: lastClose?.date === shiftDateKey(todayKey, -1),
      skippedDays: unclosedDates.filter((date) => !lastClose || date > lastClose.date).length,
    };
  }

  // Solo el día de hoy puede volver a cerrarse; un día pasado se muestra tal como quedó.
  if (isToday && isCashCloseOutdated(cashClose, figures)) {
    return {
      kind: "outdated",
      cashClose,
      deltaUsd: roundCents(figures.produced.usd - cashClose.total_usd),
      deltaVes: roundCents(figures.produced.ves - cashClose.total_ves),
    };
  }

  return { kind: "closed", cashClose };
}
