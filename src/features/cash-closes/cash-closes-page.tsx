import { useMemo } from "react";
import { useCashCloses } from "./hooks";
import { useTodayTransactions } from "@/features/transactions/hooks";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Button } from "@/components/ui/button";
import { Lock, Hash, DollarSign, Banknote, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cashClosesService } from "@/services/cashClosesService";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";

export function CashClosesPage() {
  const { data: cashCloses, isLoading, isError } = useCashCloses();
  const { data: todayTxs } = useTodayTransactions();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Live metrics from today's transactions
  const todayMetrics = useMemo(() => {
    if (!todayTxs || todayTxs.length === 0) {
      return { count: 0, units: 0, totalUsd: 0, totalVes: 0 };
    }
    return todayTxs.reduce(
      (acc, tx) => ({
        count: acc.count + 1,
        units: acc.units + tx.quantity,
        totalUsd: acc.totalUsd + tx.price_usd * tx.quantity,
        totalVes: acc.totalVes + tx.price_ves * tx.quantity,
      }),
      { count: 0, units: 0, totalUsd: 0, totalVes: 0 },
    );
  }, [todayTxs]);

  const fmtCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const fmtVes = (value: number) =>
    new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

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

  const today = new Date().toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });

  if (isLoading) {
    return (
      <section className="flex flex-col flex-1">
        <Topbar />
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col flex-1">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive">Error al cargar los cierres de caja.</p>
        </div>
      </section>
    );
  }

  const summaryItems = [
    { label: "Transacciones", value: String(todayMetrics.count), icon: Hash },
    { label: "Uds. Vendidas", value: String(todayMetrics.units), icon: ShoppingCart },
    { label: "Total USD", value: `$${fmtCurrency(todayMetrics.totalUsd)}`, icon: DollarSign },
    { label: "Total VES", value: `Bs ${fmtVes(todayMetrics.totalVes)}`, icon: Banknote },
  ];

  return (
    <section className="flex flex-col flex-1 overflow-hidden">
      <Topbar />

      <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
        {/* Today's summary — flat design */}
        <div className="px-3 md:px-4 py-3 border-b space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resumen del Día — {today}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold tabular-nums leading-tight">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleClose}
            disabled={closeMutation.isPending || !user}
            className="w-full h-8 gap-2 text-xs font-semibold"
          >
            <Lock className="h-3.5 w-3.5" />
            {closeMutation.isPending ? "PROCESANDO..." : "CIERRE DE DÍA"}
          </Button>
        </div>

        {/* Previous closes */}
        <div className="flex flex-col flex-1">
          <div className="px-3 md:px-4 pt-3 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cierres Anteriores</h3>
          </div>
          <DataTable columns={columns} data={cashCloses || []} emptyMessage="No hay cierres de caja registrados." />
        </div>
      </div>
    </section>
  );
}
