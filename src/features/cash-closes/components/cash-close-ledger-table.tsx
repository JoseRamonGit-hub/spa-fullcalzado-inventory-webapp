import { Fragment, useState, type MouseEvent, type ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CasheaLogoIcon } from "@/features/cashea/components/cashea-logo-icon";
import { useCasheaOrdersForCashClose } from "@/features/cashea/hooks/useCasheaQueries";
import { returnTypeLabels } from "@/features/returns/return-display";
import { cn } from "@/lib/utils";
import type { Return } from "@/types";
import { formatCurrencyUSD, formatCurrencyVES, formatInteger } from "@/utils/formatters";
import {
  formatLedgerAmount,
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
import { useLedgerReturns } from "../hooks/useCashCloseQueries";

const MISSING_VALUE = "—";
const DETAIL_CELL_CLASS_NAME = "hidden @min-[34rem]/ledger:table-cell";
const COUNT_LINK_CLASS_NAME =
  "hover:text-primary focus-visible:outline-ring decoration-muted-foreground/40 rounded-sm underline underline-offset-2 hover:decoration-current focus-visible:decoration-current";

function countLabel(count: number, singular: string, plural: string) {
  return `${formatInteger(count)} ${count === 1 ? singular : plural}`;
}

function getSalesDetail(
  line: LedgerLine,
  figures: CashCloseFigures,
  showUnits: boolean,
  exchanges?: ExchangeBreakdown,
  cashea?: CasheaBreakdown,
) {
  if (line.id !== "sales" && line.id !== "sales-and-exchanges") return undefined;

  const excludedExchanges = line.id === "sales" ? exchanges : undefined;
  const operations = figures.billedOperations - (cashea?.count ?? 0) - (excludedExchanges?.count ?? 0);
  if (operations <= 0) return undefined;

  const count =
    line.id === "sales"
      ? countLabel(operations, "venta", "ventas")
      : countLabel(operations, "operación", "operaciones");
  if (!showUnits) return count;

  const units = figures.units - (cashea?.units ?? 0) - (excludedExchanges?.units ?? 0);
  return `${count} · ${countLabel(units, "unidad", "unidades")}`;
}

type LedgerMovement = { kind: "cashea"; count: number } | { kind: "returns"; count: number; type?: Return["type"] };

function getLedgerMovement(
  id: LedgerLineId,
  casheaCount: number,
  returnsCount: number,
  exchanges?: ExchangeBreakdown,
): LedgerMovement | undefined {
  switch (id) {
    case "cashea":
      return { kind: "cashea", count: casheaCount };
    case "exchanges":
      return { kind: "returns", count: exchanges?.count ?? 0, type: "exchange" };
    case "returns":
      return { kind: "returns", count: returnsCount - (exchanges?.count ?? 0), type: exchanges && "refund" };
  }
}

function LedgerCountLink({
  movement,
  date,
  closedAt,
  children,
}: {
  movement: LedgerMovement;
  date: string;
  closedAt?: string;
  children?: ReactNode;
}) {
  const preventRowToggle = (event: MouseEvent<HTMLAnchorElement>) => event.stopPropagation();
  const { count } = movement;

  if (movement.kind === "cashea") {
    return (
      <Link
        to="/receivables/cashea"
        search={{ status: "all", from: date, to: date, cashClose: closedAt ?? "day" }}
        className={COUNT_LINK_CLASS_NAME}
        onClick={preventRowToggle}
      >
        {children ?? countLabel(count, "orden", "órdenes")}
      </Link>
    );
  }

  const { type } = movement;
  const label = type ? returnTypeLabels[type] : { singular: "Operación", plural: "Operaciones" };
  return (
    <Link to="/returns" search={{ date, type, closedAt }} className={COUNT_LINK_CLASS_NAME} onClick={preventRowToggle}>
      {children ?? countLabel(count, label.singular.toLowerCase(), label.plural.toLowerCase())}
    </Link>
  );
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
  const [dayLabel, dayDate] = title.split(" · ");
  const hasCashea = !isLedgerAmountZero(figures.casheaReceivable) || !isLedgerAmountZero(figures.casheaVoidedReturn);
  const casheaQuery = useCasheaOrdersForCashClose(hasCashea ? date : undefined, closedAt);
  const exchanges = getExchangeBreakdown(figures, returnsQuery.data);
  const cashea = getCasheaBreakdown(
    figures.casheaReceivable,
    casheaQuery.data?.filter((order) => order.sale_date === date),
  );
  const lines = getLedgerLines(figures, exchanges, cashea);
  const [expandedLines, setExpandedLines] = useState<Partial<Record<LedgerLineId, boolean>>>({});
  const isOperational = density === "operational";
  const salesDestination = { to: "/transactions", search: { date } } as const;
  const totalCellClassName = cn("font-bold", isOperational && "h-10");
  const totalAmountClassName = cn(
    "data-value text-right",
    isOperational ? "text-base max-md:text-[0.9375rem]" : "text-sm @max-[24rem]/ledger:text-xs",
    totalCellClassName,
  );

  function renderLine(line: LedgerLine) {
    const canExpand = Boolean(line.details?.length);
    const expanded = expandedLines[line.id] ?? false;
    const detail = hasExactOperationCount ? getSalesDetail(line, figures, isOperational, exchanges, cashea) : undefined;
    const movement = getLedgerMovement(line.id, casheaQuery.data?.length ?? 0, figures.returnsCount, exchanges);
    const movementDetail = movement && movement.count > 0 && (
      <LedgerCountLink movement={movement} date={date} closedAt={closedAt} />
    );
    const linkMovementLabel = isOperational && Boolean(movementDetail);
    const isZero = isLedgerAmountZero(line.amount) && !canExpand && !movementDetail;
    const salesLink = line.id === "sales" && detail && (
      <Link
        {...salesDestination}
        aria-label={isOperational ? undefined : `${line.label} · ${detail}`}
        className={COUNT_LINK_CLASS_NAME}
      >
        {detail}
      </Link>
    );
    const isCashea = line.id === "cashea";
    const showInlineSalesCount = isOperational && Boolean(salesLink);
    const showPlus = isCashea || line.id === "exchanges";
    const label = (
      <>
        {isCashea && <CasheaLogoIcon className="size-3.5 shrink-0 rounded-[3px]" />}
        <span className="underline-offset-2 group-hover/ledger-toggle:underline group-focus-visible/ledger-toggle:underline">
          {line.label}
        </span>
      </>
    );

    return (
      <Fragment key={line.id}>
        <TableRow
          className={cn(
            "border-border/40",
            canExpand ? "cursor-pointer" : "hover:bg-transparent",
            expanded && canExpand && "bg-muted/75 hover:bg-muted border-transparent",
          )}
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
            <span
              className={cn("inline-flex flex-wrap items-center gap-x-1.5", linkMovementLabel && "max-md:flex-nowrap")}
            >
              {linkMovementLabel && movement && (
                <span className="md:hidden">
                  <LedgerCountLink movement={movement} date={date} closedAt={closedAt}>
                    <span className="inline-flex items-center gap-1.5">{label}</span>
                  </LedgerCountLink>
                </span>
              )}
              {canExpand ? (
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-label={linkMovementLabel ? `${line.label}: ${expanded ? "ocultar" : "ver"} desglose` : undefined}
                  className={cn(
                    "group/ledger-toggle focus-visible:outline-ring inline-flex min-h-7 flex-wrap items-center gap-x-1.5 rounded-sm text-left",
                    isOperational && "@max-[34rem]/ledger:-my-1 @max-[34rem]/ledger:min-h-9",
                    linkMovementLabel && "max-md:-my-1 max-md:min-h-9 max-md:min-w-8 max-md:justify-center",
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn("inline-flex items-center gap-1.5", linkMovementLabel && "max-md:hidden")}>
                      {label}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn("text-muted-foreground size-3.5 shrink-0", expanded && "rotate-180")}
                    />
                  </span>
                </button>
              ) : showInlineSalesCount ? (
                <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="hidden @min-[26rem]/ledger:inline">{label}</span>
                  <Link
                    {...salesDestination}
                    aria-label={`${line.label} · ${detail}`}
                    title={detail}
                    className={cn(
                      COUNT_LINK_CLASS_NAME,
                      "@min-[26rem]/ledger:text-muted-foreground @min-[26rem]/ledger:text-xs @min-[26rem]/ledger:font-normal @min-[34rem]/ledger:hidden",
                    )}
                  >
                    <span className="@min-[26rem]/ledger:hidden">{line.label}</span>
                    <span className="hidden @min-[26rem]/ledger:inline">{detail}</span>
                  </Link>
                </span>
              ) : !salesLink && (line.id === "sales" || line.id === "sales-and-exchanges") ? (
                <Link {...salesDestination} className={COUNT_LINK_CLASS_NAME}>
                  {line.label}
                </Link>
              ) : (
                <span className={cn("inline-flex items-center gap-1.5", linkMovementLabel && "max-md:hidden")}>
                  {label}
                </span>
              )}
              {line.id === "sales" && cashea && (
                <LedgerHelp label="Qué incluye Ventas">
                  Las ventas con Cashea, los cambios y las devoluciones se muestran por separado.
                </LedgerHelp>
              )}
            </span>
            {isOperational && movementDetail && (
              <span className="text-muted-foreground mt-0.5 hidden text-xs font-normal md:block @min-[34rem]/ledger:md:hidden">
                {movementDetail}
              </span>
            )}
          </TableCell>
          <TableCell
            className={cn(
              "text-muted-foreground text-xs",
              isOperational ? DETAIL_CELL_CLASS_NAME : "whitespace-normal",
            )}
          >
            {salesLink ||
              (movementDetail && isOperational ? (
                <span className="hidden md:inline">{movementDetail}</span>
              ) : (
                movementDetail
              )) ||
              (isZero ? null : detail)}
          </TableCell>
          <TableCell
            className={cn("data-value text-right", isZero ? "text-muted-foreground font-normal" : "font-medium")}
          >
            {isZero ? MISSING_VALUE : formatLedgerAmount(line.amount.usd, formatCurrencyUSD, showPlus)}
          </TableCell>
          <TableCell className="data-value text-muted-foreground text-right text-xs font-normal">
            {isZero ? MISSING_VALUE : formatLedgerAmount(line.amount.ves, formatCurrencyVES, showPlus)}
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
            {line.details?.map(({ label, amount, reference, help }, index, details) => (
              <LedgerDetailRow
                key={label}
                amount={amount}
                reference={reference}
                showPlus={isCashea && !reference}
                showDetailColumn={isOperational}
                isLast={index === details.length - 1}
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
          "bg-card",
          isOperational
            ? "@max-[360px]/ledger:[&_:is(th,td)]:px-1.5 @min-[360px]/ledger:@max-[34rem]/ledger:[&_:is(th,td)]:px-2.5 @max-[34rem]/ledger:[&_tbody_td]:py-2"
            : "[&_:is(th,td)]:px-1 [&_:is(th,td)]:py-0 @min-[360px]/ledger:[&_:is(th,td)]:px-1.5 @min-[448px]/ledger:[&_:is(th,td)]:px-3 [&_:is(thead,tbody)_tr]:h-8 [&_tfoot_tr]:h-9 [&_tr>:first-child]:ps-2 @min-[360px]/ledger:[&_tr>:first-child]:ps-3 @min-[448px]/ledger:[&_tr>:first-child]:ps-6 [&_tr>:last-child]:pe-2 @min-[360px]/ledger:[&_tr>:last-child]:pe-3 @min-[448px]/ledger:[&_tr>:last-child]:pe-6",
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
        {/* Keep the separator inside the header height so it lines up with the adjacent status panel. */}
        <TableHeader
          className={cn(
            "bg-muted",
            isOperational && "bg-[linear-gradient(to_top,var(--border)_1px,transparent_1px)] [&_tr]:border-b-0",
          )}
        >
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className={cn("whitespace-normal", isOperational && "h-10 @min-[34rem]/ledger:w-44")}>
              {isOperational ? (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1 leading-tight tracking-normal">
                  <strong className="text-foreground text-sm font-semibold normal-case">{dayLabel}</strong>
                  {dayDate && <small className="text-xs font-normal normal-case">{dayDate}</small>}
                </div>
              ) : (
                title
              )}
            </TableHead>
            <TableHead className={isOperational ? DETAIL_CELL_CLASS_NAME : "w-full"}>
              <span className="sr-only">Detalle</span>
            </TableHead>
            <TableHead
              className={cn("text-right", isOperational && "@min-[360px]/ledger:w-24 @min-[34rem]/ledger:w-36")}
            >
              USD
            </TableHead>
            <TableHead
              className={cn("text-right", isOperational && "@min-[360px]/ledger:w-28 @min-[34rem]/ledger:w-44")}
            >
              Bs.
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>{lines.map(renderLine)}</TableBody>

        <TableFooter className="border-foreground/40 bg-card font-normal">
          <TableRow className="hover:bg-transparent">
            <TableCell
              className={cn(
                totalCellClassName,
                "whitespace-normal",
                isOperational && "@max-[34rem]/ledger:py-1.5 @max-[34rem]/ledger:leading-snug",
              )}
              colSpan={isOperational ? 1 : 2}
            >
              Total producido
              {isOperational && (
                <>
                  {" "}
                  <span className="@max-[34rem]/ledger:block">del día</span>
                </>
              )}
            </TableCell>
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
  isLast = false,
}: {
  children: ReactNode;
  amount?: Money;
  reference?: boolean;
  showPlus?: boolean;
  showDetailColumn: boolean;
  isLast?: boolean;
}) {
  return (
    <TableRow className={cn("bg-muted/50 hover:bg-muted/50", isLast ? "border-border/40" : "border-b-0")}>
      <TableCell
        className={cn("text-xs whitespace-normal", reference && "text-muted-foreground")}
        colSpan={showDetailColumn ? 1 : 2}
      >
        <span className="relative block ps-4">
          <svg
            aria-hidden="true"
            className="fill-muted-foreground/50 absolute inset-s-0 top-[7px] h-px w-2"
            viewBox="0 0 8 1"
            shapeRendering="crispEdges"
          >
            <rect width="8" height="1" />
          </svg>
          {children}
        </span>
      </TableCell>
      {showDetailColumn && <TableCell className={DETAIL_CELL_CLASS_NAME} />}
      <TableCell className={cn("data-value text-right text-xs", reference && "text-muted-foreground")}>
        {amount && formatLedgerAmount(amount.usd, formatCurrencyUSD, showPlus)}
      </TableCell>
      <TableCell className="data-value text-muted-foreground text-right text-xs">
        {amount && formatLedgerAmount(amount.ves, formatCurrencyVES, showPlus)}
      </TableCell>
    </TableRow>
  );
}
