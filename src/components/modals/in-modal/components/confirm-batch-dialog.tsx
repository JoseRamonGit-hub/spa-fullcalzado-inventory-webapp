import { Badge } from "@/components/ui/badge";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { BatchItem } from "../types";
import {
  ConfirmDialogTableSection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";

const DEFAULT_FALLBACK_PRICE = 0;

function BatchActionBadge({ item }: { item: BatchItem }) {
  return (
    <Badge variant="outline" className="px-1.5 py-0.5 text-[9px]">
      {item.kind === "new" ? "Nuevo" : "Reposición"}
    </Badge>
  );
}

type ConfirmBatchDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pendingBatchItems: BatchItem[];
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void;
};

export function ConfirmBatchDialog({
  isOpen,
  onOpenChange,
  pendingBatchItems,
  isSubmissionPending,
  onConfirmSubmit,
}: ConfirmBatchDialogProps) {
  const isMultipleProducts = pendingBatchItems.length !== 1;
  const productLabel = pendingBatchItems.length === 1 ? "producto" : "productos";

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Confirmar carga"
      description={
        <>
          Se procesará{isMultipleProducts ? "n" : ""}{" "}
          <strong className="text-foreground">
            {pendingBatchItems.length} {productLabel}
          </strong>
          . Verifica las cantidades.
        </>
      }
      confirmLabel={`Cargar ${isMultipleProducts ? "productos" : "producto"}`}
      pendingLabel="Procesando..."
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      contentClassName="sm:max-w-xl"
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 max-h-64">
        <table className="w-full min-w-100">
          <thead>
            <tr className="bg-muted/45 text-muted-foreground border-b text-left">
              <th scope="col" className="px-3 py-1.5 font-semibold tracking-wider uppercase">
                Acción
              </th>
              <th scope="col" className="px-3 py-1.5 font-semibold tracking-wider uppercase">
                Producto
              </th>
              <th scope="col" className="px-3 py-1.5 text-right font-semibold tracking-wider uppercase">
                Cant.
              </th>
              <th scope="col" className="px-3 py-1.5 text-right font-semibold tracking-wider uppercase">
                Precio
              </th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {pendingBatchItems.map((item) => (
              <tr key={item.tempId} className="bg-card">
                <td className="px-3 py-2 align-middle">
                  <BatchActionBadge item={item} />
                </td>
                <td className="px-3 py-2 align-middle">
                  <ModalProductIdentity code={item.code} description={item.description} />
                </td>
                <td className="px-3 py-2 text-right align-middle whitespace-nowrap tabular-nums">
                  {item.kind === "new" ? (
                    <span className="text-foreground font-semibold">{item.initialStock}</span>
                  ) : (
                    <span className="inline-flex w-full items-center justify-end gap-1">
                      <span className="text-muted-foreground">{item.currentStock}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-foreground font-medium">{item.currentStock + item.addedQuantity}</span>
                      <span className="text-muted-foreground hidden text-[10px] sm:inline-block">
                        ({item.addedQuantity > 0 ? "+" : ""}
                        {item.addedQuantity})
                      </span>
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right align-middle font-semibold whitespace-nowrap tabular-nums">
                  {item.kind === "new" ? (
                    formatCurrencyUSD(item.priceUsd ?? DEFAULT_FALLBACK_PRICE)
                  ) : item.priceUsd != null &&
                    item.originalPriceUsd != null &&
                    item.priceUsd !== item.originalPriceUsd ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-muted-foreground text-[11px] font-normal line-through">
                        {formatCurrencyUSD(item.originalPriceUsd)}
                      </span>
                      <span className="text-muted-foreground font-normal">→</span>
                      <span>{formatCurrencyUSD(item.priceUsd)}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[11px] font-normal">Sin cambio</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConfirmDialogTableSection>
    </ModalConfirmDialog>
  );
}
