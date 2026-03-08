import { useState, useTransition, useCallback, useMemo } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search, ArrowLeft } from "lucide-react";
import { useProducts } from "@/features/inventory/hooks";
import { useExchangeRate } from "@/features/exchange_rates/hooks";
import { useAuthStore } from "@/features/auth/store";
import { transactionsService } from "@/services/transactionsService";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface VentaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VentaModal({ open, onOpenChange }: VentaModalProps) {
  const { data: products } = useProducts();
  const { data: exchangeRate } = useExchangeRate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [search, setSearch] = useState("");
  const [filteredSearch, setFilteredSearch] = useState("");
  const [, startTransition] = useTransition();

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      startTransition(() => {
        setFilteredSearch(value);
      });
    },
    [startTransition],
  );

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(
      (p) =>
        p.active &&
        p.stock > 0 &&
        (p.code.toLowerCase().includes(filteredSearch.toLowerCase()) ||
          p.description.toLowerCase().includes(filteredSearch.toLowerCase())),
    );
  }, [products, filteredSearch]);

  const selectedProduct = products?.find((p) => p.id === productId);
  const rate = exchangeRate?.rate || 0;
  const priceUsd = selectedProduct?.price_usd || 0;
  const priceVes = priceUsd * rate;
  const qty = parseInt(quantity) || 0;
  const totalUsd = priceUsd * qty;
  const totalVes = priceVes * qty;

  const saleMutation = useMutation({
    mutationFn: (payload: Parameters<typeof transactionsService.create>[0]) => transactionsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !user || !rate) return;

    const promise = saleMutation.mutateAsync({
      product_id: productId,
      quantity: qty,
      price_usd: priceUsd,
      price_ves: priceVes,
      exchange_rate: rate,
      user_id: user.id,
    });

    toast.promise(promise, {
      loading: "Registrando venta...",
      success: "Venta registrada correctamente",
      error: "Error al registrar la venta",
    });

    promise.then(() => {
      resetForm();
      onOpenChange(false);
    });
  };

  const resetForm = () => {
    setProductId("");
    setQuantity("");
    setSearch("");
    setFilteredSearch("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const fmtCurrency = (value: number, prefix: string) =>
    `${prefix}${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`;

  return (
    <ResponsiveModal open={open} onOpenChange={handleOpenChange} title="Registrar Venta">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Step 1: Product selection (shown when no product selected) */}
        {!productId ? (
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Seleccionar Producto
            </label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                placeholder="Buscar por código o descripción..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-9 pl-8 text-sm"
                autoFocus
              />
            </div>
            <div className="custom-scrollbar max-h-[132px] divide-y overflow-y-auto rounded-md border">
              {filtered.length === 0 && (
                <div className="text-muted-foreground p-2 text-center text-xs">No hay productos con stock</div>
              )}
              {filtered.slice(0, 20).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProductId(p.id);
                    setSearch("");
                    setFilteredSearch("");
                  }}
                  className="bg-card hover:bg-accent flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors"
                >
                  <span className="product-code text-xs">{p.code}</span>
                  <span className="flex-1 truncate text-sm">{p.description}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">{fmtCurrency(p.price_usd, "$")}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">[{p.stock}]</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Step 2: Product detail + sale form (shown when product selected) */
          <>
            {/* Product info card */}
            <div className="bg-accent/30 space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="product-code text-xs">{selectedProduct?.code}</span>
                  <span className="truncate text-sm">{selectedProduct?.description}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setProductId("")}
                  className="h-7 shrink-0 gap-1 px-2 text-xs"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Cambiar
                </Button>
              </div>
              <div className="text-muted-foreground flex gap-4 text-xs">
                <span>
                  Precio: <strong className="text-foreground tabular-nums">{fmtCurrency(priceUsd, "$")}</strong>
                </span>
                <span>
                  Stock: <strong className="text-foreground tabular-nums">{selectedProduct?.stock}</strong>
                </span>
              </div>
            </div>

            {/* Quantity input */}
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Cantidad</label>
              <Input
                type="number"
                min="1"
                max={selectedProduct?.stock || 999}
                step="1"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-9 text-sm tabular-nums"
                required
                autoFocus
              />
              {selectedProduct && qty > selectedProduct.stock && (
                <p className="text-destructive text-xs">Stock insuficiente (disponible: {selectedProduct.stock})</p>
              )}
            </div>

            {/* Totals preview */}
            {qty > 0 && (
              <div className="bg-muted/30 space-y-1 rounded-md border p-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tasa BCV</span>
                  <span className="font-medium tabular-nums">{rate.toFixed(2)} Bs/$</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total USD</span>
                  <span className="font-semibold tabular-nums">{fmtCurrency(totalUsd, "$")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Bs</span>
                  <span className="font-semibold tabular-nums">{fmtCurrency(totalVes, "Bs ")}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="h-9 w-full gap-2"
              disabled={
                !productId ||
                !quantity ||
                saleMutation.isPending ||
                (selectedProduct ? qty > selectedProduct.stock : false)
              }
            >
              <ShoppingCart className="h-4 w-4" />
              {saleMutation.isPending ? "Registrando..." : "Registrar Venta"}
            </Button>
          </>
        )}
      </form>
    </ResponsiveModal>
  );
}
