import { useMemo, useState } from "react";
import { useCashCloses } from "./hooks";
import { useTransactions, useTodayTransactions } from "@/features/transactions/hooks";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { Lock, Hash, DollarSign, Banknote, ShoppingCart, CalendarDays, AlertTriangle } from "lucide-react";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { cn } from "@/lib/utils";
import { cashClosesService } from "@/services/cashClosesService";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import { formatCurrencyUSD, formatCurrencyVES, formatDate } from "@/utils/formatters";
import type { CashClose } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { ResponsiveAlertModal } from "@/components/ResponsiveAlertModal";

export function CashClosesPage() {
  const [date, setDate] = useState<string | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: cashCloses, isLoading, isError } = useCashCloses(date);
  const { data: filteredTxs } = useTransactions(date);
  const { data: todayTxs } = useTodayTransactions();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate({ from: "/cash-closes" });

  const isFiltered = !!date;
  const sourceTxs = isFiltered ? filteredTxs : todayTxs;

  const todayMetrics = useMemo(() => {
    if (!sourceTxs || sourceTxs.length === 0) {
      return { count: 0, units: 0, totalUsd: 0, totalVes: 0 };
    }
    return sourceTxs.reduce(
      (acc, tx) => ({
        count: acc.count + 1,
        units: acc.units + tx.quantity,
        totalUsd: acc.totalUsd + tx.price_usd * tx.quantity,
        totalVes: acc.totalVes + tx.price_ves * tx.quantity,
      }),
      { count: 0, units: 0, totalUsd: 0, totalVes: 0 },
    );
  }, [sourceTxs]);

  const closeMutation = useMutation({
    mutationFn: (userId: string) => cashClosesService.generateDailyCashClose(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-closes"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "today"] });
    },
  });

  const handleConfirmClose = () => {
    if (!user) return;
    const promise = closeMutation.mutateAsync(user.id);
    toast.promise(promise, {
      loading: "Generando cierre de caja...",
      success: "Cierre realizado correctamente",
      error: "Error al realizar el cierre",
    });
  };

  const handleRowClick = (row: CashClose) => {
    navigate({ to: "/transactions", search: { date: row.date } });
  };

  const today = formatDate(new Date());
  const summaryLabel = isFiltered
    ? `Resumen del ${formatDate(date + "T12:00:00")}`
    : `Resumen del Día — ${today}`;

  const topbar = <Topbar date={date} onDateChange={setDate} />;

  if (isLoading) {
    return (
      <section className="flex flex-1 flex-col overflow-hidden">
        {topbar}
        <div className="custom-scrollbar flex flex-1 flex-col overflow-auto">
          <MetricsSkeleton count={4} />
          <div className="flex flex-1 flex-col">
            <div className="px-3 pt-3 pb-2 md:px-4">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Cierres Anteriores
              </h3>
            </div>
            <DataTable columns={columns} data={[]} isLoading emptyMessage="" />
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-1 flex-col">
        {topbar}
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar los cierres de caja.</p>
        </div>
      </section>
    );
  }

  const summaryItems = [
    { label: "Transacciones", value: String(todayMetrics.count), icon: Hash },
    { label: "Unidades Vendidas", value: String(todayMetrics.units), icon: ShoppingCart },
    { label: "Total USD", value: formatCurrencyUSD(todayMetrics.totalUsd), icon: DollarSign },
    { label: "Total Bs", value: formatCurrencyVES(todayMetrics.totalVes), icon: Banknote },
  ];

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      {topbar}

      <div className="custom-scrollbar flex flex-1 flex-col overflow-auto">
        <div className="space-y-3 border-b px-3 py-3 md:px-4">
          <div className="flex items-center gap-1.5">
            {isFiltered && (
              <span className="bg-primary/10 text-primary flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                <CalendarDays className="h-3 w-3" />
                Filtrado
              </span>
            )}
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              {summaryLabel}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-y-4 md:grid-cols-4">
            {summaryItems.map((item, i) => (
              <div
                key={item.label}
                className={cn(
                  "border-border/50 flex min-w-0 flex-col gap-1.5 px-2 sm:px-4",
                  i % 2 !== 0 ? "border-l" : "",
                  "md:border-l",
                  i === 0 ? "pl-0 md:border-l-0" : "",
                  i === 2 ? "border-l-0 pl-0 md:border-l md:pl-4" : "",
                  i === summaryItems.length - 1 ? "pr-0" : "",
                )}
              >
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <item.icon className="text-primary h-3.5 w-3.5 shrink-0" />
                  <p className="truncate text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">
                    {item.label}
                  </p>
                </div>
                <p className="truncate text-sm leading-none font-bold tabular-nums sm:text-lg" title={item.value}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {!isFiltered && (
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={closeMutation.isPending || !user}
              className="h-8 w-full gap-2 text-xs font-semibold"
            >
              <Lock className="h-3.5 w-3.5" />
              {closeMutation.isPending ? "PROCESANDO..." : "CIERRE DE DÍA"}
            </Button>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="px-3 pt-3 pb-2 md:px-4">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              {isFiltered ? "Cierre encontrado" : "Cierres Anteriores"}
            </h3>
          </div>
          <DataTable
            columns={columns}
            data={cashCloses || []}
            emptyMessage="No hay cierres de caja registrados."
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Confirmation modal */}
      <ResponsiveAlertModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar Cierre de Caja"
        description="Estás a punto de cerrar el día de hoy. Esta acción consolidará todas las ventas registradas."
        confirmLabel="Sí, cerrar el día"
        cancelLabel="Cancelar"
        isPending={closeMutation.isPending}
        onConfirm={handleConfirmClose}
      >
        {/* Rich summary preview inside the modal */}
        <div className="space-y-3">
          {/* Icon + date header */}
          <div className="bg-primary/8 border-primary/20 flex items-center gap-3 rounded-lg border px-4 py-3">
            <div className="bg-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Lock className="text-primary h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-foreground text-sm font-semibold">Cierre del {today}</p>
              <p className="text-muted-foreground text-xs">
                {todayMetrics.count} transacción{todayMetrics.count !== 1 ? "es" : ""} registrada{todayMetrics.count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Metrics summary */}
          <div className="bg-muted/40 grid grid-cols-2 gap-px overflow-hidden rounded-lg border">
            <div className="bg-card flex flex-col gap-0.5 px-3 py-2.5">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
                <DollarSign className="h-3 w-3" /> Total USD
              </span>
              <span className="text-foreground text-sm font-bold tabular-nums">
                {formatCurrencyUSD(todayMetrics.totalUsd)}
              </span>
            </div>
            <div className="bg-card flex flex-col gap-0.5 px-3 py-2.5">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
                <Banknote className="h-3 w-3" /> Total Bs.
              </span>
              <span className="text-foreground text-sm font-bold tabular-nums">
                {formatCurrencyVES(todayMetrics.totalVes)}
              </span>
            </div>
            <div className="bg-card flex flex-col gap-0.5 px-3 py-2.5">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
                <Hash className="h-3 w-3" /> Ventas
              </span>
              <span className="text-foreground text-sm font-bold tabular-nums">{todayMetrics.count}</span>
            </div>
            <div className="bg-card flex flex-col gap-0.5 px-3 py-2.5">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
                <ShoppingCart className="h-3 w-3" /> Unidades
              </span>
              <span className="text-foreground text-sm font-bold tabular-nums">{todayMetrics.units}</span>
            </div>
          </div>

          {/* Warning note */}
          <div className="bg-amber-500/8 border-amber-500/25 flex items-start gap-2.5 rounded-lg border px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Una vez confirmado, no se puede deshacer. Asegúrate de que todas las ventas del día están registradas.
            </p>
          </div>
        </div>
      </ResponsiveAlertModal>
    </section>
  );
}
