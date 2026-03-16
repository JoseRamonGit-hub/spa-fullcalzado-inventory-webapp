import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { BatchItem } from "../columns";

interface BatchSummaryFooterProps {
  batchItems: BatchItem[];
  isPending: boolean;
  onConfirmOpen: () => void;
}

export function BatchSummaryFooter({ batchItems, isPending, onConfirmOpen }: BatchSummaryFooterProps) {
  const newCount = batchItems.filter((i) => i._kind === "new").length;
  const existingCount = batchItems.filter((i) => i._kind === "existing").length;

  return (
    <footer className="flex items-center justify-between gap-3 border-t pt-3 mt-4">
      <p className="text-muted-foreground text-xs tabular-nums">
        {batchItems.length === 0 ? (
          "Sin items pendientes"
        ) : (
          <span className="flex flex-wrap items-center gap-1.5">
            {newCount > 0 && (
              <Badge variant="outline" className="px-1.5 py-0.5 text-[10px]">
                {newCount} nuevo{newCount > 1 ? "s" : ""}
              </Badge>
            )}
            {existingCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">
                {existingCount} existente{existingCount > 1 ? "s" : ""}
              </Badge>
            )}
            <span className="hidden sm:inline">en el lote</span>
          </span>
        )}
      </p>

      <Button
        type="button"
        className="gap-2 shrink-0"
        disabled={batchItems.length === 0 || isPending}
        onClick={onConfirmOpen}
      >
        <PackagePlus data-icon="inline-start" className="h-4 w-4" />
        {isPending
          ? "Procesando..."
          : `Cargar ${batchItems.length > 0 ? batchItems.length : ""} item${batchItems.length !== 1 ? "s" : ""}`}
        <KbdGroup data-icon="inline-end" className="hidden lg:flex">
          <Kbd className="ml-1">Shift ⇧</Kbd>
          <span>+</span>
          <Kbd>Enter</Kbd>
        </KbdGroup>
      </Button>
    </footer>
  );
}
