import { useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { CalendarRange, RefreshCw, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { DashboardSalesPeriodPreset } from "@/types";
import { formatCalendarDateString, formatCurrencyUSD } from "@/utils/formatters";
import { useDashboardSalesPeriod } from "../hooks/useDashboardMetrics";
import { DEFAULT_SALES_PERIOD, getBillingComparison, SALES_PERIOD_OPTIONS } from "../sales-period";

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
};

export function SalesPeriodSection() {
  const [preset, setPreset] = useState<DashboardSalesPeriodPreset>(DEFAULT_SALES_PERIOD);
  const salesQuery = useDashboardSalesPeriod(preset);

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

        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={preset}
          onValueChange={(value) => value && setPreset(value as DashboardSalesPeriodPreset)}
          aria-label="Período de facturación"
          className="w-full md:w-auto"
        >
          {SALES_PERIOD_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value} className="flex-1 md:flex-none">
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <Separator />

      <CardContent className="p-4" aria-live="polite" aria-busy={salesQuery.isFetching}>
        {salesQuery.isPending ? (
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
      </CardContent>
    </Card>
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
          <ChartContainer
            config={chartConfig}
            className="h-52 w-full"
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
        "grid gap-1",
        data.preset === "week" ? "grid-cols-7" : data.buckets.length === 4 ? "grid-cols-4" : "grid-cols-5",
      )}
    >
      {data.buckets.map((bucket) => (
        <div key={bucket.index} className="flex min-w-0 flex-col items-center gap-0.5 text-center">
          {showLabels && (
            <span className="text-muted-foreground text-[9px] font-semibold tracking-wide uppercase">
              {bucket.label}
            </span>
          )}
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
