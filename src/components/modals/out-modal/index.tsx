import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { useExchangeRate } from "@/features/exchange_rates/hooks";
import { useAuthStore } from "@/features/auth/store";
import { useCreateManyTransactions } from "@/features/transactions/hooks";
import { DataTable } from "@/components/ui/data-table";
import { pendingSaleColumns, type PendingSale } from "./columns";
import { ProductSearchInput, type ProductSearchResult } from "@/components/product-search-input";
import { Input } from "@/components/ui/input";
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
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

interface OutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OutModal({ open, onOpenChange }: OutModalProps) {
  const { data: exchangeRate } = useExchangeRate();
  const user = useAuthStore((s) => s.user);
  const createMany = useCreateManyTransactions();

  const rate = exchangeRate?.rate ?? 0;

  // ── Pending batch state ──
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Product selection (shared component) ──
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [quantity, setQuantity] = useState("");

  // Focus quantity input automatically when a product is selected
  const qtyInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectedProduct) {
      requestAnimationFrame(() => {
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
      });
    }
  }, [selectedProduct]);

  const qty = parseInt(quantity) || 0;
  const priceUsd = selectedProduct?.price_usd ?? 0;
  const priceVes = priceUsd * rate;
  const isOverStock = selectedProduct ? qty > selectedProduct.stock : false;

  // ── Add item to pending list ──
  const handleAddSale = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProduct || qty < 1 || isOverStock) return;

      const newSale: PendingSale = {
        _tempId: crypto.randomUUID(),
        productId: selectedProduct.id,
        code: selectedProduct.code,
        description: selectedProduct.description,
        quantity: qty,
        priceUsd,
        priceVes,
        totalUsd: qty * priceUsd,
        totalVes: qty * priceVes,
        maxStock: selectedProduct.stock,
      };

      setPendingSales((prev) => [...prev, newSale]);
      setSelectedProduct(null);
      setQuantity("");
    },
    [selectedProduct, qty, isOverStock, priceUsd, priceVes],
  );

  // ── Remove item ──
  const handleRemoveItem = useCallback((tempId: string) => {
    setPendingSales((prev) => prev.filter((s) => s._tempId !== tempId));
  }, []);

  // ── Derived totals ──
  const grandTotalUsd = useMemo(() => pendingSales.reduce((acc, s) => acc + s.totalUsd, 0), [pendingSales]);
  const grandTotalVes = useMemo(() => pendingSales.reduce((acc, s) => acc + s.totalVes, 0), [pendingSales]);

  // ── Confirm & submit ──
  const handleConfirmSubmit = useCallback(async () => {
    if (!user || pendingSales.length === 0) return;

    const payload = pendingSales.map((s) => ({
      product_id: s.productId,
      quantity: s.quantity,
      price_usd: s.priceUsd,
      price_ves: s.priceVes,
      exchange_rate: rate,
      user_id: user.id,
    }));

    const promise = createMany.mutateAsync(payload);

    toast.promise(promise, {
      loading: `Registrando ${pendingSales.length} venta${pendingSales.length > 1 ? "s" : ""}...`,
      success: `${pendingSales.length} venta${pendingSales.length > 1 ? "s" : ""} registrada${pendingSales.length > 1 ? "s" : ""} correctamente`,
      error: "Error al registrar las ventas",
    });

    await promise;
    setPendingSales([]);
    setConfirmOpen(false);
    onOpenChange(false);
  }, [user, pendingSales, rate, createMany, onOpenChange]);

  // ── Shift+Enter shortcut ──
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "Enter" && pendingSales.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setConfirmOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, pendingSales.length]);

  // ── Reset on close ──
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setPendingSales([]);
        setSelectedProduct(null);
        setQuantity("");
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleOpenChange}
        title="Registrar Ventas"
        description="Agrega productos al carrito y luego registra el lote completo."
        dialogClassName="min-w-4xl"
        drawerClassName=""
        avoidCloseFromOutsideClick
        avoidCloseFromEsc
        descriptionSrOnly
      >
        <div className="flex flex-col gap-3">
          {/* ── Step 1 / 2: Product selector or quantity form ── */}
          {!selectedProduct ? (
            <ProductSearchInput
              value=""
              onChange={(p) => {
                setSelectedProduct(p);
                setQuantity("");
              }}
              requireStock
              showPrice
              autoFocus
              label="Seleccionar Producto"
            />
          ) : (
            /* Quantity form for selected product */
            <form onSubmit={handleAddSale} className="space-y-2">
              {/* Selected product chip */}
              <ProductSearchInput
                value={selectedProduct.id}
                onChange={(p) => {
                  setSelectedProduct(p);
                  setQuantity("");
                }}
                showPrice
                label="Producto"
              />

              {/* Quantity input + add button */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Cantidad</label>
                  <Input
                    ref={qtyInputRef}
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    step="1"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-8 text-sm tabular-nums"
                    required
                  />
                  {isOverStock && (
                    <p className="text-destructive text-[10px]">
                      Stock insuficiente (disponible: {selectedProduct.stock})
                    </p>
                  )}
                </div>

                {/* Totals preview */}
                {qty > 0 && !isOverStock && (
                  <div className="bg-muted/30 rounded-md border px-3 py-1.5 text-right">
                    <p className="text-foreground text-sm font-semibold tabular-nums">
                      {formatCurrencyUSD(qty * priceUsd)}
                    </p>
                    <p className="text-muted-foreground text-xs tabular-nums">{formatCurrencyVES(qty * priceVes)}</p>
                  </div>
                )}

                <Button type="submit" className="h-8 shrink-0" disabled={!quantity || qty < 1 || isOverStock}>
                  Agregar
                </Button>
              </div>
            </form>
          )}

          {/* ── Pending sales DataTable ── */}
          <div className="bg-card min-h-52 rounded-md border">
            <DataTable
              columns={pendingSaleColumns}
              data={pendingSales}
              emptyMessage="Agrega ventas usando el buscador de arriba."
              meta={{ onRemoveItem: handleRemoveItem }}
            />
          </div>

          {/* ── Summary footer ── */}
          <div className="rounded-md border">
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-muted-foreground text-xs">Tasa</span>
              <span className="text-xs font-medium tabular-nums">{formatCurrencyVES(rate)}</span>
            </div>
            <div className="border-t">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-muted-foreground text-xs">Total USD</span>
                <span className="text-foreground text-sm font-bold tabular-nums">
                  {formatCurrencyUSD(grandTotalUsd)}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 pb-1.5">
                <span className="text-muted-foreground text-xs">Total Bs</span>
                <span className="text-foreground text-sm font-semibold tabular-nums">
                  {formatCurrencyVES(grandTotalVes)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Submit button ── */}
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <p className="text-muted-foreground text-xs tabular-nums">
              {pendingSales.length === 0
                ? "Sin ventas pendientes"
                : `${pendingSales.length} venta${pendingSales.length > 1 ? "s" : ""} en cola`}
            </p>
            <Button
              type="button"
              className="gap-2"
              disabled={pendingSales.length === 0 || createMany.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              <ShoppingCart data-icon="inline-start" />
              {createMany.isPending
                ? "Registrando..."
                : `Registrar ${pendingSales.length > 0 ? pendingSales.length : ""} venta${pendingSales.length !== 1 ? "s" : ""}`}
              <KbdGroup className="hidden md:flex">
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
              <ShoppingCart className="text-primary" />
            </AlertDialogMedia>
            <div>
              <AlertDialogTitle>¿Confirmar registro de ventas?</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                Estás a punto de registrar{" "}
                <strong className="text-foreground">
                  {pendingSales.length} venta{pendingSales.length > 1 ? "s" : ""}
                </strong>
                . Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          {/* Items summary table */}
          <div className="custom-scrollbar max-h-48 overflow-y-auto rounded-md border text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground border-b">
                  <th className="px-2.5 py-1.5 text-left font-semibold tracking-wider uppercase">Producto</th>
                  <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Cant.</th>
                  <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Total USD</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingSales.map((s, i) => (
                  <tr key={s._tempId} className={i % 2 === 1 ? "bg-table-stripe" : ""}>
                    <td className="px-2.5 py-1">
                      <span className="product-code mr-1.5">{s.code}</span>
                      <span className="text-muted-foreground max-w-40 truncate">{s.description}</span>
                    </td>
                    <td className="px-2.5 py-1 text-right tabular-nums">{s.quantity}</td>
                    <td className="px-2.5 py-1 text-right font-semibold tabular-nums">
                      {formatCurrencyUSD(s.totalUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals block */}
          <div className="bg-muted/30 space-y-1 rounded-md border p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasa</span>
              <span className="font-medium tabular-nums">{formatCurrencyVES(rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total lote USD</span>
              <span className="text-foreground font-bold tabular-nums">{formatCurrencyUSD(grandTotalUsd)}</span>
            </div>
            <div className="border-primary/20 flex justify-between border-t pt-1">
              <span className="text-muted-foreground">Total lote Bs</span>
              <span className="text-foreground font-bold tabular-nums">{formatCurrencyVES(grandTotalVes)}</span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={createMany.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={createMany.isPending}>
              {createMany.isPending ? "Registrando..." : "Confirmar ventas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
