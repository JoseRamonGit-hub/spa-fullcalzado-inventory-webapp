import { Badge } from "@/components/ui/badge";
import type { CasheaOrderStatus } from "@/types";
import { casheaOrderStatusBadgeVariants, casheaOrderStatusLabels } from "../cashea-receivables";

export function CasheaOrderStatusBadge({ status }: { status: CasheaOrderStatus }) {
  return <Badge variant={casheaOrderStatusBadgeVariants[status]}>{casheaOrderStatusLabels[status]}</Badge>;
}
