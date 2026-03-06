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
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <DollarSign className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tasa Activa</p>
          <p className="text-2xl font-bold tabular-nums font-mono">
            {currentRate?.rate ? fmtRate(currentRate.rate) : "—"}{" "}
            <span className="text-sm font-normal text-muted-foreground">Bs/$</span>
          </p>
        </div>
        {currentRate?.source && (
          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
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
          className="h-10 text-sm tabular-nums flex-1"
          required
        />
        <Button type="submit" disabled={updateRate.isPending || !newRate} className="h-10 px-4 gap-2">
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      </form>

      {/* History toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          {showHistory ? "Ocultar historial" : "Ver historial de cambios"}
        </button>

        {showHistory && history && (
          <div className="mt-2 max-h-48 overflow-y-auto border rounded-md divide-y custom-scrollbar">
            {history.length === 0 && <div className="p-3 text-xs text-muted-foreground text-center">Sin historial</div>}
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tabular-nums font-semibold">{fmtRate(entry.rate)}</span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                    {entry.source}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">{fmtDate(entry.updated_at!)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
