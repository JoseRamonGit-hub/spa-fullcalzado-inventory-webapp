import { useState, useMemo, useTransition, useCallback } from "react";
import { useAppForm } from "@/hooks/form";
import { useProducts } from "@/features/inventory/hooks";
import { useAuthStore } from "@/features/auth/store";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PackagePlus, Search } from "lucide-react";
import { toast } from "sonner";

interface StockIncreaseFormProps {
  onSuccess: () => void;
}

export function StockIncreaseForm({ onSuccess }: StockIncreaseFormProps) {
  const { data: products } = useProducts();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Search state
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
    [startTransition]
  );

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(
      (p) =>
        p.active &&
        (p.code.toLowerCase().includes(filteredSearch.toLowerCase()) ||
          p.description.toLowerCase().includes(filteredSearch.toLowerCase()))
    );
  }, [products, filteredSearch]);

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

  const form = useAppForm({
    defaultValues: {
      product_id: "",
      quantity: "" as unknown as number,
    },
    onSubmit: async ({ value }) => {
      if (!user) return;

      const promise = stockIncreaseMutation.mutateAsync({
        product_id: value.product_id,
        quantity: value.quantity,
        user_id: user.id,
      });

      toast.promise(promise, {
        loading: "Registrando carga de inventario...",
        success: "Stock actualizado correctamente",
        error: "Error al registrar el carga de inventario",
      });

      await promise;
      form.reset();
      setSearch("");
      setFilteredSearch("");
      onSuccess();
    },
  });



  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Producto</label>
        
        <form.AppField
          name="product_id"
          validators={{
            onChange: ({ value }) => (!value ? "Debes seleccionar un producto" : undefined),
          }}
        >
          {(field) => {
            const selectedProduct = products?.find((p) => p.id === field.state.value);

            return (
              <>
              {!field.state.value ? (
                <div className="space-y-1.5">
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
                  <div className="custom-scrollbar max-h-32 divide-y overflow-y-auto rounded-md border">
                    {filtered.length === 0 && (
                      <div className="text-muted-foreground p-2 text-center text-xs">No se encontraron productos</div>
                    )}
                    {filtered.slice(0, 15).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          field.handleChange(p.id);
                          setSearch("");
                          setFilteredSearch("");
                        }}
                        className="bg-card hover:bg-accent flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors"
                      >
                        <span className="product-code text-xs">{p.code}</span>
                        <span className="flex-1 truncate text-sm">{p.description}</span>
                        <span className="text-muted-foreground text-xs tabular-nums">Stock: {p.stock}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-accent/50 flex items-center gap-2 rounded-md border p-2">
                  <span className="product-code text-xs">{selectedProduct?.code}</span>
                  <span className="flex-1 truncate text-sm">{selectedProduct?.description}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => field.handleChange("")}
                    className="h-6 px-2 text-xs"
                  >
                    Cambiar
                  </Button>
                </div>
              )}
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <p className="text-destructive text-[10px] font-medium">{field.state.meta.errors.join(", ")}</p>
              )}
            </>
          );
        }}
        </form.AppField>
      </div>

      <div className="space-y-1.5">
        <form.AppField
          name="quantity"
          validators={{
            onChange: ({ value }) => {
              if (value === undefined || value === null || String(value) === "") return "La cantidad es requerida";
              if (value < 1) return "La cantidad debe ser al menos 1";
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.NumberField
              label="Cantidad a agregar"
              min="1"
              step="1"
              placeholder="0"
              required
              className="h-9 text-sm tabular-nums"
            />
          )}
        </form.AppField>
      </div>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            className="h-9 w-full gap-2"
            disabled={!canSubmit || isSubmitting || stockIncreaseMutation.isPending}
          >
            <PackagePlus className="h-4 w-4" />
            {isSubmitting || stockIncreaseMutation.isPending ? "Registrando..." : "Registrar Ingreso"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
