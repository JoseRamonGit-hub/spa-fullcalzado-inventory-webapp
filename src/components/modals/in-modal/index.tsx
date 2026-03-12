import { useState, useCallback, useEffect } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { useAppForm } from "@/hooks/form";
import { useCreateManyProducts } from "@/features/inventory/hooks";
import { DataTable } from "@/components/ui/data-table";
import { pendingItemColumns, type PendingItem } from "./columns";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PackagePlus, Plus } from "lucide-react";
import { toast } from "sonner";

interface InModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InModal({ open, onOpenChange }: InModalProps) {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const createMany = useCreateManyProducts();

  // ── Form for adding individual items to the pending list ──
  const form = useAppForm({
    defaultValues: {
      code: "",
      description: "",
      price_usd: "" as unknown as number,
      stock: "" as unknown as number,
    },
    onSubmit: async ({ value }) => {
      const newItem: PendingItem = {
        code: value.code.trim(),
        description: value.description.trim(),
        price_usd: value.price_usd,
        stock: value.stock,
        _tempId: crypto.randomUUID(),
      };
      setPendingItems((prev) => [...prev, newItem]);
      form.reset();

      // Return focus to the code field
      requestAnimationFrame(() => {
        const codeInput = document.querySelector<HTMLInputElement>('input[name="code"]');
        codeInput?.focus();
      });
    },
  });

  // ── Remove item from pending list ──
  const handleRemoveItem = useCallback((tempId: string) => {
    setPendingItems((prev) => prev.filter((item) => item._tempId !== tempId));
  }, []);

  // ── Submit all pending items ──
  const handleConfirmSubmit = useCallback(async () => {
    if (pendingItems.length === 0) return;

    // Strip _tempId before sending to backend
    const payload = pendingItems.map(({ _tempId, ...rest }) => rest);

    const promise = createMany.mutateAsync(payload);

    toast.promise(promise, {
      loading: `Cargando ${pendingItems.length} producto${pendingItems.length > 1 ? "s" : ""}...`,
      success: `${pendingItems.length} producto${pendingItems.length > 1 ? "s" : ""} cargado${pendingItems.length > 1 ? "s" : ""} correctamente`,
      error: "Error al cargar los productos",
    });

    await promise;
    setPendingItems([]);
    setConfirmOpen(false);
    onOpenChange(false);
  }, [pendingItems, createMany, onOpenChange]);

  // ── Shift+Enter global shortcut ──
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "Enter" && pendingItems.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setConfirmOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, pendingItems.length]);

  // ── Reset state when modal closes ──
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setPendingItems([]);
        form.reset();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, form],
  );

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleOpenChange}
        title="Carga de Inventario"
        description="Agrega productos uno a uno y luego carga el lote completo."
        dialogClassName="min-w-4xl"
        drawerClassName=""
        avoidCloseFromOutsideClick
      >
        <div className="flex flex-col gap-3">
          {/* ── Inline form ── */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-2"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto_auto_auto]">
              <form.AppField
                name="code"
                validators={{
                  onChange: ({ value }) => (!value ? "Requerido" : undefined),
                }}
              >
                {(field) => (
                  <field.TextField label="Código" placeholder="SKU-001" required autoFocus className="h-8 text-sm" />
                )}
              </form.AppField>

              <form.AppField
                name="description"
                validators={{
                  onChange: ({ value }) => (!value ? "Requerido" : undefined),
                }}
              >
                {(field) => (
                  <field.TextField
                    label="Descripción"
                    placeholder="Zapato deportivo negro T42"
                    required
                    className="h-8 text-sm"
                  />
                )}
              </form.AppField>

              <form.AppField
                name="price_usd"
                validators={{
                  onChange: ({ value }) => {
                    if (value === undefined || value === null || String(value) === "") return "Requerido";
                    if (value < 0) return "Inválido";
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <field.NumberField
                    label="Precio USD"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    className="h-8 text-sm tabular-nums"
                  />
                )}
              </form.AppField>

              <form.AppField
                name="stock"
                validators={{
                  onChange: ({ value }) => {
                    if (value === undefined || value === null || String(value) === "") return "Requerido";
                    if (value < 1) return "Mín. 1";
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <field.NumberField
                    label="Stock"
                    min="1"
                    step="1"
                    placeholder="0"
                    required
                    className="h-8 text-sm tabular-nums"
                  />
                )}
              </form.AppField>

              <div className="flex items-end">
                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 shrink-0"
                      disabled={!canSubmit || isSubmitting}
                      aria-label="Agregar item a la lista"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </div>
          </form>

          {/* ── Pending items table ── */}
          <div className="bg-card min-h-60 rounded-md border">
            <DataTable
              columns={pendingItemColumns}
              data={pendingItems}
              emptyMessage="Agrega productos usando el formulario de arriba."
              meta={{ onRemoveItem: handleRemoveItem }}
            />
          </div>

          {/* ── Footer / Submit ── */}
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <p className="text-muted-foreground text-xs tabular-nums">
              {pendingItems.length === 0
                ? "Sin items pendientes"
                : `${pendingItems.length} item${pendingItems.length > 1 ? "s" : ""} en cola`}
            </p>

            <Button
              type="button"
              className="gap-2"
              disabled={pendingItems.length === 0 || createMany.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              <PackagePlus className="h-4 w-4" />
              {createMany.isPending
                ? "Cargando..."
                : `Cargar ${pendingItems.length > 0 ? pendingItems.length : ""} item${pendingItems.length !== 1 ? "s" : ""}`}
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
            <AlertDialogTitle>Confirmar carga de inventario</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cargar{" "}
              <strong className="text-foreground">
                {pendingItems.length} producto{pendingItems.length > 1 ? "s" : ""}
              </strong>{" "}
              al inventario. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createMany.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={createMany.isPending}>
              {createMany.isPending ? "Cargando..." : "Confirmar carga"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
