import { useState, useCallback, useEffect } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { useCreateManyProducts } from "@/features/inventory/hooks";
import { useAuthStore } from "@/features/auth/store";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { pendingItemColumns, type BatchItem, type NewBatchItem, type ExistingBatchItem } from "./columns";
import { useBatch } from "./use-batch";
import { NewProductForm } from "./components/new-product-form";
import { StockIncreaseForm } from "./components/stock-increase-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatCurrencyUSD } from "@/utils/formatters";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";

type TabValue = "new" | "existing";

interface InModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InModal({ open, onOpenChange }: InModalProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("new");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { batchItems, addItem, removeItem, clearBatch } = useBatch();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const createMany = useCreateManyProducts();

  // Batch mutation for existing-product stock increases
  const createManyMovements = useMutation({
    mutationFn: (payloads: Parameters<typeof inventoryMovementsService.createMany>[0]) =>
      inventoryMovementsService.createMany(payloads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // ── Handlers ───────────────────────────────────────────────
  const handleAddToBatch = useCallback(
    (item: BatchItem) => {
      addItem(item);
    },
    [addItem],
  );

  const handleConfirmSubmit = useCallback(async () => {
    if (batchItems.length === 0) return;

    const newItems = batchItems.filter((i): i is NewBatchItem => i._kind === "new");
    const existingItems = batchItems.filter((i): i is ExistingBatchItem => i._kind === "existing");

    const ops: Promise<unknown>[] = [];

    if (newItems.length > 0) {
      const payload = newItems.map(({ _tempId: _t, _kind: _k, ...rest }) => rest);
      ops.push(createMany.mutateAsync(payload));
    }

    if (existingItems.length > 0 && user) {
      const movementsPayload = existingItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        type: "entry" as const,
        user_id: user.id,
      }));
      ops.push(createManyMovements.mutateAsync(movementsPayload));
    }

    const totalItems = batchItems.length;
    const promise = Promise.all(ops);

    toast.promise(promise, {
      loading: `Procesando ${totalItems} item${totalItems > 1 ? "s" : ""}...`,
      success: `${totalItems} item${totalItems > 1 ? "s" : ""} cargado${totalItems > 1 ? "s" : ""} correctamente`,
      error: "Error al procesar el lote",
    });

    await promise;
    clearBatch();
    setConfirmOpen(false);
    onOpenChange(false);
  }, [batchItems, createMany, createManyMovements, user, clearBatch, onOpenChange]);

  // ── Reset when modal closes ─────────────────────────────────
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        clearBatch();
        setActiveTab("new");
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, clearBatch],
  );

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+N → Tab Nuevo Producto
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setActiveTab("new");
      }
      // Alt+E → Tab Stock Existente
      if (e.altKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setActiveTab("existing");
      }
      // Shift+Enter → open confirm (when there are items)
      if (e.shiftKey && e.key === "Enter" && batchItems.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setConfirmOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, batchItems.length]);

  // ── Derived values ──────────────────────────────────────────
  const newCount = batchItems.filter((i) => i._kind === "new").length;
  const existingCount = batchItems.filter((i) => i._kind === "existing").length;
  const isPending = createMany.isPending || createManyMovements.isPending;

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleOpenChange}
        title="Recepción de Mercancía"
        description="Agrega productos al lote y luego confirma la carga completa."
        dialogClassName="min-w-4xl"
        drawerClassName=""
        avoidCloseFromOutsideClick
        descriptionSrOnly
      >
        <div className="flex flex-col gap-4">
          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList className="w-full">
              <TabsTrigger value="new" className="flex-1 gap-1.5" aria-keyshortcuts="Alt+N">
                Nuevo Producto
                <KbdGroup className="hidden md:flex">
                  <Kbd className="px-1 text-[9px]">Alt</Kbd>
                  <span className="text-[9px]">+</span>
                  <Kbd className="px-1 text-[9px]">N</Kbd>
                </KbdGroup>
              </TabsTrigger>
              <TabsTrigger value="existing" className="flex-1 gap-1.5" aria-keyshortcuts="Alt+E">
                Aumentar Existencia
                <KbdGroup className="hidden md:flex">
                  <Kbd className="px-1 text-[9px]">Alt</Kbd>
                  <span className="text-[9px]">+</span>
                  <Kbd className="px-1 text-[9px]">E</Kbd>
                </KbdGroup>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-3">
              <NewProductForm onAddToBatch={handleAddToBatch} />
            </TabsContent>

            <TabsContent value="existing" className="mt-3">
              <StockIncreaseForm onAddToBatch={handleAddToBatch} />
            </TabsContent>
          </Tabs>

          {/* ── Pending batch table (always visible) ── */}
          <div className="bg-card min-h-52 rounded-md border">
            <DataTable
              columns={pendingItemColumns}
              data={batchItems}
              emptyMessage="Agrega productos usando las pestañas de arriba."
              meta={{ onRemoveItem: removeItem }}
            />
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <p className="text-muted-foreground text-xs tabular-nums">
              {batchItems.length === 0 ? (
                "Sin items pendientes"
              ) : (
                <span className="flex items-center gap-1.5">
                  {newCount > 0 && (
                    <Badge variant="outline" className="px-1 py-0 text-[10px]">
                      {newCount} nuevo{newCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {existingCount > 0 && (
                    <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                      {existingCount} existente{existingCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                  <span>en el lote</span>
                </span>
              )}
            </p>

            <Button
              type="button"
              className="gap-2"
              disabled={batchItems.length === 0 || isPending}
              onClick={() => setConfirmOpen(true)}
            >
              <PackagePlus data-icon="inline-start" />
              {isPending
                ? "Procesando..."
                : `Cargar ${batchItems.length > 0 ? batchItems.length : ""} item${batchItems.length !== 1 ? "s" : ""}`}
              <KbdGroup data-icon="inline-end" className="hidden md:flex">
                <Kbd className="ml-1">Shift ⇧</Kbd>
                <span>+</span>
                <Kbd>Enter</Kbd>
              </KbdGroup>
            </Button>
          </div>
        </div>
      </ResponsiveModal>

      {/* ── Confirmation AlertDialog ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
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

          {/* Summary table */}
          <div className="custom-scrollbar max-h-52 overflow-y-auto rounded-md border text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground border-b">
                  <th className="px-2.5 py-1.5 text-left font-semibold tracking-wider uppercase">Tipo</th>
                  <th className="px-2.5 py-1.5 text-left font-semibold tracking-wider uppercase">Producto</th>
                  <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Cant.</th>
                  <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batchItems.map((item, i) => (
                  <tr key={item._tempId} className={i % 2 === 1 ? "bg-table-stripe" : ""}>
                    <td className="px-2.5 py-1">
                      {item._kind === "new" ? (
                        <Badge variant="outline" className="px-1 py-0 text-[9px]">
                          Nuevo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="px-1 py-0 text-[9px]">
                          +Stock
                        </Badge>
                      )}
                    </td>
                    <td className="px-2.5 py-1">
                      <span className="product-code mr-1.5">{item.code}</span>
                      <span className="text-muted-foreground">{item.description}</span>
                    </td>
                    <td className="px-2.5 py-1 text-right tabular-nums">
                      {item._kind === "new" ? (
                        item.stock
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-muted-foreground">{item.currentStock}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-foreground font-medium">{item.currentStock + item.quantity}</span>
                          <span className="text-muted-foreground text-[10px]">(+{item.quantity})</span>
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-1 text-right font-semibold tabular-nums">
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
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={isPending}>
              {isPending ? "Procesando..." : "Confirmar carga"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
