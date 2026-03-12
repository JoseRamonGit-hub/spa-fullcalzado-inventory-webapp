import { useState, useCallback, useRef } from "react";
import { useAppForm } from "@/hooks/form";
import { ProductSearchInput, type ProductSearchResult } from "@/components/product-search-input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ExistingBatchItem } from "../columns";

interface StockIncreaseFormProps {
  onAddToBatch: (item: ExistingBatchItem) => void;
}

export function StockIncreaseForm({ onAddToBatch }: StockIncreaseFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);

  const form = useAppForm({
    defaultValues: {
      quantity: "" as unknown as number,
    },
    onSubmit: async ({ value }) => {
      if (!selectedProduct) return;

      const item: ExistingBatchItem = {
        _tempId: crypto.randomUUID(),
        _kind: "existing",
        product_id: selectedProduct.id,
        code: selectedProduct.code,
        description: selectedProduct.description,
        quantity: value.quantity,
        currentStock: selectedProduct.stock,
      };

      onAddToBatch(item);
      form.reset();
      setSelectedProduct(null);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  const formRef = useRef<HTMLFormElement>(null);

  const handleProductChange = useCallback((product: ProductSearchResult | null) => {
    setSelectedProduct(product);
    if (product) {
      // Jump focus to the quantity field once React renders the chip
      requestAnimationFrame(() => {
        const qtyInput = formRef.current?.querySelector<HTMLInputElement>('input[type="number"]');
        qtyInput?.focus();
        qtyInput?.select();
      });
    }
  }, []);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <ProductSearchInput value={selectedProduct?.id ?? ""} onChange={handleProductChange} autoFocus />

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <form.AppField
            name="quantity"
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
                label="Cantidad a sumar"
                min="1"
                step="1"
                placeholder="0"
                required
                className="h-8 text-sm tabular-nums"
              />
            )}
          </form.AppField>
        </div>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              disabled={!canSubmit || isSubmitting || !selectedProduct}
              aria-label="Agregar al lote"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
