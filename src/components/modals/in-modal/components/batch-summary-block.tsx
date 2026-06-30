import type { BatchItem } from "../types";

type BatchSummaryBlockProps = {
  pendingBatchItems: BatchItem[];
};

function getBatchStats(pendingBatchItems: BatchItem[]) {
  return pendingBatchItems.reduce(
    (stats, item) => {
      if (item.kind === "new") {
        stats.newItemsCount += 1;
        stats.totalUnits += item.initialStock;
      } else {
        stats.restockItemsCount += 1;
        stats.totalUnits += item.addedQuantity;
      }

      return stats;
    },
    { newItemsCount: 0, restockItemsCount: 0, totalUnits: 0 },
  );
}

export function BatchSummaryBlock({ pendingBatchItems }: BatchSummaryBlockProps) {
  const { newItemsCount, restockItemsCount, totalUnits } = getBatchStats(pendingBatchItems);

  return (
    <>
      <section className="bg-card hidden h-72 flex-col rounded-md border p-4 md:flex">
        <div>
          <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Resumen del lote</p>
          <p className="text-muted-foreground mt-1 text-xs">Cambios preparados antes de confirmar.</p>
        </div>

        <div className="my-auto flex flex-col gap-3">
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
