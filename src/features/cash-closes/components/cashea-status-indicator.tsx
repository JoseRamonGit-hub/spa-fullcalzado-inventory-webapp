import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CasheaCollectionStatus } from "@/types";

export function CasheaStatusIndicator({ status }: { status?: CasheaCollectionStatus }) {
  if (!status || status.orders_count === 0) return <span className="text-muted-foreground font-normal">—</span>;

  const collected = status.collected_count === status.orders_count;
  const partiallyCollected = status.collected_count > 0;

  return (
    <Badge variant="ghost" className="text-muted-foreground gap-1.5 border-0 px-0 text-xs font-normal">
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          collected ? "bg-muted-foreground/50" : partiallyCollected ? "bg-warning" : "bg-primary",
        )}
      />
      {collected ? "Cobrado" : partiallyCollected ? "Cobrado parcialmente" : "Pendiente"}
    </Badge>
  );
}
