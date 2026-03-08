import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, History, TrendingUp } from "lucide-react";
import { useExchangeRate } from "@/features/exchange_rates/hooks";
import { useExchangeRateHistory, useUpdateExchangeRate } from "@/features/settings/hooks";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "sonner";

export function ExchangeRateSection() {
  const { data: currentRate } = useExchangeRate();
  const { data: history } = useExchangeRateHistory();
  const updateRate = useUpdateExchangeRate();
  const user = useAuthStore((s) => s.user);

  const [newRate, setNewRate] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const fmtRate = (rate: number) =>
    new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(rate);

  const fmtDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRate || !user) return;

    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error("La tasa debe ser un número positivo");
      return;
    }

    const promise = updateRate.mutateAsync({
      rate,
      source: "manual",
      updated_by: user.id,
    });

    toast.promise(promise, {
      loading: "Actualizando tasa de cambio...",
      success: "Tasa actualizada correctamente",
      error: "Error al actualizar la tasa",
    });

    promise.then(() => setNewRate(""));
  };

  return (
    <div className="space-y-4">
      {/* Current rate display */}
      <div className="bg-card flex items-center gap-3 rounded-lg border p-4">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <DollarSign className="text-primary h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Tasa Activa</p>
          <p className="font-mono text-2xl font-bold tabular-nums">
            {currentRate?.rate ? fmtRate(currentRate.rate) : "—"}{" "}
            <span className="text-muted-foreground text-sm font-normal">Bs/$</span>
          </p>
        </div>
        {currentRate?.source && (
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase">
            {currentRate.source}
          </span>
        )}
      </div>

      {/* Update form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="number"
          step="0.0001"
          min="0.01"
          placeholder="Nueva tasa (ej. 78.50)"
          value={newRate}
          onChange={(e) => setNewRate(e.target.value)}
          className="h-10 flex-1 text-sm tabular-nums"
          required
        />
        <Button type="submit" disabled={updateRate.isPending || !newRate} className="h-10 gap-2 px-4">
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      </form>

      {/* History toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
        >
          <History className="h-3.5 w-3.5" />
          {showHistory ? "Ocultar historial" : "Ver historial de cambios"}
        </button>

        {showHistory && history && (
          <div className="custom-scrollbar mt-2 max-h-48 divide-y overflow-y-auto rounded-md border">
            {history.length === 0 && <div className="text-muted-foreground p-3 text-center text-xs">Sin historial</div>}
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold tabular-nums">{fmtRate(entry.rate)}</span>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase">
                    {entry.source}
                  </span>
                </div>
                <span className="text-muted-foreground text-[11px]">{fmtDate(entry.updated_at!)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
