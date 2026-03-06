import { useState, useTransition, useMemo, useCallback } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackagePlus, Search, Plus } from "lucide-react";
import { useProducts, useCreateProduct } from "@/features/inventory/hooks";
import { useAuthStore } from "@/features/auth/store";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface IngresoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IngresoModal({ open, onOpenChange }: IngresoModalProps) {
  const { data: products } = useProducts();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();

  // Tab state
  const [activeTab, setActiveTab] = useState("new");

  // New product form state
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriceUsd, setNewPriceUsd] = useState("");
  const [newStock, setNewStock] = useState("");

  // Stock increase state
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
        (p.code.toLowerCase().includes(filteredSearch.toLowerCase()) ||
          p.description.toLowerCase().includes(filteredSearch.toLowerCase())),
    );
  }, [products, filteredSearch]);

  const selectedProduct = products?.find((p) => p.id === productId);

  // Stock increase mutation
  const stockIncreaseMutation = useMutation({
    mutationFn: (payload: { product_id: string; quantity: number; user_id: string }) =>
      inventoryMovementsService.create({
        product_id: payload.product_id,
        quantity: payload.quantity,
        type: "entry",
        user_id: payload.user_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // New product submit
  const handleNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDescription || !newPriceUsd || !newStock) return;

    const promise = createProduct.mutateAsync({
      code: newCode.trim(),
      description: newDescription.trim(),
      price_usd: parseFloat(newPriceUsd),
      stock: parseInt(newStock),
    });

    toast.promise(promise, {
      loading: "Registrando producto...",
      success: "Producto creado correctamente",
      error: "Error al crear el producto",
    });

    promise.then(() => {
      resetNewForm();
      onOpenChange(false);
    });
  };

  // Stock increase submit
  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !user) return;

    const promise = stockIncreaseMutation.mutateAsync({
      product_id: productId,
      quantity: parseInt(quantity),
      user_id: user.id,
    });

    toast.promise(promise, {
      loading: "Registrando ingreso...",
      success: "Stock actualizado correctamente",
      error: "Error al registrar el ingreso",
    });

    promise.then(() => {
      resetStockForm();
      onOpenChange(false);
    });
  };

  const resetNewForm = () => {
    setNewCode("");
    setNewDescription("");
    setNewPriceUsd("");
    setNewStock("");
  };

  const resetStockForm = () => {
    setProductId("");
    setQuantity("");
    setSearch("");
    setFilteredSearch("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetNewForm();
      resetStockForm();
      setActiveTab("new");
    }
    onOpenChange(open);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={handleOpenChange} title="Registrar Ingreso">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="new" className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo Producto
          </TabsTrigger>
          <TabsTrigger value="stock" className="text-xs">
            <PackagePlus className="h-3.5 w-3.5 mr-1.5" />
            Aumentar Stock
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: New Product */}
        <TabsContent value="new">
          <form onSubmit={handleNewProductSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Código</label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="SKU-001"
                className="h-9 text-sm"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Descripción</label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Zapato deportivo negro T42"
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Precio USD</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPriceUsd}
                  onChange={(e) => setNewPriceUsd(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-sm tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stock</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="0"
                  className="h-9 text-sm tabular-nums"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-9 gap-2" disabled={createProduct.isPending}>
              <PackagePlus className="h-4 w-4" />
              {createProduct.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </form>
        </TabsContent>

        {/* Tab 2: Stock Increase */}
        <TabsContent value="stock">
          <form onSubmit={handleStockSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Producto</label>
              {!productId ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código o descripción..."
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="h-9 pl-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto border rounded-md divide-y custom-scrollbar">
                    {filtered.length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground text-center">No se encontraron productos</div>
                    )}
                    {filtered.slice(0, 15).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProductId(p.id);
                          setSearch("");
                          setFilteredSearch("");
                        }}
                        className="w-full flex bg-card items-center gap-2 px-2.5 py-1.5 text-left hover:bg-accent transition-colors"
                      >
                        <span className="product-code text-xs">{p.code}</span>
                        <span className="text-sm truncate flex-1">{p.description}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">Stock: {p.stock}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-accent/50">
                  <span className="product-code text-xs">{selectedProduct?.code}</span>
                  <span className="text-sm truncate flex-1">{selectedProduct?.description}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setProductId("")}
                    className="h-6 px-2 text-xs"
                  >
                    Cambiar
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cantidad a agregar
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-9 text-sm tabular-nums"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-9 gap-2"
              disabled={!productId || !quantity || stockIncreaseMutation.isPending}
            >
              <PackagePlus className="h-4 w-4" />
              {stockIncreaseMutation.isPending ? "Registrando..." : "Registrar Ingreso"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </ResponsiveModal>
  );
}
