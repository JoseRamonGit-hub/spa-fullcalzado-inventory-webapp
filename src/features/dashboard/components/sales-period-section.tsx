import { useState, type ReactNode } from "react";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { CalendarDays, CalendarRange, RefreshCw, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { DashboardSalesPeriodPreset, DashboardSalesPeriodRequest } from "@/types";
import {
  formatCalendarDateForBackend,
  formatCalendarDateString,
  formatCurrencyUSD,
  formatDateForBackend,
} from "@/utils/formatters";
import { useDashboardSalesPeriod } from "../hooks/useDashboardMetrics";
import {
  analyzeCustomSalesRange,
  getBillingComparison,
  SALES_PERIOD_OPTIONS,
  type DashboardSalesPeriodSelection,
} from "../sales-period";

const chartConfig = {
  totalUsd: {
    label: "Total facturado",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const PERIOD_DESCRIPTION: Record<DashboardSalesPeriodPreset, string> = {
  today: "Comparado con ayer",
  week: "Comparado con los mismos días de la semana anterior",
  month: "Comparado con los mismos días disponibles del mes anterior",
  custom: "Comparado con el bloque contiguo anterior de igual duración",
};

type SalesPeriodSectionProps = {
  selection: DashboardSalesPeriodSelection;
  onSelectionChange: (selection: DashboardSalesPeriodSelection) => void;
};

export function SalesPeriodSection({ selection, onSelectionChange }: SalesPeriodSectionProps) {
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

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <CalendarRange className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>Ventas por período</CardTitle>
            <CardDescription>Facturación bruta del Negocio activo</CardDescription>
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
              <ToggleGroupItem key={option.value} value={option.value} className="min-w-0 md:flex-none">
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {selection.preset === "custom" ? (
            <CustomRangePicker selection={selection} today={today} onSelectionChange={onSelectionChange} />
          ) : null}
        </div>
      </CardHeader>
      <Separator />

      <CardContent className="p-4" aria-live="polite" aria-busy={salesQuery.isFetching}>
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
                <EmptyTitle>{customAnalysis?.error ?? "Selecciona un rango personalizado"}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : salesQuery.isPending ? (
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
            <SalesPeriodContent data={salesQuery.data} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomRangePicker({ selection, today, onSelectionChange }: SalesPeriodSectionProps & { today: string }) {
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
        <Button variant="outline" size="sm" className="w-full justify-start md:w-auto">
          <CalendarDays data-icon="inline-start" aria-hidden="true" />
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
          disabled={{ after: todayDate }}
          locale={es}
          autoFocus
        />
        <div className="flex items-center justify-between gap-3 border-t p-3">
          <p className={cn("text-muted-foreground text-xs", !draftAnalysis.isValid && "text-destructive")}>
            {draftAnalysis.isValid ? `${draftAnalysis.durationDays} días inclusivos` : draftAnalysis.error}
          </p>
          <Button size="sm" disabled={!draftAnalysis.isValid} onClick={applyRange}>
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
  const chartData = data.buckets.map((bucket) => ({
    label: bucket.label,
    totalUsd: bucket.isAvailable ? bucket.totalUsd : null,
  }));
  const isEmpty = data.totalUsd === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <SalesMetric label="Total facturado" value={formatCurrencyUSD(data.totalUsd)}>
          <div className="flex flex-wrap items-center gap-2">
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
            <span className="text-muted-foreground text-[11px]">
              anterior: {formatCurrencyUSD(data.previousTotalUsd)}
            </span>
          </div>
        </SalesMetric>
        <SalesMetric label="Operaciones facturadas" value={String(data.operations)}>
          <p className="text-muted-foreground text-[11px]">{data.previousOperations} en el período anterior</p>
        </SalesMetric>
        <SalesMetric label="Ticket promedio" value={formatCurrencyUSD(data.averageTicketUsd)}>
          <p className="text-muted-foreground text-[11px]">Por Operación facturada</p>
        </SalesMetric>
      </div>

      <div className="flex flex-col gap-1 border-t pt-4">
        <p className="text-muted-foreground text-[11px] font-medium">{PERIOD_DESCRIPTION[data.preset]}</p>
        <p className="text-muted-foreground text-[10px]">
          {formatPeriodRange(data.currentStart, data.currentEnd)} · período anterior{" "}
          {formatPeriodRange(data.comparisonStart, data.comparisonEnd)}
        </p>
      </div>

      {isEmpty ? (
        <div className="flex flex-col gap-3">
          <Empty className="border py-6 md:py-6">
            <EmptyHeader>
              <EmptyTitle>Sin actividad en este período</EmptyTitle>
            </EmptyHeader>
          </Empty>
          {data.preset !== "today" && <SalesBucketValues data={data} showLabels />}
        </div>
      ) : data.preset !== "today" ? (
        <div className="flex flex-col gap-3">
          <div className="w-full overflow-x-auto">
            <ChartContainer
              config={chartConfig}
              className="h-52 w-full"
              style={data.preset === "custom" ? { minWidth: Math.max(480, data.buckets.length * 72) } : undefined}
              role="img"
              aria-label="Facturación por intervalo"
            >
              <BarChart accessibilityLayer data={chartData} margin={{ left: 4, right: 4, top: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideIndicator
                      formatter={(value) => (
                        <div className="flex min-w-36 items-center justify-between gap-3">
                          <span className="text-muted-foreground">Total facturado</span>
                          <span className="font-mono font-medium tabular-nums">{formatCurrencyUSD(Number(value))}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="totalUsd" fill="var(--color-totalUsd)" radius={[4, 4, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ChartContainer>
          </div>

          <SalesBucketValues data={data} />
        </div>
      ) : null}
    </div>
  );
}

function SalesBucketValues({ data, showLabels = false }: SalesPeriodContentProps & { showLabels?: boolean }) {
  return (
    <div
      className={cn(
        "grid gap-1 overflow-x-auto",
        data.preset === "week"
          ? "grid-cols-7"
          : data.preset === "month"
            ? data.buckets.length === 4
              ? "grid-cols-4"
              : "grid-cols-5"
            : undefined,
      )}
      style={
        data.preset === "custom"
          ? { gridTemplateColumns: `repeat(${data.buckets.length}, minmax(72px, 1fr))` }
          : undefined
      }
      aria-label="Valores de facturación por intervalo"
    >
      {data.buckets.map((bucket) => (
        <div
          key={bucket.index}
          className="focus-visible:ring-ring flex min-w-0 flex-col items-center gap-0.5 rounded-sm text-center focus-visible:ring-2 focus-visible:outline-none"
          tabIndex={0}
          aria-label={`${bucket.label}: ${bucket.isAvailable ? formatCurrencyUSD(bucket.totalUsd) : "No disponible"}`}
        >
          {showLabels || data.preset === "custom" ? (
            <span className="text-muted-foreground text-[9px] font-semibold tracking-wide uppercase">
              {bucket.label}
            </span>
          ) : null}
          <span
            className={cn(
              "max-w-full truncate font-mono text-[9px] tabular-nums",
              !bucket.isAvailable && "text-muted-foreground italic",
            )}
            title={bucket.isAvailable ? formatCurrencyUSD(bucket.totalUsd) : "No disponible"}
          >
            {bucket.isAvailable ? formatCurrencyUSD(bucket.totalUsd) : "No disponible"}
          </span>
        </div>
      ))}
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
