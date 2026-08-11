import { cn } from "@/lib/utils";
import type { InventoryMovement } from "@/types";
import { getMovementSignedQuantity } from "../movement-presentation";

type MovementStockChangeProps = {
  movement: Pick<InventoryMovement, "type" | "quantity" | "stock_before">;
  fallback?: "quantity" | "empty";
  showDelta?: boolean;
};

export function MovementStockChange({ movement, fallback = "quantity", showDelta = true }: MovementStockChangeProps) {
  const signedQuantity = getMovementSignedQuantity(movement);

  if (signedQuantity == null) {
    return <span className="text-muted-foreground block text-right">—</span>;
  }

  if (movement.stock_before == null) {
    if (fallback === "empty") return <span className="text-muted-foreground block text-right">—</span>;

    return (
      <span className="flex items-center justify-end gap-1">
        <span className={cn("text-[11px] font-semibold", signedQuantity > 0 ? "text-success" : "text-destructive")}>
          {signedQuantity > 0 ? "+" : "−"}
        </span>
        <span className="tabular-value font-medium">{Math.abs(signedQuantity)}</span>
      </span>
    );
  }

  if (signedQuantity === 0) {
    return <span className="tabular-value text-muted-foreground block text-right">{movement.stock_before}</span>;
  }

  const stockAfter = movement.stock_before + signedQuantity;

  return (
    <div className="tabular-value flex items-center justify-end gap-1.5">
      <span className="text-muted-foreground">{movement.stock_before}</span>
      <span className="text-muted-foreground">→</span>
      <span className="text-foreground font-medium">{stockAfter}</span>
      {showDelta ? (
        <span className={cn("text-[11px]", signedQuantity > 0 ? "text-success" : "text-destructive")}>
          ({signedQuantity > 0 ? "+" : "−"}
          {Math.abs(signedQuantity)})
        </span>
      ) : null}
    </div>
  );
}
