import type { BatchItem } from "../columns";

type BatchSummaryBlockProps = {
  pendingBatchItems: BatchItem[];
};

function getBatchStats(pendingBatchItems: BatchItem[]) {
  const newItemsCount = pendingBatchItems.filter((item) => item.kind === "new").length;
  const restockItemsCount = pendingBatchItems.filter((item) => item.kind === "existing").length;
  const totalUnits = pendingBatchItems.reduce((total, item) => {
    if (item.kind === "new") return total + item.initialStock;
    return total + item.addedQuantity;
  }, 0);

  return { newItemsCount, restockItemsCount, totalUnits };
}

export function BatchSummaryBlock({ pendingBatchItems }: BatchSummaryBlockProps) {
  const { newItemsCount, restockItemsCount, totalUnits } = getBatchStats(pendingBatchItems);

  return (
    <>
      <section className="bg-card hidden h-72 flex-col justify-between rounded-md border p-4 md:flex">
        <div>
          <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Resumen del lote</p>
          <p className="text-muted-foreground mt-1 text-xs">Cambios preparados antes de confirmar.</p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Unidades a ingresar
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{totalUnits}</p>
          </div>

          <div className="border-border/70 grid grid-cols-2 gap-3 border-t pt-3">
            <div>
              <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Nuevos</p>
              <p className="text-foreground/75 mt-1 text-sm font-semibold tabular-nums">{newItemsCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Reposición</p>
              <p className="text-foreground/75 mt-1 text-sm font-semibold tabular-nums">{restockItemsCount}</p>
            </div>
          </div>
        </div>

        <div className="border-border/70 border-t pt-3">
          <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Confirmación</p>
          <p className="text-muted-foreground mt-1 text-xs">El lote se procesa al confirmar la carga.</p>
        </div>
      </section>

      <section className="bg-card rounded-md border p-3 md:hidden">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            Unidades a ingresar
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums">{totalUnits}</p>
        </div>

        <div className="border-border/70 mt-3 grid grid-cols-2 gap-3 border-t pt-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Nuevos</p>
            <p className="truncate text-xs font-semibold tabular-nums">{newItemsCount}</p>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Reposición</p>
            <p className="truncate text-xs font-medium tabular-nums">{restockItemsCount}</p>
          </div>
        </div>
      </section>
    </>
  );
}
