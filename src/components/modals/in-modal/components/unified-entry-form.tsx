import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Lock, LockOpen } from "lucide-react";
import { useAppForm } from "@/hooks/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { ProductSearchResult } from "@/components/product-search/types";
import { useProductLookup } from "@/components/modals/shared/product-selection";
import type { BatchItem, NewBatchItem, ExistingBatchItem } from "../columns";

const REQUIRED = "Requerido";
const INVALID = "Inválido";
const MIN_1 = "Mín. 1";
const MIN_PRICE = 0;
const MIN_QUANTITY = 1;

type UnifiedEntryFormProps = {
  pendingBatchItems: BatchItem[];
  onAddPendingBatchItem: (item: BatchItem) => void;
};

export function UnifiedEntryForm({ pendingBatchItems, onAddPendingBatchItem }: UnifiedEntryFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { getProductById } = useProductLookup();
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  const isExistingMode = selectedProduct !== null;

  const form = useAppForm({
    defaultValues: {
      selectedProductId: "",
      description: "",
      priceUsd: 0,
      quantityOrInitialStock: 0,
    },
    onSubmit: async ({ value }) => {
      if (isExistingMode) {
        const isDuplicate = pendingBatchItems.some(
          (item) => item.kind === "existing" && item.productId === value.selectedProductId,
        );
        if (isDuplicate) {
          toast.error(
            "Este producto ya está en el lote. Elimina la fila existente y vuelve a agregarlo con la cantidad correcta.",
          );
          return;
        }

        const product = getProductById(value.selectedProductId);
        if (!product) return;

        const editedPrice = isUnlocked ? value.priceUsd : undefined;
        const hasPriceChange = editedPrice != null && editedPrice !== product.price_usd;

        const item: ExistingBatchItem = {
          tempId: crypto.randomUUID(),
          kind: "existing",
          productId: product.id,
          code: product.code,
          description: isUnlocked ? value.description.trim() : product.description,
          addedQuantity: value.quantityOrInitialStock,
          currentStock: product.stock,
          currentPriceUsd: product.price_usd,
          ...(hasPriceChange && { priceUsd: editedPrice, originalPriceUsd: product.price_usd }),
        };
        onAddPendingBatchItem(item);
      } else {
        const code = searchText.trim();
        if (!code) {
          toast.error("Ingresa un código de producto.");
          return;
        }

        const item: NewBatchItem = {
          tempId: crypto.randomUUID(),
          kind: "new",
          code,
          description: value.description.trim(),
          priceUsd: value.priceUsd,
          initialStock: value.quantityOrInitialStock,
        };
        onAddPendingBatchItem(item);
      }

      form.reset();
      setSelectedProduct(null);
      setSearchText("");
      setIsUnlocked(false);
      setFormResetKey((k) => k + 1);

      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLInputElement>("[cmdk-input]")?.focus();
      });
    },
  });

  const focusField = (name: string) => {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.focus();
    });
  };

  const handleEnterWithNoResults = () => {
    focusField("description");
  };

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
  };

  const handleAfterProductSelect = (product: ProductSearchResult) => {
    setSelectedProduct(product);
    setSearchText("");
    form.setFieldValue("description", product.description);
    form.setFieldValue("priceUsd", product.price_usd);
    setIsUnlocked(false);

    focusField("quantityOrInitialStock");
  };

  const handleProductClear = () => {
    setSelectedProduct(null);
    setSearchText("");
    form.setFieldValue("description", "");
    form.setFieldValue("priceUsd", 0);
    setIsUnlocked(false);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

  const isFieldLocked = isExistingMode && !isUnlocked;

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div key={formResetKey} className="min-w-0 flex-1">
          <form.AppField name="selectedProductId">
            {(field) => (
              <field.ProductSearchField
                label="Código"
                compact
                showPrice
                autoFocus
                searchText={searchText}
                onSearchTextChange={handleSearchTextChange}
                onEnterWithNoResults={handleEnterWithNoResults}
                onAfterSelect={handleAfterProductSelect}
                onClear={handleProductClear}
              />
            )}
          </form.AppField>
        </div>
        <div className="hidden h-8 items-center sm:flex">
          {isExistingMode ? (
            <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
              Producto existente
            </Badge>
          ) : searchText.trim() ? (
            <Badge variant="outline" className="text-[10px] whitespace-nowrap">
              Nuevo producto
            </Badge>
          ) : null}
        </div>
      </div>

      <fieldset className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-[2fr_auto_auto_auto]">
        <div className="col-span-2 sm:col-span-1">
          <form.AppField
            name="description"
            validators={{
              onChange: ({ value }) => {
                if (isFieldLocked) return undefined;
                return !value.trim() ? REQUIRED : undefined;
              },
            }}
          >
            {(field) => (
              <field.TextField
                label="Descripción"
                compact
                placeholder="Zapato deportivo negro T42"
                required={!isFieldLocked}
                disabled={isFieldLocked}
                className="h-8 text-sm"
                autoComplete="off"
              />
            )}
          </form.AppField>
        </div>

        <div className="col-span-1">
          <form.AppField
            name="priceUsd"
            validators={{
              onChange: ({ value }) => {
                if (isFieldLocked) return undefined;
                const isEmpty = value === undefined || value === null || String(value) === "";
                if (isEmpty) return REQUIRED;
                if (value < MIN_PRICE) return INVALID;
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.NumberField
                label="Precio USD"
                compact
                step="0.01"
                min={String(MIN_PRICE)}
                placeholder="0.00"
                required={!isFieldLocked}
                disabled={isFieldLocked}
                className="h-8 text-sm tabular-nums"
              />
            )}
          </form.AppField>
        </div>

        <div className="col-span-1">
          <form.AppField
            name="quantityOrInitialStock"
            validators={{
              onChange: ({ value }) => {
                const isEmpty = value === undefined || value === null || String(value) === "";
                if (isEmpty) return REQUIRED;
                if (value < MIN_QUANTITY) return MIN_1;
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.NumberField
                label={isExistingMode ? "Cantidad" : "Stock"}
                compact
                min={String(MIN_QUANTITY)}
                step="1"
                placeholder="0"
                required
                className="h-8 text-sm tabular-nums"
              />
            )}
          </form.AppField>
        </div>

        <div className="col-span-2 flex items-end gap-2 sm:col-span-1">
          {isExistingMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isUnlocked ? "secondary" : "outline"}
                  size="icon"
                  className="size-8 shrink-0 max-sm:h-9 max-sm:w-auto max-sm:flex-1 max-sm:gap-1.5 max-sm:px-3"
                  onClick={() => setIsUnlocked((prev) => !prev)}
                  aria-label={isUnlocked ? "Bloquear datos del producto" : "Editar datos del producto"}
                >
                  {isUnlocked ? (
                    <LockOpen className="size-3.5" aria-hidden="true" />
                  ) : (
                    <>
                      <Pencil className="size-3.5 sm:hidden" aria-hidden="true" />
                      <Lock className="hidden size-3.5 sm:block" aria-hidden="true" />
                    </>
                  )}
                  <span className="text-xs sm:hidden">{isUnlocked ? "Bloquear" : "Editar"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4} className="hidden md:block">
                {isUnlocked ? "Bloquear" : "Editar datos"}
              </TooltipContent>
            </Tooltip>
          )}

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    variant="outline"
                    className="size-8 shrink-0 max-sm:h-9 max-sm:w-auto max-sm:flex-1 max-sm:gap-1.5 max-sm:px-3"
                    size="icon"
                    disabled={!canSubmit || isSubmitting}
                    aria-label="Agregar item al lote"
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
          </form.Subscribe>
        </div>
      </fieldset>
    </form>
  );
}
