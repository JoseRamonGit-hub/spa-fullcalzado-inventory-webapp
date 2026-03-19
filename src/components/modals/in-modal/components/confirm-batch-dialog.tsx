import { PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { BatchItem } from "../columns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NEW_ITEM_KIND = "new";
const DEFAULT_FALLBACK_PRICE = 0;

interface ConfirmBatchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pendingBatchItems: BatchItem[];
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void;
}

export function ConfirmBatchDialog({
  isOpen,
  onOpenChange,
  pendingBatchItems,
  isSubmissionPending,
  onConfirmSubmit,
}: ConfirmBatchDialogProps) {
  const isMultipleItems = pendingBatchItems.length > 1;
  const isRowStripe = (index: number) => index % 2 === 1;

  const renderNewItemCell = () => (
    <Badge variant="outline" className="px-1.5 py-0.5 text-[9px]">
      Nuevo
    </Badge>
  );

  const renderExistingItemCell = () => (
    <Badge variant="secondary" className="px-1.5 py-0.5 text-[9px]">
      +Stock
    </Badge>
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <PackagePlus className="text-primary" />
          </AlertDialogMedia>
          <div>
            <AlertDialogTitle>¿Confirmar carga de inventario?</AlertDialogTitle>
            <AlertDialogDescription className="mt-1">
              Estás a punto de procesar{" "}
              <strong className="text-foreground">
                {pendingBatchItems.length} item{isMultipleItems ? "s" : ""}
              </strong>{" "}
              en el inventario. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Use <section> for semantics and ensure horizontal scroll on small screens */}
        <section className="custom-scrollbar bg-background max-h-64 overflow-auto rounded-md border text-xs">
          <table className="w-full min-w-100">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b text-left">
                <th scope="col" className="px-3 py-2 font-semibold tracking-wider uppercase">
                  Tipo
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
            <tbody className="divide-y">
              {pendingBatchItems.map((item, index) => (
                <tr key={item._tempId} className={isRowStripe(index) ? "bg-table-stripe" : ""}>
                  <td className="px-3 py-2 align-top">
                    {item._kind === NEW_ITEM_KIND ? renderNewItemCell() : renderExistingItemCell()}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="product-code mr-1.5 whitespace-nowrap uppercase">{item.code}</span>
                    <span className="text-muted-foreground line-clamp-2 wrap-break-word" title={item.description}>
                      {item.description}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right align-top whitespace-nowrap tabular-nums">
                    {item._kind === NEW_ITEM_KIND ? (
                      item.initialStock
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
                  <td className="px-3 py-2 text-right align-top font-semibold whitespace-nowrap tabular-nums">
                    {item._kind === NEW_ITEM_KIND ? (
                      formatCurrencyUSD(item.priceUsd ?? DEFAULT_FALLBACK_PRICE)
                    ) : (
                      <span className="text-muted-foreground font-normal">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmissionPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmSubmit} disabled={isSubmissionPending}>
            {isSubmissionPending ? "Procesando..." : "Confirmar carga"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
