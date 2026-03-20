import { useCallback, useRef } from "react";
import { useAppForm } from "@/hooks/form";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { Plus } from "lucide-react";
import { focusFirstNumberInput, useProductLookup } from "@/components/modals/shared/product-selection";

const MINIMUM_ALLOWED_QUANTITY = 1;
const PRODUCT_SELECTION_REQUIRED_ERROR = "Selecciona un producto";
const REQUIRED_FIELD_ERROR = "Requerido";
const MINIMUM_VALUE_ERROR = "Mín. 1";

interface ProductReturnFormProps {
  currentExchangeRate: number;
  isExchangeRateReady?: boolean;
  requireStock?: boolean;
  onAddItem: (item: {
    productId: string;
    code: string;
    description: string;
    quantity: number;
    priceUsd: number;
    priceVes: number;
    availableStock: number;
  }) => void;
}

export function ProductReturnForm({
  currentExchangeRate,
  isExchangeRateReady = true,
  requireStock = false,
  onAddItem,
}: ProductReturnFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { getProductById } = useProductLookup();

  const form = useAppForm({
    defaultValues: {
      productId: "",
      quantity: 0,
    },
    onSubmit: async ({ value }) => {
      if (!isExchangeRateReady) return;

      const product = getProductById(value.productId);
      if (!product) return;

      const priceVes = product.price_usd * currentExchangeRate;

      onAddItem({
        productId: product.id,
        code: product.code,
        description: product.description,
        quantity: value.quantity,
        priceUsd: product.price_usd,
        priceVes,
        availableStock: product.stock,
      });

      form.reset();
    },
  });

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  const handleAfterProductSelection = useCallback(() => {
    form.setFieldValue("quantity", 0);
    focusFirstNumberInput(formRef.current);
  }, [form]);

  const handleProductClear = useCallback(() => {
    form.setFieldValue("quantity", 0);
  }, [form]);

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-2">
      <fieldset disabled={!isExchangeRateReady} className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <form.AppField
            name="productId"
            validators={{
              onChange: ({ value }) => (!value ? PRODUCT_SELECTION_REQUIRED_ERROR : undefined),
            }}
          >
            {(field) => (
              <field.ProductSearchField
                label="Producto"
                compact
                requireStock={requireStock}
                showPrice
                autoFocus
                onAfterSelect={handleAfterProductSelection}
                onClear={handleProductClear}
              />
            )}
          </form.AppField>
        </div>

        <div className="flex shrink-0 items-end gap-2">
          <div className="w-28 shrink-0 md:w-32">
            <form.Subscribe selector={(state) => state.values.productId}>
              {(productId) => {
                const selectedProduct = getProductById(productId);

                return (
                  <form.AppField
                    name="quantity"
                    validators={{
                      onChange: ({ value }) => {
                        const isEmpty = value === undefined || value === null || String(value) === "";
                        if (isEmpty) return REQUIRED_FIELD_ERROR;
                        if (value < MINIMUM_ALLOWED_QUANTITY) return MINIMUM_VALUE_ERROR;
                        if (requireStock && selectedProduct && value > selectedProduct.stock) {
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
                        max={requireStock ? selectedProduct?.stock : undefined}
                        step="1"
                        placeholder={productId ? "0" : "Selecciona"}
                        disabled={!productId}
                        required
                        className="h-8 text-sm tabular-nums"
                      />
                    )}
                  </form.AppField>
                );
              }}
            </form.Subscribe>
          </div>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
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
          </form.Subscribe>
        </div>
      </fieldset>
    </form>
  );
}
