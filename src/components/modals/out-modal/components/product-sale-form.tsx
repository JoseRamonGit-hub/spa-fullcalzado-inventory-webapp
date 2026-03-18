import { useCallback, useRef } from "react";
import { useAppForm } from "@/hooks/form";
import type { ProductSearchResult } from "@/components/product-search-input";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingSale } from "../types";

const MINIMUM_ALLOWED_QUANTITY = 1;
const PRODUCT_SELECTION_REQUIRED_ERROR = "Selecciona un producto";
const REQUIRED_FIELD_ERROR = "Requerido";
const MINIMUM_VALUE_ERROR = "Mín. 1";

interface ProductSaleFormProps {
  currentExchangeRate: number;
  onAddPendingSale: (sale: PendingSale) => void;
}

export function ProductSaleForm({ currentExchangeRate, onAddPendingSale }: ProductSaleFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const selectedProductRef = useRef<ProductSearchResult | null>(null);

  const saleForm = useAppForm({
    defaultValues: {
      productId: "",
      quantity: 0,
    },
    onSubmit: async ({ value }) => {
      const product = selectedProductRef.current;
      if (!product) return;

      const priceVes = product.price_usd * currentExchangeRate;

      onAddPendingSale({
        _tempId: crypto.randomUUID(),
        productId: product.id,
        code: product.code,
        description: product.description,
        quantity: value.quantity,
        priceUsd: product.price_usd,
        priceVes,
        totalUsd: value.quantity * product.price_usd,
        totalVes: value.quantity * priceVes,
        availableStock: product.stock,
      });

      selectedProductRef.current = null;
      saleForm.reset();
    },
  });

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();
      saleForm.handleSubmit();
    },
    [saleForm],
  );

  const handleAfterProductSelection = useCallback(
    (product: ProductSearchResult) => {
      selectedProductRef.current = product;
      saleForm.setFieldValue("quantity", 0);
      requestAnimationFrame(() => {
        const quantityInput = formRef.current?.querySelector<HTMLInputElement>('input[type="number"]');
        quantityInput?.focus();
        quantityInput?.select();
      });
    },
    [saleForm],
  );

  const handleProductClear = useCallback(() => {
    selectedProductRef.current = null;
    saleForm.setFieldValue("quantity", 0);
  }, [saleForm]);

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-2">
      <fieldset className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end">
        {/* Product search — stretches to fill available width */}
        <div className="min-w-0 flex-1">
          <saleForm.AppField
            name="productId"
            validators={{
              onChange: ({ value }) => (!value ? PRODUCT_SELECTION_REQUIRED_ERROR : undefined),
            }}
          >
            {(field) => (
              <field.ProductSearchField
                label="Producto"
                compact
                requireStock
                showPrice
                autoFocus
                onAfterSelect={handleAfterProductSelection}
                onClear={handleProductClear}
              />
            )}
          </saleForm.AppField>
        </div>

        {/* Quantity + submit — pinned together */}
        <div className="flex shrink-0 items-end gap-2">
          <div className="relative w-28 shrink-0 md:w-32">
            <saleForm.AppField
              name="quantity"
              validators={{
                onChange: ({ value }) => {
                  const isEmpty = value === undefined || value === null || String(value) === "";
                  if (isEmpty) return REQUIRED_FIELD_ERROR;
                  if (value < MINIMUM_ALLOWED_QUANTITY) return MINIMUM_VALUE_ERROR;
                  const product = selectedProductRef.current;
                  if (product && value > product.stock) {
                    return `Stock insuficiente (disponible: ${product.stock})`;
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <saleForm.Subscribe selector={(state) => state.values.productId}>
                  {(productId) => {
                    const product = productId ? selectedProductRef.current : null;
                    return (
                      <field.NumberField
                        label="Cantidad"
                        compact
                        min={String(MINIMUM_ALLOWED_QUANTITY)}
                        max={product?.stock}
                        step="1"
                        placeholder={productId ? "0" : "Selecciona"}
                        disabled={!productId}
                        required
                        className="h-8 text-sm tabular-nums"
                      />
                    );
                  }}
                </saleForm.Subscribe>
              )}
            </saleForm.AppField>

            {/* Price preview popover */}
            <saleForm.Subscribe
              selector={(state) => ({
                quantity: state.values.quantity,
                productId: state.values.productId,
              })}
            >
              {({ quantity, productId }) => {
                const product = productId ? selectedProductRef.current : null;
                if (!product || !quantity || quantity < MINIMUM_ALLOWED_QUANTITY || quantity > product.stock)
                  return null;

                const totalUsd = quantity * product.price_usd;
                const totalVes = quantity * product.price_usd * currentExchangeRate;

                return (
                  <div className="bg-popover text-popover-foreground animate-in fade-in slide-in-from-top-1 absolute top-full left-0 z-20 mt-1.5 flex w-full flex-col rounded-md border px-2 py-1.5 text-[11px] shadow-md">
                    <div className="mb-0.5 flex items-center justify-between">
                      <span className="text-muted-foreground text-[10px]">USD</span>
                      <span className="font-semibold tabular-nums">{formatCurrencyUSD(totalUsd)}</span>
                    </div>
                    <div className="border-border/50 flex items-center justify-between border-t pt-1">
                      <span className="text-muted-foreground text-[10px]">Bs</span>
                      <span className="font-medium tabular-nums">{formatCurrencyVES(totalVes)}</span>
                    </div>
                  </div>
                );
              }}
            </saleForm.Subscribe>
          </div>

          <saleForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0"
                    disabled={!canSubmit || isSubmitting}
                    aria-label="Agregar producto"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4} className="hidden md:block">
                  Agregar <Kbd>Enter</Kbd>
                </TooltipContent>
              </Tooltip>
            )}
          </saleForm.Subscribe>
        </div>
      </fieldset>

      <div
        className="text-muted-foreground hidden items-center gap-3 text-[10.5px] md:flex"
        aria-label="Atajos de teclado"
      >
        <span className="inline-flex items-center gap-1">
          <Kbd>Tab</Kbd> navega resultados
        </span>
        <span className="inline-flex items-center gap-1">
          <Kbd>Esc</Kbd> limpia selección
        </span>
      </div>
    </form>
  );
}
