import { Badge } from "@/components/ui/badge";
import { TableHead } from "@/components/ui/table";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { BatchItem } from "../types";
import { MODAL_SUBMISSION_ERROR_MESSAGES } from "@/components/modals/shared/submission-messages";
import {
  ConfirmDialogTableSection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";

const DEFAULT_FALLBACK_PRICE = 0;

function BatchActionBadge({ item }: { item: BatchItem }) {
  return (
    <Badge variant="outline" className="px-1.5 py-0.5 text-[11px]">
      {item.kind === "new" ? "Nuevo" : "Reposición"}
    </Badge>
  );
}

type ConfirmBatchDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pendingBatchItems: BatchItem[];
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void | Promise<void>;
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
          Se cargará{isMultipleProducts ? "n" : ""}{" "}
          <strong className="text-foreground">
            {pendingBatchItems.length} {productLabel}
          </strong>
          . Verifica las cantidades y los precios.
        </>
      }
      confirmLabel={`Cargar ${isMultipleProducts ? "productos" : "producto"}`}
      pendingLabel="Procesando..."
      submissionErrorMessage={MODAL_SUBMISSION_ERROR_MESSAGES.inventoryLoad}
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      contentClassName="sm:max-w-xl"
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 max-h-64">
        <table className="w-full">
          <thead className="hidden sm:table-header-group">
            <tr className="bg-muted/35 text-muted-foreground border-b text-left">
              <TableHead scope="col" className="py-1.5">
                Acción
              </TableHead>
              <TableHead scope="col" className="py-1.5">
                Producto
              </TableHead>
              <TableHead scope="col" className="py-1.5 text-right">
                Cantidad
              </TableHead>
              <TableHead scope="col" className="py-1.5 text-right">
                Precio USD
              </TableHead>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {pendingBatchItems.map((item) => (
              <tr
                key={item.tempId}
                className="bg-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-2 sm:table-row sm:px-0 sm:py-0"
              >
                <td className="p-0 align-middle sm:px-3 sm:py-2">
                  <BatchActionBadge item={item} />
                </td>
                <td className="min-w-0 p-0 align-middle sm:px-3 sm:py-2">
                  <ModalProductIdentity code={item.code} description={item.description} />
                </td>
                <td className="p-0 align-middle whitespace-nowrap tabular-nums sm:px-3 sm:py-2 sm:text-right">
                  <span className="text-muted-foreground mr-1.5 text-[11px] font-medium sm:hidden">Cantidad</span>
                  {item.kind === "new" ? (
                    <span className="text-foreground font-semibold">{item.initialStock}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 sm:w-full sm:justify-end">
                      <span className="text-muted-foreground">{item.currentStock}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-foreground font-medium">{item.currentStock + item.addedQuantity}</span>
                      <span className="text-muted-foreground hidden text-[11px] sm:inline-block">
                        ({item.addedQuantity > 0 ? "+" : ""}
                        {item.addedQuantity})
                      </span>
                    </span>
                  )}
                </td>
                <td className="p-0 text-right align-middle font-semibold whitespace-nowrap tabular-nums sm:px-3 sm:py-2">
                  <span className="text-muted-foreground mr-1.5 text-[11px] font-medium sm:hidden">Precio USD</span>
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
                    <span className="text-muted-foreground text-[11px] font-normal">
                      {formatCurrencyUSD(item.priceUsd ?? item.currentPriceUsd)}
                    </span>
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
