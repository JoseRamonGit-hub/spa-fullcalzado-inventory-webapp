import { Fragment, useState, type ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CasheaLogoIcon } from "@/features/cashea/components/cashea-logo-icon";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES, formatInteger } from "@/utils/formatters";
import {
  getCasheaBreakdown,
  getExchangeBreakdown,
  getLedgerLines,
  isLedgerAmountZero,
  type CashCloseFigures,
  type CasheaBreakdown,
  type ExchangeBreakdown,
  type LedgerLine,
  type LedgerLineId,
  type Money,
} from "../cash-close-ledger";
import { useLedgerCasheaOrders, useLedgerReturns } from "../hooks/useCashCloseQueries";

const MISSING_VALUE = "—";
const DETAIL_CELL_CLASS_NAME = "hidden @min-[34rem]/ledger:table-cell";

function formatAmount(value: number, format: (amount: number) => string, showPlus: boolean) {
  const sign = value < 0 ? "−" : value > 0 && showPlus ? "+" : "";
  return sign + format(Math.abs(value));
}

function countLabel(count: number, singular: string, plural: string) {
  return `${formatInteger(count)} ${count === 1 ? singular : plural}`;
}

function getLineDetail(
  line: LedgerLine,
  figures: CashCloseFigures,
  exchanges?: ExchangeBreakdown,
  cashea?: CasheaBreakdown,
) {
  switch (line.id) {
    case "sales":
      return `${countLabel(figures.billedOperations - (exchanges?.count ?? 0) - (cashea?.count ?? 0), "venta", "ventas")} · ${countLabel(figures.units - (exchanges?.units ?? 0) - (cashea?.units ?? 0), "unidad", "unidades")}`;
    case "exchanges":
      return countLabel(exchanges?.count ?? 0, "cambio", "cambios");
    case "cashea":
      return cashea?.count ? countLabel(cashea.count, "orden", "órdenes") : undefined;
    case "sales-and-exchanges":
      return `${countLabel(figures.billedOperations - (cashea?.count ?? 0), "operación", "operaciones")} · ${countLabel(figures.units - (cashea?.units ?? 0), "unidad", "unidades")}`;
    case "returns":
      return exchanges ? countLabel(figures.returnsCount - exchanges.count, "devolución", "devoluciones") : undefined;
    default:
      return undefined;
  }
}

function LedgerHelp({ label, children }: { label: string; children: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground -my-1" aria-label={label}>
          <Info aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

type CashCloseLedgerTableProps = {
  figures: CashCloseFigures;
  date: string;
  closedAt?: string;
  /** Rótulo de la primera columna de la cabecera: el día, o «Cuadre» cuando el día ya está dicho arriba. */
  title: string;
  density: "operational" | "compact";
  hasExactOperationCount?: boolean;
};

/**
 * El cuadre de un día como una cuenta: cada renglón con su signo y en las dos monedas, y el Total producido como
 * resultado. USD y Bs. son el mismo dinero, así que van en columnas y no como cifras separadas.
 */
export function CashCloseLedgerTable({
  figures,
  date,
  closedAt,
  title,
  density,
  hasExactOperationCount = true,
}: CashCloseLedgerTableProps) {
  const returnsQuery = useLedgerReturns(date, figures, closedAt);
  const casheaQuery = useLedgerCasheaOrders(date, figures.casheaReceivable, closedAt);
  const exchanges = getExchangeBreakdown(figures, returnsQuery.data);
  const cashea = getCasheaBreakdown(figures.casheaReceivable, date, casheaQuery.data, closedAt);
  const lines = getLedgerLines(figures, exchanges, cashea);
  const [expandedLines, setExpandedLines] = useState<Partial<Record<LedgerLineId, boolean>>>({});
  const isOperational = density === "operational";
  const totalCellClassName = cn("font-bold", isOperational ? "h-12" : "h-9");
  const totalAmountClassName = cn(
    "data-value text-right text-base",
    !isOperational && "@max-[24rem]/ledger:text-sm",
    totalCellClassName,
  );

  function renderLine(line: LedgerLine) {
    const canExpand = Boolean(line.details?.length);
    const isZero = isLedgerAmountZero(line.amount) && !canExpand;
    const expanded = expandedLines[line.id] ?? false;
    const detail =
      !hasExactOperationCount && (line.id === "sales" || line.id === "sales-and-exchanges")
        ? undefined
        : getLineDetail(line, figures, exchanges, cashea);
    const salesLink = line.id === "sales" && detail && (
      <Link
        to="/transactions"
        search={{ date }}
        className="hover:text-primary focus-visible:outline-ring rounded-sm underline-offset-2 hover:underline"
      >
        {detail}
      </Link>
    );
    const isCashea = line.id === "cashea";
    const useSalesCountAsLabel = !isOperational && line.label === "Ventas" && Boolean(salesLink);
    const showPlus = isCashea || line.id === "exchanges";
    const label = (
      <>
        {isCashea && <CasheaLogoIcon className="size-3.5 shrink-0 rounded-[3px]" />}
        {line.label}
      </>
    );

    return (
      <Fragment key={line.id}>
        <TableRow
          className={cn("border-border/40", canExpand ? "cursor-pointer" : "hover:bg-transparent")}
          onClick={
            canExpand ? () => setExpandedLines((current) => ({ ...current, [line.id]: !current[line.id] })) : undefined
          }
        >
          <TableCell
            className={cn(
              "whitespace-normal @min-[34rem]/ledger:whitespace-nowrap",
              isZero ? "text-muted-foreground" : "font-medium",
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {canExpand ? (
                <button
                  type="button"
                  aria-expanded={expanded}
                  className="focus-visible:outline-ring inline-flex min-h-7 flex-wrap items-center gap-x-1.5 rounded-sm text-left hover:underline @max-[34rem]/ledger:-my-1 @max-[34rem]/ledger:min-h-9"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {label}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn("text-muted-foreground size-3.5 shrink-0", expanded && "rotate-180")}
                    />
                  </span>
                  {detail && (
                    <span
                      className={cn(
                        "text-muted-foreground text-xs font-normal",
                        isOperational && "@min-[34rem]/ledger:hidden",
                      )}
                    >
                      {detail}
                    </span>
                  )}
                </button>
              ) : useSalesCountAsLabel ? (
                salesLink
              ) : (
                label
              )}
              {line.id === "sales" && cashea && (
                <LedgerHelp label="Qué incluye Ventas">
                  No incluye las ventas del bloque Cashea, los cambios ni las devoluciones.
                </LedgerHelp>
              )}
            </span>
            {salesLink && !useSalesCountAsLabel && (
              <span
                className={cn(
                  "text-xs",
                  isOperational
                    ? "block @min-[34rem]/ledger:hidden"
                    : "text-muted-foreground inline-block ps-1.5 font-normal",
                )}
              >
                {salesLink}
              </span>
            )}
          </TableCell>
          {isOperational && (
            <TableCell className={cn("text-muted-foreground text-xs", DETAIL_CELL_CLASS_NAME)}>
              {salesLink || (isZero ? null : detail)}
            </TableCell>
          )}
          <TableCell
            className={cn("data-value text-right", isZero ? "text-muted-foreground font-normal" : "font-medium")}
          >
            {isZero ? MISSING_VALUE : formatAmount(line.amount.usd, formatCurrencyUSD, showPlus)}
          </TableCell>
          <TableCell className="data-value text-muted-foreground text-right text-xs font-normal">
            {isZero ? MISSING_VALUE : formatAmount(line.amount.ves, formatCurrencyVES, showPlus)}
          </TableCell>
        </TableRow>
        {expanded && canExpand && (
          <>
            {isCashea && !cashea && (
              <LedgerDetailRow showDetailColumn={isOperational} reference>
                {casheaQuery.isLoading ? "Cargando iniciales…" : "Desglose de iniciales no disponible"}
                {casheaQuery.isError && (
                  <button type="button" className="ms-1 underline" onClick={() => casheaQuery.refetch()}>
                    Reintentar
                  </button>
                )}
              </LedgerDetailRow>
            )}
            {line.details?.map(({ label, amount, reference, help }) => (
              <LedgerDetailRow
                key={label}
                amount={amount}
                reference={reference}
                showPlus={isCashea && !reference}
                showDetailColumn={isOperational}
              >
                {label}
                {help && <LedgerHelp label={`Qué significa ${label}`}>{help}</LedgerHelp>}
              </LedgerDetailRow>
            ))}
          </>
        )}
      </Fragment>
    );
  }

  return (
    <div className="@container/ledger min-w-0">
      <Table
        density={density}
        scrollAreaLabel={`Importes del cuadre: ${title}`}
        aria-label={`Cuadre: ${title}`}
        className={cn(
          "@max-[360px]/ledger:[&_:is(th,td)]:px-1.5 @min-[360px]/ledger:@max-[34rem]/ledger:[&_:is(th,td)]:px-2.5",
          isOperational ? "@max-[34rem]/ledger:[&_tbody_td]:py-2" : "[&_tbody_td]:h-9 [&_tbody_td]:py-1",
        )}
      >
        {!exchanges && !returnsQuery.isLoading && (
          <caption className="text-muted-foreground px-3 py-1.5 text-left text-xs">
            Desglose de cambios no disponible.
            {returnsQuery.isError && (
              <button type="button" className="ms-2 underline" onClick={() => returnsQuery.refetch()}>
                Reintentar
              </button>
            )}
          </caption>
        )}
        <TableHeader className="bg-muted">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className={cn("whitespace-normal", isOperational ? "@min-[34rem]/ledger:w-64" : "w-full")}>
              {title}
            </TableHead>
            {isOperational && (
              <TableHead className={DETAIL_CELL_CLASS_NAME}>
                <span className="sr-only">Detalle</span>
              </TableHead>
            )}
            <TableHead className={cn("text-right", isOperational ? "w-24 @min-[34rem]/ledger:w-36" : undefined)}>
              USD
            </TableHead>
            <TableHead className={cn("text-right", isOperational ? "w-28 @min-[34rem]/ledger:w-44" : undefined)}>
              Bs.
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>{lines.map(renderLine)}</TableBody>

        <TableFooter className={cn("border-foreground/70 font-normal", !isOperational && "bg-primary/8")}>
          <TableRow className="hover:bg-transparent">
            <TableCell className={cn(totalCellClassName, "whitespace-normal")}>Total producido</TableCell>
            {isOperational && <TableCell className={DETAIL_CELL_CLASS_NAME} />}
            <TableCell className={totalAmountClassName}>{formatCurrencyUSD(figures.produced.usd)}</TableCell>
            <TableCell className={totalAmountClassName}>{formatCurrencyVES(figures.produced.ves)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

function LedgerDetailRow({
  children,
  amount,
  reference,
  showPlus = false,
  showDetailColumn,
}: {
  children: ReactNode;
  amount?: Money;
  reference?: boolean;
  showPlus?: boolean;
  showDetailColumn: boolean;
}) {
  return (
    <TableRow className="border-border/40 bg-muted/40 hover:bg-muted/40">
      <TableCell className={cn("text-xs whitespace-normal", reference && "text-muted-foreground")}>
        <span className="border-border block border-s ps-2">{children}</span>
      </TableCell>
      {showDetailColumn && <TableCell className={DETAIL_CELL_CLASS_NAME} />}
      <TableCell className={cn("data-value text-right text-xs", reference && "text-muted-foreground")}>
        {amount && formatAmount(amount.usd, formatCurrencyUSD, showPlus)}
      </TableCell>
      <TableCell className="data-value text-muted-foreground text-right text-xs">
        {amount && formatAmount(amount.ves, formatCurrencyVES, showPlus)}
      </TableCell>
    </TableRow>
  );
}
