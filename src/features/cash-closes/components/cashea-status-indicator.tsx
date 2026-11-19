import { Badge } from "@/components/ui/badge";
import { casheaOrderStatusBadgeVariants } from "@/features/cashea/cashea-receivables";
import type { CasheaCollectionStatus } from "@/types";

export function CasheaStatusIndicator({ status }: { status?: CasheaCollectionStatus }) {
  if (!status || status.orders_count === 0) return <span className="text-muted-foreground font-normal">—</span>;

  const collected = status.collected_count === status.orders_count;

  return (
    <Badge variant={collected ? "secondary" : casheaOrderStatusBadgeVariants.pending}>
      {collected ? "Cobrado" : status.collected_count > 0 ? "Cobrado parcialmente" : "Pendiente"}
    </Badge>
  );
}
