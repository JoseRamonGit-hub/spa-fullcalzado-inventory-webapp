import { useCashCloses } from "./hooks";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, Hash, DollarSign, Banknote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function CashClosesPage() {
  const { data: cashCloses, isLoading, isError } = useCashCloses();

  if (isLoading) {
    return (
      <section className="flex flex-col flex-1">
        <Topbar />
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
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

  const today = new Date().toISOString().split("T")[0];

  const summaryCards = [
    {
      label: "Transacciones",
      value: "0",
      icon: Hash,
      accent: "text-primary",
    },
    {
      label: "Uds. Vendidas",
      value: "0",
      icon: TrendingUp,
      accent: "text-success",
    },
    {
      label: "Total USD",
      value: "$0.00",
      icon: DollarSign,
      accent: "text-chart-4",
    },
    {
      label: "Total VES",
      value: "0.00",
      icon: Banknote,
      accent: "text-chart-5",
    },
  ];

  return (
    <section className="flex flex-col flex-1 overflow-hidden">
      <Topbar />

      <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
        {/* Summary section */}
        <div className="px-3 md:px-4 py-3 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resumen del Día — {today}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {summaryCards.map((card) => (
              <div key={card.label} className="flex items-center gap-2.5 border rounded-md p-2.5 bg-card">
                <card.icon className={`h-4 w-4 ${card.accent} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                    {card.label}
                  </p>
                  <p className="text-lg font-bold tabular-nums leading-tight">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full h-8 gap-2 text-xs font-semibold">
            <Lock className="h-3.5 w-3.5" />
            CIERRE DE DÍA
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
