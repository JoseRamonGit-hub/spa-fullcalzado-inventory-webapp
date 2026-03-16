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

interface ConfirmBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchItems: BatchItem[];
  isPending: boolean;
  onConfirm: () => void;
}

export function ConfirmBatchDialog({
  open,
  onOpenChange,
  batchItems,
  isPending,
  onConfirm,
}: ConfirmBatchDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <PackagePlus className="text-primary" />
          </AlertDialogMedia>
          <div>
            <AlertDialogTitle>¿Confirmar recepción de mercancía?</AlertDialogTitle>
            <AlertDialogDescription className="mt-1">
              Estás a punto de procesar{" "}
              <strong className="text-foreground">
                {batchItems.length} item{batchItems.length > 1 ? "s" : ""}
              </strong>{" "}
              en el inventario. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Use <section> for semantics and ensure horizontal scroll on small screens */}
        <section className="custom-scrollbar max-h-64 overflow-auto rounded-md border text-xs bg-background">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b text-left">
                <th scope="col" className="px-3 py-2 font-semibold tracking-wider uppercase">Tipo</th>
                <th scope="col" className="px-3 py-2 font-semibold tracking-wider uppercase">Producto</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold tracking-wider uppercase">Cant.</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold tracking-wider uppercase">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batchItems.map((item, i) => (
                <tr key={item._tempId} className={i % 2 === 1 ? "bg-table-stripe" : ""}>
                  <td className="px-3 py-2 align-top">
                    {item._kind === "new" ? (
                      <Badge variant="outline" className="px-1.5 py-0.5 text-[9px]">Nuevo</Badge>
                    ) : (
                      <Badge variant="secondary" className="px-1.5 py-0.5 text-[9px]">+Stock</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="product-code mr-1.5 whitespace-nowrap">{item.code}</span>
                    <span className="text-muted-foreground break-words line-clamp-2" title={item.description}>
                      {item.description}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap align-top">
                    {item._kind === "new" ? (
                      item.stock
                    ) : (
                      <span className="inline-flex items-center gap-1 justify-end w-full">
                        <span className="text-muted-foreground">{item.currentStock}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-foreground font-medium">{item.currentStock + item.quantity}</span>
                        <span className="text-muted-foreground text-[10px] hidden sm:inline-block">({item.quantity > 0 ? "+" : ""}{item.quantity})</span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums align-top whitespace-nowrap">
                    {item._kind === "new" ? (
                      formatCurrencyUSD(item.price_usd ?? 0)
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
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Procesando..." : "Confirmar carga"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
