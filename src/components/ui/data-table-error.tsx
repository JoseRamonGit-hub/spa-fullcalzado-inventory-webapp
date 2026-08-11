import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type DataTableErrorProps = {
  title: string;
  onRetry: () => void | Promise<unknown>;
  isRetrying?: boolean;
};

export function DataTableError({ title, onRetry, isRetrying = false }: DataTableErrorProps) {
  const handleRetry = async () => {
    try {
      await onRetry();
    } catch {
      // The table remains in its recoverable error state when retrying fails.
    }
  };

  return (
    <div className="flex min-h-56 flex-1 items-center justify-center px-4 py-8" role="alert">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <AlertCircle className="text-destructive size-6" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">Comprueba tu conexión y vuelve a intentarlo.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isRetrying}
          aria-busy={isRetrying}
          onClick={() => void handleRetry()}
        >
          <RotateCcw data-icon="inline-start" className={isRetrying ? "animate-spin" : undefined} aria-hidden="true" />
          {isRetrying ? "Reintentando…" : "Reintentar"}
        </Button>
      </div>
    </div>
  );
}
