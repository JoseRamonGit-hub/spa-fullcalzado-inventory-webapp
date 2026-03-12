import { useMemo } from "react";
import { useCashCloses } from "./hooks";
import { useTransactions, useTodayTransactions } from "@/features/transactions/hooks";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { Lock, Hash, DollarSign, Banknote, ShoppingCart, CalendarDays } from "lucide-react";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { cn } from "@/lib/utils";
import { cashClosesService } from "@/services/cashClosesService";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import { formatCurrencyUSD, formatCurrencyVES, formatDate } from "@/utils/formatters";
import { useState } from "react";
import type { CashClose } from "@/types";
import { useNavigate } from "@tanstack/react-router";

export function CashClosesPage() {
  const [date, setDate] = useState<string | undefined>(undefined);

  const { data: cashCloses, isLoading, isError } = useCashCloses(date);
  // When a date filter is active, load transactions for that specific day to show in the summary
  const { data: filteredTxs } = useTransactions(date);
  // Always keep today's live metrics for the "no filter" state
  const { data: todayTxs } = useTodayTransactions();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate({ from: "/cash-closes" });

  const isFiltered = !!date;

  // Use filtered transactions for the summary when a date filter is active
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

  const handleClose = () => {
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
        {/* Summary panel */}
        <div className="space-y-3 border-b px-3 py-3 md:px-4">
          {/* Label with optional filter badge */}
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

          {/* Only show the generate-close button when no date filter is active (today's view) */}
          {!isFiltered && (
            <Button
              onClick={handleClose}
              disabled={closeMutation.isPending || !user}
              className="h-8 w-full gap-2 text-xs font-semibold"
            >
              <Lock className="h-3.5 w-3.5" />
              {closeMutation.isPending ? "PROCESANDO..." : "CIERRE DE DÍA"}
            </Button>
          )}
        </div>

        {/* Closes table — rows are clickable to navigate to /transactions?date=... */}
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
    </section>
  );
}
