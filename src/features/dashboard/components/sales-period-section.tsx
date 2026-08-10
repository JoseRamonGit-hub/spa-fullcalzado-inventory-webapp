import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarDays, RefreshCw, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  filterIconClassName,
  filterStateClassName,
  filterToggleItemClassName,
  filterTriggerClassName,
} from "@/components/ui/filter-control";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { DashboardSalesPeriodPreset, DashboardSalesPeriodRequest, DashboardTopProductsRankMode } from "@/types";
import {
  formatCalendarDateForBackend,
  formatCalendarDateString,
  formatCurrencyUSD,
  formatDateForBackend,
} from "@/utils/formatters";
import { useDashboardSalesPeriod, useDashboardTopProducts } from "../hooks/useDashboardMetrics";
import {
  analyzeCustomSalesRange,
  getBillingComparison,
  SALES_PERIOD_OPTIONS,
  type DashboardSalesPeriodSelection,
} from "../sales-period";
import { TopProductsTable } from "./top-products-table";

const PERIOD_DESCRIPTION: Record<DashboardSalesPeriodPreset, string> = {
  today: "Comparado con ayer",
  week: "Comparado con el mismo tramo de la semana anterior",
  month: "Comparado con los mismos días disponibles del mes anterior",
  custom: "Comparado con el bloque contiguo anterior de igual duración",
};

type SalesPeriodSectionProps = {
  selection: DashboardSalesPeriodSelection;
  onSelectionChange: (selection: DashboardSalesPeriodSelection) => void;
};

export function SalesPeriodSection({ selection, onSelectionChange }: SalesPeriodSectionProps) {
  const navigate = useNavigate({ from: "/dashboard" });
  const [topRankBy, setTopRankBy] = useState<DashboardTopProductsRankMode>("units");
  const today = formatDateForBackend(new Date());
  const customAnalysis =
    selection.preset === "custom"
      ? analyzeCustomSalesRange(selection.customStartDate, selection.customEndDate, today)
      : null;
  const request: DashboardSalesPeriodRequest | null =
    selection.preset === "custom"
      ? customAnalysis?.isValid && selection.customStartDate && selection.customEndDate
        ? { preset: "custom", startDate: selection.customStartDate, endDate: selection.customEndDate }
        : null
      : { preset: selection.preset };
  const salesQuery = useDashboardSalesPeriod(request);
  const topProductsQuery = useDashboardTopProducts(request, topRankBy);

  return (
    <section className="flex min-h-0 flex-col" aria-labelledby="sales-period-title">
      <header className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 id="sales-period-title" className="font-heading text-base font-semibold">
            Ventas por período
          </h2>
          <p className="text-muted-foreground text-xs">Facturación bruta del negocio activo</p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={selection.preset}
            onValueChange={(value) =>
              value && onSelectionChange({ ...selection, preset: value as DashboardSalesPeriodPreset })
            }
            aria-label="Período de facturación"
            className="grid w-full grid-cols-2 md:flex md:w-auto"
          >
            {SALES_PERIOD_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className={cn("h-9 min-w-0 md:h-8 md:flex-none", filterToggleItemClassName)}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {selection.preset === "custom" ? (
            <CustomRangePicker selection={selection} today={today} onSelectionChange={onSelectionChange} />
          ) : null}
        </div>
      </header>
      <Separator />

      <div className="py-4" aria-live="polite" aria-busy={salesQuery.isFetching || topProductsQuery.isFetching}>
        <div className="flex flex-col gap-3">
          {customAnalysis?.isValid && customAnalysis.warning ? (
            <Alert>
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>Rango extenso</AlertTitle>
              <AlertDescription>{customAnalysis.warning}</AlertDescription>
            </Alert>
          ) : null}
          {selection.preset === "custom" && !customAnalysis?.isValid ? (
            <Empty className="border py-6 md:py-6">
              <EmptyHeader>
                <EmptyTitle className="text-sm font-medium tracking-normal">
                  {customAnalysis?.error ?? "Selecciona un rango personalizado"}
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : salesQuery.isPending || topProductsQuery.isPending ? (
            <SalesPeriodSkeleton />
          ) : salesQuery.isError ? (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>No se pudo cargar la facturación</AlertTitle>
              <AlertDescription>
                <p>Verifica la conexión e inténtalo de nuevo.</p>
                <Button variant="outline" size="sm" onClick={() => salesQuery.refetch()}>
                  <RefreshCw data-icon="inline-start" />
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-4">
              <SalesPeriodContent data={salesQuery.data} />
              <Separator />
              <TopProductsSection
                rankBy={topRankBy}
                onRankByChange={setTopRankBy}
                query={topProductsQuery}
                onProductClick={(productId) => navigate({ to: "/inventory/$productId", params: { productId } })}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type TopProductsSectionProps = {
  rankBy: DashboardTopProductsRankMode;
  onRankByChange: (rankBy: DashboardTopProductsRankMode) => void;
  query: ReturnType<typeof useDashboardTopProducts>;
  onProductClick: (productId: string) => void;
};

function TopProductsSection({ rankBy, onRankByChange, query, onProductClick }: TopProductsSectionProps) {
  return (
    <section className="flex min-h-0 flex-col gap-3" aria-labelledby="top-products-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h3 id="top-products-title" className="font-heading text-sm font-semibold">
            Top productos
          </h3>
          <p className="text-muted-foreground text-xs">Ventas del período seleccionado</p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={rankBy}
          onValueChange={(value) => value && onRankByChange(value as DashboardTopProductsRankMode)}
          aria-label="Ordenar Top productos"
        >
          <ToggleGroupItem value="units" className={cn("h-9 md:h-8", filterToggleItemClassName)}>
            Unidades
          </ToggleGroupItem>
          <ToggleGroupItem value="gross_usd" className={cn("h-9 md:h-8", filterToggleItemClassName)}>
            USD bruto
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {query.isError ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>No se pudo cargar el ranking de productos</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              <RefreshCw data-icon="inline-start" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <TopProductsTable
          products={query.data ?? []}
          isLoading={query.isPending}
          onProductClick={(product) => onProductClick(product.productId)}
        />
      )}
    </section>
  );
}

function CustomRangePicker({ selection, today, onSelectionChange }: SalesPeriodSectionProps & { today: string }) {
  const isMobile = useIsMobile();
  const selectedRange = toCalendarRange(selection.customStartDate, selection.customEndDate);
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(selectedRange);
  const draftStartDate = formatCalendarDateForBackend(draftRange?.from);
  const draftEndDate = formatCalendarDateForBackend(draftRange?.to);
  const draftAnalysis = analyzeCustomSalesRange(draftStartDate || undefined, draftEndDate || undefined, today);
  const todayDate = toCalendarDate(today);

  const applyRange = () => {
    if (!draftAnalysis.isValid || !draftStartDate || !draftEndDate) return;

    onSelectionChange({ preset: "custom", customStartDate: draftStartDate, customEndDate: draftEndDate });
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setDraftRange(selectedRange);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 w-full justify-start md:h-8 md:w-auto",
            filterTriggerClassName,
            filterStateClassName(Boolean(selection.customStartDate && selection.customEndDate)),
          )}
        >
          <CalendarDays
            data-icon="inline-start"
            aria-hidden="true"
            className={filterIconClassName(Boolean(selection.customStartDate && selection.customEndDate))}
          />
          {formatCustomRangeLabel(selection.customStartDate, selection.customEndDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <PopoverTitle className="sr-only">Seleccionar rango personalizado de Ventas</PopoverTitle>
        <Calendar
          mode="range"
          selected={draftRange}
          onSelect={setDraftRange}
          defaultMonth={draftRange?.from ?? todayDate}
          numberOfMonths={isMobile ? 1 : 2}
          captionLayout="dropdown"
          startMonth={new Date(1900, 0, 1)}
          endMonth={todayDate}
          disabled={{ after: todayDate }}
          locale={es}
          autoFocus
        />
        <div className="flex items-center justify-between gap-3 border-t p-3">
          <p className={cn("text-muted-foreground text-xs", !draftAnalysis.isValid && "text-destructive")}>
            {draftAnalysis.isValid ? `${draftAnalysis.durationDays} días inclusivos` : draftAnalysis.error}
          </p>
          <Button size="sm" className="h-9 md:h-8" disabled={!draftAnalysis.isValid} onClick={applyRange}>
            Aplicar rango
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

type SalesPeriodContentProps = {
  data: NonNullable<ReturnType<typeof useDashboardSalesPeriod>["data"]>;
};

function SalesPeriodContent({ data }: SalesPeriodContentProps) {
  const comparison = getBillingComparison(data.totalUsd, data.previousTotalUsd);
  const isEmpty = data.totalUsd === 0;
  const hasNoActivityInEitherPeriod = isEmpty && data.previousTotalUsd === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <SalesMetric label="Facturado en el período" value={formatCurrencyUSD(data.totalUsd)}>
          <div className="flex flex-wrap items-center gap-2">
            {!hasNoActivityInEitherPeriod ? (
              <Badge
                variant={
                  comparison.direction === "positive"
                    ? "success"
                    : comparison.direction === "negative"
                      ? "destructive"
                      : "secondary"
                }
              >
                {comparison.label}
              </Badge>
            ) : null}
            <span className="text-muted-foreground text-xs">anterior: {formatCurrencyUSD(data.previousTotalUsd)}</span>
          </div>
        </SalesMetric>
        <SalesMetric label="Operaciones facturadas" value={String(data.operations)}>
          <p className="text-muted-foreground text-xs">{data.previousOperations} en el período anterior</p>
        </SalesMetric>
        <SalesMetric label="Ticket promedio" value={formatCurrencyUSD(data.averageTicketUsd)}>
          <p className="text-muted-foreground text-xs">Por operación facturada</p>
        </SalesMetric>
      </div>

      <Separator />

      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium">{PERIOD_DESCRIPTION[data.preset]}</p>
        <p className="text-muted-foreground text-xs">
          {formatPeriodRange(data.currentStart, data.currentEnd)} · período anterior{" "}
          {formatPeriodRange(data.comparisonStart, data.comparisonEnd)}
        </p>
      </div>

      {isEmpty ? (
        <Empty className="border py-6 md:py-6">
          <EmptyHeader>
            <EmptyTitle className="text-sm font-medium tracking-normal">Sin actividad en este período</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : data.preset !== "today" ? (
        <SalesIntervalChart data={data} />
      ) : null}
    </div>
  );
}

function SalesIntervalChart({ data }: SalesPeriodContentProps) {
  const maxTotalUsd = Math.max(
    0,
    ...data.buckets.filter((bucket) => bucket.isAvailable).map((bucket) => bucket.totalUsd),
  );
  const isCustom = data.preset === "custom";
  const seriesKey = `${data.preset}-${data.currentStart}-${data.currentEnd}`;

  return (
    <div
      role="region"
      aria-label="Facturación por intervalo"
      tabIndex={0}
      className="custom-scrollbar focus-visible:ring-ring w-full overflow-x-auto rounded-sm pb-1 focus-visible:ring-2 focus-visible:outline-none"
    >
      <ul
        key={seriesKey}
        data-series={seriesKey}
        className={cn(
          "grid min-w-full gap-1",
          data.preset === "week"
            ? "grid-cols-7"
            : data.preset === "month"
              ? data.buckets.length === 4
                ? "grid-cols-4"
                : "grid-cols-5"
              : undefined,
        )}
        style={
          isCustom
            ? {
                gridTemplateColumns: `repeat(${data.buckets.length}, minmax(72px, 1fr))`,
                minWidth: Math.max(480, data.buckets.length * 72),
              }
            : data.preset === "week"
              ? { minWidth: 420 }
              : undefined
        }
      >
        {data.buckets.map((bucket, bucketPosition) => {
          const valueLabel = bucket.isAvailable ? formatCurrencyUSD(bucket.totalUsd) : "No disponible";
          const barHeight =
            bucket.isAvailable && maxTotalUsd > 0 ? Math.max(4, (bucket.totalUsd / maxTotalUsd) * 100) : 0;
          const barDelayMs = Math.round((bucketPosition / Math.max(1, data.buckets.length - 1)) * 180);

          return (
            <li
              key={bucket.index}
              className="grid min-w-0 grid-rows-[8rem_auto_auto] gap-1 rounded-sm px-1 text-center"
              aria-label={`${bucket.label}: ${valueLabel}`}
            >
              <div className="border-border/60 flex min-h-0 items-end justify-center border-b px-1" aria-hidden="true">
                {bucket.isAvailable ? (
                  <div
                    data-slot="sales-interval-bar"
                    className={cn(
                      "dashboard-chart-bar bg-primary w-full max-w-13 rounded-t-sm",
                      bucket.totalUsd === 0 && "bg-muted-foreground/30",
                    )}
                    style={{ height: `${barHeight}%`, animationDelay: `${barDelayMs}ms` }}
                  />
                ) : (
                  <span className="text-muted-foreground pb-1 text-xs">—</span>
                )}
              </div>
              <span
                className="text-muted-foreground max-w-full truncate text-[10px] font-semibold tracking-wide uppercase"
                title={bucket.label}
              >
                {bucket.label}
              </span>
              <span
                className={cn(
                  "max-w-full truncate font-mono text-[10px] tabular-nums",
                  !bucket.isAvailable && "text-muted-foreground italic",
                )}
                title={valueLabel}
              >
                {valueLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function toCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toCalendarRange(startDate: string | undefined, endDate: string | undefined): DateRange | undefined {
  if (!startDate) return undefined;

  return { from: toCalendarDate(startDate), to: endDate ? toCalendarDate(endDate) : undefined };
}

function formatCustomRangeLabel(startDate: string | undefined, endDate: string | undefined) {
  if (!startDate || !endDate) return "Seleccionar fechas";

  return `${formatCalendarDateString(startDate)} – ${formatCalendarDateString(endDate)}`;
}

function formatPeriodRange(startDate: string, endDate: string) {
  const start = formatCalendarDateString(startDate);
  if (startDate === endDate) return start;

  return `${start}–${formatCalendarDateString(endDate)}`;
}

function SalesMetric({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 px-0 py-3 first:pt-0 last:pb-0 sm:px-4 sm:py-0 sm:first:pl-0 sm:last:pr-0">
      <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">{label}</p>
      <p className="font-heading text-xl leading-none font-bold tracking-tight tabular-nums">{value}</p>
      {children}
    </div>
  );
}

function SalesPeriodSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Cargando facturación por período">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-52 w-full" />
    </div>
  );
}
