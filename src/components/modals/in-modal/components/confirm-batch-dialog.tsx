import { PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { BatchItem } from "../columns";
import { ConfirmDialogTableSection, ModalConfirmDialog } from "@/components/modals/shared/modal-ui";

const NEW_ITEM_KIND = "new";
const DEFAULT_FALLBACK_PRICE = 0;

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
  const productLabel = pendingBatchItems.length === 1 ? "producto" : "productos";

  const renderNewItemCell = () => (
    <Badge variant="outline" className="px-1.5 py-0.5 text-[9px]">
      Nuevo
    </Badge>
  );

  const renderExistingItemCell = () => (
    <Badge variant="outline" className="px-1.5 py-0.5 text-[9px]">
      Reposición
    </Badge>
  );

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={<PackagePlus className="text-primary" />}
      title="¿Confirmar carga de inventario?"
      description={
        <>
          Se cargarán{" "}
          <strong className="text-foreground">
            {pendingBatchItems.length} {productLabel}
          </strong>{" "}
          al inventario. Revisa las cantidades antes de confirmar.
        </>
      }
      confirmLabel="Confirmar carga"
      pendingLabel="Procesando..."
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      contentClassName="max-w-xl"
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 max-h-64 shadow-xs">
        <table className="w-full min-w-100">
          <thead>
            <tr className="bg-muted/45 text-muted-foreground border-b text-left">
              <th scope="col" className="px-3 py-2 font-semibold tracking-wider uppercase">
                Acción
              </th>
              <th scope="col" className="px-3 py-2 font-semibold tracking-wider uppercase">
                Producto
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold tracking-wider uppercase">
                Cant.
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold tracking-wider uppercase">
                Precio
              </th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {pendingBatchItems.map((item) => (
              <tr key={item.tempId} className="bg-card">
                <td className="px-3 py-2.5 align-middle">
                  {item.kind === NEW_ITEM_KIND ? renderNewItemCell() : renderExistingItemCell()}
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <span className="product-code block whitespace-nowrap uppercase">{item.code}</span>
                  <span
                    className="text-muted-foreground mt-0.5 line-clamp-2 block wrap-break-word"
                    title={item.description}
                  >
                    {item.description}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right align-middle whitespace-nowrap tabular-nums">
                  {item.kind === NEW_ITEM_KIND ? (
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
                <td className="px-3 py-2.5 text-right align-middle font-semibold whitespace-nowrap tabular-nums">
                  {item.kind === NEW_ITEM_KIND ? (
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
