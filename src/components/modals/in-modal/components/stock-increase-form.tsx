import { useCallback, useRef } from "react";
import { useAppForm } from "@/hooks/form";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ExistingBatchItem } from "../columns";
import type { ProductSearchResult } from "@/components/product-search-input";

const REQUIRED_FIELD_ERROR = "Requerido";
const PRODUCT_SELECTION_REQUIRED_ERROR = "Selecciona un producto";
const MINIMUM_VALUE_ERROR = "Mín. 1";
const MINIMUM_ALLOWED_QUANTITY = 1;

interface StockIncreaseFormProps {
  onAddPendingBatchItem: (item: ExistingBatchItem) => void;
}

export function StockIncreaseForm({ onAddPendingBatchItem }: StockIncreaseFormProps) {
  const stockIncreaseFormHtmlRef = useRef<HTMLFormElement>(null);

  // Holds the full product object while productId lives in the form state.
  // A ref avoids triggering re-renders on every selection.
  const currentlySelectedProductRef = useRef<ProductSearchResult | null>(null);

  const stockIncreaseForm = useAppForm({
    defaultValues: {
      productId: "",
      addedQuantity: "" as unknown as number,
    },
    onSubmit: async ({ value }) => {
      const selectedProduct = currentlySelectedProductRef.current;
      if (!selectedProduct) return;

      const newExistingBatchItem: ExistingBatchItem = {
        _tempId: crypto.randomUUID(),
        _kind: "existing",
        productId: selectedProduct.id,
        code: selectedProduct.code,
        description: selectedProduct.description,
        addedQuantity: value.addedQuantity,
        currentStock: selectedProduct.stock,
      };

      onAddPendingBatchItem(newExistingBatchItem);
      currentlySelectedProductRef.current = null;
      stockIncreaseForm.reset();
    },
  });

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();
      stockIncreaseForm.handleSubmit();
    },
    [stockIncreaseForm],
  );

  // Called right after the user picks a product in the Command dropdown.
  // Stores the full product object and jumps focus to the quantity input.
  const handleAfterProductSelection = useCallback((product: ProductSearchResult) => {
    currentlySelectedProductRef.current = product;
    requestAnimationFrame(() => {
      const quantityInputHtmlElement = stockIncreaseFormHtmlRef.current?.querySelector<HTMLInputElement>('input[type="number"]');
      quantityInputHtmlElement?.focus();
      quantityInputHtmlElement?.select();
    });
  }, []);

  return (
    <form ref={stockIncreaseFormHtmlRef} onSubmit={handleFormSubmit}>
      <fieldset className="flex flex-col gap-3 md:flex-row md:items-end">
        {/* Product search — stretches to fill available width */}
        <div className="min-w-0 flex-1">
          <stockIncreaseForm.AppField
            name="productId"
            validators={{
              onChange: ({ value }) => (!value ? PRODUCT_SELECTION_REQUIRED_ERROR : undefined),
            }}
          >
            {(field) => (
              <field.ProductSearchField
                label="Producto"
                autoFocus
                onAfterSelect={handleAfterProductSelection}
              />
            )}
          </stockIncreaseForm.AppField>
        </div>

        {/* Quantity + submit — pinned together */}
        <div className="flex items-end gap-2">
          <div className="w-32.5 shrink-0">
            <stockIncreaseForm.AppField
              name="addedQuantity"
              validators={{
                onChange: ({ value }) => {
                  const isValueEmpty = value === undefined || value === null || String(value) === "";
                  if (isValueEmpty) return REQUIRED_FIELD_ERROR;
                  if (value < MINIMUM_ALLOWED_QUANTITY) return MINIMUM_VALUE_ERROR;
                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.NumberField
                  label="Cantidad a sumar"
                  min={String(MINIMUM_ALLOWED_QUANTITY)}
                  step="1"
                  placeholder="0"
                  required
                  className="h-9 text-sm tabular-nums"
                />
              )}
            </stockIncreaseForm.AppField>
          </div>

          <stockIncreaseForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <div className="mb-0.5 flex items-center gap-1.5">
                <Button
                  type="submit"
                  size="icon"
                  variant="outline"
                  className="size-9 shrink-0"
                  disabled={!canSubmit || isSubmitting}
                  aria-label="Agregar al lote"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </Button>
                <Kbd className="opacity-50 select-none" aria-hidden="true">
                  Enter
                </Kbd>
              </div>
            )}
          </stockIncreaseForm.Subscribe>
        </div>
      </fieldset>
    </form>
  );
}
