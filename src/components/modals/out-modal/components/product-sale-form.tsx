import { useRef } from "react";
import { useAppForm } from "@/hooks/form";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingSale } from "../types";
import { focusFirstNumberInput, useProductLookup } from "@/components/modals/shared/product-selection";

const MINIMUM_ALLOWED_QUANTITY = 1;
const PRODUCT_SELECTION_REQUIRED_ERROR = "Selecciona un producto";
const REQUIRED_FIELD_ERROR = "Requerido";
const MINIMUM_VALUE_ERROR = "Mín. 1";

type ProductSaleFormProps = {
  currentExchangeRate: number;
  isExchangeRateReady: boolean;
  onAddPendingSale: (sale: PendingSale) => void;
};

export function ProductSaleForm({ currentExchangeRate, isExchangeRateReady, onAddPendingSale }: ProductSaleFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { getProductById } = useProductLookup();

  const saleForm = useAppForm({
    defaultValues: {
      productId: "",
      quantity: 0,
    },
    onSubmit: async ({ value }) => {
      if (!isExchangeRateReady) return;

      const product = getProductById(value.productId);
      if (!product) return;

      const priceVes = product.price_usd * currentExchangeRate;

      onAddPendingSale({
        tempId: crypto.randomUUID(),
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

      saleForm.reset();
    },
  });

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    saleForm.handleSubmit();
  };

  const handleAfterProductSelection = () => {
    saleForm.setFieldValue("quantity", 0);
    focusFirstNumberInput(formRef.current);
  };

  const handleProductClear = () => {
    saleForm.setFieldValue("quantity", 0);
  };

  return (
    <form ref={formRef} onSubmit={handleFormSubmit}>
      <fieldset
        disabled={!isExchangeRateReady}
        className="grid min-w-0 grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-3 md:grid-cols-[minmax(0,1fr)_8rem_2.5rem] md:items-end"
      >
        <div className="col-span-2 min-w-0 md:col-span-1">
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
                allowInactive
                onAfterSelect={handleAfterProductSelection}
                onClear={handleProductClear}
              />
            )}
          </saleForm.AppField>
        </div>

        <div className="relative min-w-0">
          <saleForm.Subscribe selector={(state) => state.values.productId}>
            {(productId) => {
              const selectedProduct = getProductById(productId);

              return (
                <saleForm.AppField
                  name="quantity"
                  validators={{
                    onChange: ({ value }) => {
                      const isEmpty = value === undefined || value === null || String(value) === "";
                      if (isEmpty) return REQUIRED_FIELD_ERROR;
                      if (value < MINIMUM_ALLOWED_QUANTITY) return MINIMUM_VALUE_ERROR;
                      if (selectedProduct && value > selectedProduct.stock) {
                        return `Stock insuficiente (disponible: ${selectedProduct.stock})`;
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <field.NumberField
                      label="Cantidad"
                      compact
                      min={String(MINIMUM_ALLOWED_QUANTITY)}
                      max={selectedProduct?.stock}
                      step="1"
                      placeholder={productId ? "0" : "Selecciona"}
                      disabled={!productId}
                      required
                      className="h-8 text-sm tabular-nums"
                    />
                  )}
                </saleForm.AppField>
              );
            }}
          </saleForm.Subscribe>

          <saleForm.Subscribe
            selector={(state) => ({ quantity: state.values.quantity, productId: state.values.productId })}
          >
            {({ quantity, productId }) => {
              const product = getProductById(productId);
              if (!product || !quantity || quantity < MINIMUM_ALLOWED_QUANTITY || quantity > product.stock) return null;

              const totalUsd = quantity * product.price_usd;
              const totalVes = quantity * product.price_usd * currentExchangeRate;

              return (
                <div className="bg-popover text-popover-foreground animate-in fade-in slide-in-from-top-1 absolute top-full left-0 z-30 mt-1.5 w-44 rounded-md border px-2.5 py-2 text-[11px] shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                      Subtotal
                    </span>
                    <span className="font-semibold tabular-nums">{formatCurrencyUSD(totalUsd)}</span>
                  </div>
                  <div className="border-border/60 mt-1.5 flex items-center justify-between gap-3 border-t pt-1.5">
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
                  className="h-8 w-full shrink-0 gap-1.5 self-end px-3 sm:size-8 sm:px-0"
                  disabled={!canSubmit || isSubmitting}
                  aria-label="Agregar producto"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span className="text-xs sm:hidden">Agregar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4} className="hidden md:block">
                Agregar <Kbd>Enter</Kbd>
              </TooltipContent>
            </Tooltip>
          )}
        </saleForm.Subscribe>
      </fieldset>
    </form>
  );
}
