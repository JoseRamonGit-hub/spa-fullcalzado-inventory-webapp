import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Info, RefreshCw, TriangleAlert } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { DashboardServiceError } from "@/services/dashboardService";
import type { DashboardSalesPeriodPreset, DashboardSalesPeriodRequest, DashboardTopProductsRankMode } from "@/types";
import {
  formatCalendarDateForBackend,
  formatCalendarDateString,
  formatCurrencyUSD,
  formatDateForBackend,
  formatInteger,
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
  today: "Referencia: ayer",
  week: "Referencia: los mismos días de la semana anterior",
  month: "Referencia: los mismos días transcurridos del mes anterior",
  custom: "Referencia: el período inmediatamente anterior de igual duración",
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
          <h2 id="sales-period-title" className="font-heading text-base leading-tight font-semibold">
            Ventas por período
          </h2>
          <div className="text-muted-foreground flex max-w-[65ch] items-center gap-1 text-xs leading-[1.4]">
            <span>Ventas brutas del negocio activo</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Qué incluyen las ventas brutas">
                  <Info aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-64 leading-relaxed">
                Importe facturado antes de descontar devoluciones.
              </TooltipContent>
            </Tooltip>
          </div>
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

      <div className="py-4">
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
          ) : (
            <div className="flex flex-col gap-4">
              {salesQuery.isPending ? (
                <SalesPeriodSkeleton />
              ) : salesQuery.isError && !salesQuery.data ? (
                <DashboardQueryError
                  error={salesQuery.error}
                  subject="las ventas del período"
                  isRetrying={salesQuery.isFetching}
                  onRetry={() => salesQuery.refetch()}
                />
              ) : (
                <div className="flex flex-col gap-3" aria-busy={salesQuery.isFetching}>
                  {salesQuery.isError ? (
                    <DashboardQueryError
                      error={salesQuery.error}
                      subject="las ventas del período"
                      mode="refresh"
                      isRetrying={salesQuery.isFetching}
                      onRetry={() => salesQuery.refetch()}
                    />
                  ) : null}
                  <SalesPeriodContent
                    data={salesQuery.data}
                    isRefreshing={salesQuery.isFetching}
                    showBucketComparison={customAnalysis?.isValid ? customAnalysis.granularity !== "month" : true}
                  />
                </div>
              )}
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
    <section className="flex min-h-0 flex-col gap-3" aria-labelledby="top-products-title" aria-busy={query.isFetching}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h3 id="top-products-title" className="font-heading text-base leading-tight font-semibold">
            Productos más vendidos
          </h3>
          <p className="text-muted-foreground max-w-[65ch] text-xs leading-[1.4]">
            {rankBy === "units"
              ? "Ordenados de mayor a menor por unidades vendidas."
              : "Ordenados de mayor a menor por ventas brutas en USD."}
          </p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={rankBy}
          onValueChange={(value) => value && onRankByChange(value as DashboardTopProductsRankMode)}
          aria-label="Ordenar productos por"
        >
          <ToggleGroupItem value="units" className={cn("h-9 md:h-8", filterToggleItemClassName)}>
            Unidades
          </ToggleGroupItem>
          <ToggleGroupItem value="gross_usd" className={cn("h-9 md:h-8", filterToggleItemClassName)}>
            USD bruto
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {query.isFetching && !query.isPending && !query.isError ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs leading-[1.4]" role="status">
          <RefreshCw className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          Actualizando productos…
        </p>
      ) : null}
      {query.isError && !query.data ? (
        <DashboardQueryError
          error={query.error}
          subject="los productos más vendidos"
          isRetrying={query.isFetching}
          onRetry={() => query.refetch()}
        />
      ) : (
        <>
          {query.isError ? (
            <DashboardQueryError
              error={query.error}
              subject="los productos más vendidos"
              mode="refresh"
              isRetrying={query.isFetching}
              onRetry={() => query.refetch()}
            />
          ) : null}
          <TopProductsTable
            products={query.data ?? []}
            isLoading={query.isPending}
            rankBy={rankBy}
            onProductClick={(product) => onProductClick(product.productId)}
          />
        </>
      )}
    </section>
  );
}

type DashboardQueryErrorProps = {
  error: unknown;
  subject: string;
  mode?: "load" | "refresh";
  isRetrying: boolean;
  onRetry: () => void | Promise<unknown>;
};

function DashboardQueryError({ error, subject, mode = "load", isRetrying, onRetry }: DashboardQueryErrorProps) {
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  const kind = error instanceof DashboardServiceError ? error.kind : isOffline ? "network" : "unexpected";
  const title =
    mode === "refresh"
      ? `No se pudieron actualizar ${subject}`
      : kind === "network"
        ? `Sin conexión para cargar ${subject}`
        : kind === "access"
          ? `No tienes acceso a ${subject}`
          : kind === "invalid-response"
            ? `No pudimos validar ${subject}`
            : `No se pudieron cargar ${subject}`;
  const description =
    mode === "refresh"
      ? "Los datos anteriores siguen visibles. Reintenta para obtener la información más reciente."
      : kind === "network"
        ? "Revisa tu conexión. Podrás reintentar cuando vuelvas a estar en línea."
        : kind === "access"
          ? "Tu usuario no tiene permiso para consultar esta información."
          : kind === "invalid-response"
            ? "El servidor devolvió información incompleta. Reintenta para solicitarla de nuevo."
            : "Verifica la conexión e inténtalo de nuevo.";

  return (
    <Alert variant="destructive">
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{description}</p>
        <Button
          variant="outline"
          size="sm"
          disabled={isRetrying || isOffline}
          aria-busy={isRetrying}
          onClick={() => void onRetry()}
        >
          <RefreshCw
            data-icon="inline-start"
            className={cn(isRetrying && "animate-spin motion-reduce:animate-none")}
            aria-hidden="true"
          />
          {isRetrying ? "Reintentando…" : "Reintentar"}
        </Button>
      </AlertDescription>
    </Alert>
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
        <PopoverTitle className="sr-only">Seleccionar período de ventas</PopoverTitle>
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
            {draftAnalysis.isValid ? `${draftAnalysis.durationDays} días seleccionados` : draftAnalysis.error}
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
  isRefreshing?: boolean;
  showBucketComparison: boolean;
};

function SalesPeriodContent({ data, isRefreshing = false, showBucketComparison }: SalesPeriodContentProps) {
  const comparison = getBillingComparison(data.totalUsd, data.previousTotalUsd);
  const hasNoActivityInEitherPeriod = data.totalUsd === 0 && data.previousTotalUsd === 0;

  return (
    <div className="flex flex-col gap-4">
      {isRefreshing ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs leading-[1.4]" role="status">
          <RefreshCw className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          Actualizando ventas…
        </p>
      ) : null}
      <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <SalesMetric label="Facturado en el período" value={formatCurrencyUSD(data.totalUsd)}>
          <div className="flex flex-wrap items-center gap-2">
            {!hasNoActivityInEitherPeriod ? (
              <Badge
                className="max-w-full"
                title={data.previousTotalUsd === 0 ? "Sin base comparable" : comparison.label}
                variant={
                  data.previousTotalUsd === 0
                    ? "secondary"
                    : comparison.direction === "positive"
                      ? "success"
                      : comparison.direction === "negative"
                        ? "destructive"
                        : "secondary"
                }
              >
                {data.previousTotalUsd === 0 ? "Sin base comparable" : comparison.label}
              </Badge>
            ) : null}
            <span className="text-muted-foreground text-xs leading-[1.4]">
              {formatMetricComparison(data.totalUsd, data.previousTotalUsd, formatCurrencyUSD, formatSignedCurrency)}
            </span>
          </div>
        </SalesMetric>
        <SalesMetric label="Operaciones facturadas" value={formatInteger(data.operations)}>
          <p className="text-muted-foreground text-xs leading-[1.4]">
            {formatMetricComparison(data.operations, data.previousOperations, formatInteger, formatSignedInteger)}
          </p>
        </SalesMetric>
        <SalesMetric label="Ticket promedio" value={formatCurrencyUSD(data.averageTicketUsd)}>
          <p className="text-muted-foreground text-xs leading-[1.4]">
            Período anterior: {formatCurrencyUSD(data.previousAverageTicketUsd ?? 0)}
          </p>
        </SalesMetric>
      </div>

      <Separator />

      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground max-w-[65ch] text-xs leading-[1.4] font-semibold">
          {PERIOD_DESCRIPTION[data.preset]}
        </p>
        <p className="text-muted-foreground max-w-[75ch] text-xs leading-[1.4]">
          Período actual: {formatPeriodRange(data.currentStart, data.currentEnd)} · Período anterior:{" "}
          {formatPeriodRange(data.comparisonStart, data.comparisonEnd)}
        </p>
      </div>

      {hasNoActivityInEitherPeriod ? (
        <Empty className="border py-6 md:py-6">
          <EmptyHeader>
            <EmptyTitle className="text-sm font-medium tracking-normal">
              No hubo ventas en ninguno de los dos períodos
            </EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : data.preset !== "today" ? (
        <SalesIntervalChart data={data} showBucketComparison={showBucketComparison} />
      ) : null}
    </div>
  );
}

function SalesIntervalChart({ data, showBucketComparison }: SalesPeriodContentProps) {
  const maxTotalUsd = Math.max(
    0,
    ...data.buckets
      .filter((bucket) => bucket.isAvailable)
      .flatMap((bucket) =>
        showBucketComparison ? [bucket.totalUsd, bucket.comparisonTotalUsd ?? 0] : [bucket.totalUsd],
      ),
  );
  const isCustom = data.preset === "custom";
  const seriesKey = `${data.preset}-${data.currentStart}-${data.currentEnd}`;

  return (
    <div className="flex flex-col gap-3">
      {showBucketComparison ? (
        <div
          className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-[1.4] font-medium"
          aria-label="Leyenda"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-primary size-2.5 rounded-sm" aria-hidden="true" /> Período actual
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-muted-foreground/35 size-2.5 rounded-sm" aria-hidden="true" /> Período anterior
          </span>
        </div>
      ) : null}
      <div
        role="region"
        aria-label="Ventas brutas por intervalo"
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
            const currentLabel = bucket.isAvailable ? formatCurrencyUSD(bucket.totalUsd) : "Fecha futura";
            const currentLabelTitle = bucket.isAvailable ? currentLabel : "Aún no disponible: fecha futura";
            const previousTotalUsd = bucket.comparisonTotalUsd ?? 0;
            const currentBarHeight =
              bucket.isAvailable && bucket.totalUsd > 0 && maxTotalUsd > 0
                ? `${Math.max(4, (bucket.totalUsd / maxTotalUsd) * 100)}%`
                : "0";
            const previousBarHeight =
              bucket.isAvailable && previousTotalUsd > 0 && maxTotalUsd > 0
                ? `${Math.max(4, (previousTotalUsd / maxTotalUsd) * 100)}%`
                : "0";
            const barDelayMs = Math.round((bucketPosition / Math.max(1, data.buckets.length - 1)) * 180);
            const beginsFutureRange =
              !bucket.isAvailable && (bucketPosition === 0 || data.buckets[bucketPosition - 1]?.isAvailable);
            const bucketComparison = getBucketComparison(bucket.totalUsd, previousTotalUsd);
            const accessibleLabel = bucket.isAvailable
              ? showBucketComparison
                ? `${bucket.label}: actual ${formatCurrencyUSD(bucket.totalUsd)}, anterior ${formatCurrencyUSD(previousTotalUsd)}, ${bucketComparison.accessibleLabel}`
                : `${bucket.label}: ventas ${formatCurrencyUSD(bucket.totalUsd)} del ${formatPeriodRange(bucket.startDate, bucket.endDate)}`
              : `${bucket.label}: aún no disponible porque es una fecha futura`;

            return (
              <li
                key={bucket.index}
                data-availability={bucket.isAvailable ? "available" : "future"}
                className={cn(
                  "grid min-w-0 grid-rows-[8rem_auto_auto] gap-1 rounded-sm px-1 text-center",
                  beginsFutureRange && "border-border/60 border-l border-dashed",
                )}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      tabIndex={0}
                      aria-label={accessibleLabel}
                      className={cn(
                        "focus-visible:ring-ring h-full rounded-sm outline-none focus-visible:ring-2",
                        !bucket.isAvailable && "text-muted-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-full min-h-0 items-end justify-center gap-1 border-b px-1",
                          bucket.isAvailable ? "border-border/60" : "border-border/35",
                        )}
                        aria-hidden="true"
                      >
                        {bucket.isAvailable ? (
                          <>
                            {showBucketComparison ? (
                              previousTotalUsd > 0 ? (
                                <div
                                  data-slot="sales-interval-bar"
                                  data-series-kind="previous"
                                  className="dashboard-chart-bar bg-muted-foreground/35 w-[38%] max-w-6 rounded-t-sm"
                                  style={{ height: previousBarHeight, animationDelay: `${barDelayMs}ms` }}
                                />
                              ) : (
                                <span
                                  data-slot="sales-interval-zero-marker"
                                  data-series-kind="previous"
                                  className="border-muted-foreground/35 mb-px w-[38%] max-w-6 border-t"
                                />
                              )
                            ) : null}
                            {bucket.totalUsd > 0 ? (
                              <div
                                data-slot="sales-interval-bar"
                                data-series-kind="current"
                                className={cn(
                                  "dashboard-chart-bar bg-primary max-w-6 rounded-t-sm",
                                  showBucketComparison ? "w-[38%]" : "w-[52%]",
                                )}
                                style={{
                                  height: currentBarHeight,
                                  animationDelay: `${barDelayMs + (showBucketComparison ? 30 : 0)}ms`,
                                }}
                              />
                            ) : (
                              <span
                                data-slot="sales-interval-zero-marker"
                                data-series-kind="current"
                                className={cn(
                                  "border-primary/50 mb-px max-w-6 border-t",
                                  showBucketComparison ? "w-[38%]" : "w-[52%]",
                                )}
                              />
                            )}
                          </>
                        ) : (
                          <span className="border-muted-foreground/25 mb-1 w-10 border-t border-dashed" />
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  {bucket.isAvailable ? (
                    <TooltipContent side="top" className="grid min-w-64 gap-2 shadow-md">
                      <span className="font-heading font-semibold">{bucket.label}</span>
                      <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                        <span className="text-tooltip-primary inline-flex min-w-0 items-center gap-1.5 font-medium">
                          <span className="bg-tooltip-primary size-2 shrink-0 rounded-sm" aria-hidden="true" />
                          {showBucketComparison ? "Actual" : "Ventas"} ·{" "}
                          {formatPeriodRange(bucket.startDate, bucket.endDate)}
                        </span>
                        <span className="data-value font-semibold">{formatCurrencyUSD(bucket.totalUsd)}</span>
                      </span>
                      {showBucketComparison ? (
                        <>
                          <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                            <span className="text-background/70 inline-flex min-w-0 items-center gap-1.5 font-medium">
                              <span className="bg-background/45 size-2 shrink-0 rounded-sm" aria-hidden="true" />
                              Anterior · {formatPeriodRange(bucket.comparisonStartDate, bucket.comparisonEndDate)}
                            </span>
                            <span className="data-value font-semibold">{formatCurrencyUSD(previousTotalUsd)}</span>
                          </span>
                          <span className="border-background/20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t pt-2">
                            <span className="font-medium">Resultado</span>
                            <span className={cn("data-value font-semibold", bucketComparison.className)}>
                              {bucketComparison.label}
                            </span>
                          </span>
                        </>
                      ) : null}
                    </TooltipContent>
                  ) : null}
                </Tooltip>
                <span
                  className={cn(
                    "max-w-full truncate text-xs font-semibold tracking-wide uppercase",
                    bucket.isAvailable ? "text-muted-foreground" : "text-muted-foreground/65",
                  )}
                  title={bucket.label}
                >
                  {bucket.label}
                </span>
                <span
                  className={cn(
                    "max-w-full truncate text-xs font-semibold tabular-nums",
                    !bucket.isAvailable && "text-muted-foreground/65 italic",
                  )}
                  title={currentLabelTitle}
                >
                  {bucket.isAvailable && bucket.totalUsd === 0 ? "$0 en ventas" : currentLabel}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
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

function formatSignedCurrency(value: number) {
  if (value === 0) return "Sin variación";
  return `${value > 0 ? "+" : "−"}${formatCurrencyUSD(Math.abs(value))}`;
}

function formatSignedInteger(value: number) {
  if (value === 0) return "Sin variación";
  return `${value > 0 ? "+" : "−"}${formatInteger(Math.abs(value))}`;
}

function formatMetricComparison(
  currentValue: number,
  previousValue: number,
  formatValue: (value: number) => string,
  formatDifference: (value: number) => string,
) {
  const baseline = `Período anterior: ${formatValue(previousValue)}`;
  if (previousValue === 0 || currentValue === previousValue) return baseline;

  return `${formatDifference(currentValue - previousValue)} · ${baseline}`;
}

function getBucketComparison(currentValue: number, previousValue: number) {
  if (previousValue === 0 && currentValue > 0) {
    return {
      label: "Sin base comparable",
      accessibleLabel: "sin base comparable",
      className: "text-background/70",
    };
  }

  if (currentValue === previousValue) {
    return {
      label: "Sin variación",
      accessibleLabel: "sin variación",
      className: "text-background/70",
    };
  }

  const difference = currentValue - previousValue;
  const label = formatSignedCurrency(difference);
  return {
    label,
    accessibleLabel: `diferencia ${label}`,
    className: difference > 0 ? "text-tooltip-success" : "text-tooltip-destructive",
  };
}

function formatPeriodRange(startDate: string, endDate: string) {
  const start = formatCalendarDateString(startDate);
  if (startDate === endDate) return start;

  return `${start}–${formatCalendarDateString(endDate)}`;
}

function SalesMetric({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 px-0 py-3 first:pt-0 last:pb-0 sm:px-4 sm:py-0 sm:first:pl-0 sm:last:pr-0">
      <p className="operational-label text-muted-foreground">{label}</p>
      <p
        className="font-heading min-w-0 text-2xl leading-none font-bold tracking-tight [overflow-wrap:anywhere] tabular-nums"
        title={value}
      >
        {value}
      </p>
      {children}
    </div>
  );
}

function SalesPeriodSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Cargando ventas por período">
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
