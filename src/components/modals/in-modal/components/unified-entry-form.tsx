import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Lock, LockOpen } from "lucide-react";
import { useAppForm } from "@/hooks/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { ProductSearchResult } from "@/components/product-search";
import { useProductLookup } from "@/components/modals/shared/product-selection";
import type { BatchItem, NewBatchItem, ExistingBatchItem } from "../columns";

const REQUIRED = "Requerido";
const INVALID = "Inválido";
const MIN_1 = "Mín. 1";
const MIN_PRICE = 0;
const MIN_QUANTITY = 1;

interface UnifiedEntryFormProps {
  pendingBatchItems: BatchItem[];
  onAddPendingBatchItem: (item: BatchItem) => void;
}

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
      priceUsd: "" as unknown as number,
      quantityOrInitialStock: "" as unknown as number,
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

        const editedPrice = isUnlocked ? (value.priceUsd as number) : undefined;
        const hasPriceChange = editedPrice != null && editedPrice !== product.price_usd;

        const item: ExistingBatchItem = {
          tempId: crypto.randomUUID(),
          kind: "existing",
          productId: product.id,
          code: product.code,
          description: isUnlocked ? value.description.trim() : product.description,
          addedQuantity: value.quantityOrInitialStock as number,
          currentStock: product.stock,
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
          priceUsd: value.priceUsd as number,
          initialStock: value.quantityOrInitialStock as number,
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

  const focusField = useCallback(
    (name: string) => {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.focus();
      });
    },
    [],
  );

  const handleEnterWithNoResults = useCallback(() => {
    focusField("description");
  }, [focusField]);

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleAfterProductSelect = useCallback(
    (product: ProductSearchResult) => {
      setSelectedProduct(product);
      setSearchText("");
      form.setFieldValue("description", product.description);
      form.setFieldValue("priceUsd", product.price_usd);
      setIsUnlocked(false);

      focusField("quantityOrInitialStock");
    },
    [form, focusField],
  );

  const handleProductClear = useCallback(() => {
    setSelectedProduct(null);
    setSearchText("");
    form.setFieldValue("description", "");
    form.setFieldValue("priceUsd", "" as unknown as number);
    setIsUnlocked(false);
  }, [form]);

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  const isFieldLocked = isExistingMode && !isUnlocked;

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-3">
      {/* Row 1: Product search + mode badge */}
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
        <div className="flex h-8 items-center">
          {isExistingMode ? (
            <Badge variant="secondary" className="whitespace-nowrap text-[10px]">
              Producto existente
            </Badge>
          ) : searchText.trim() ? (
            <Badge variant="outline" className="whitespace-nowrap text-[10px]">
              Nuevo producto
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Row 2: Description + Price + Quantity + Unlock + Submit */}
      <fieldset className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-[2fr_auto_auto_auto_auto]">
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

        {isExistingMode && (
          <div className="flex items-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isUnlocked ? "secondary" : "outline"}
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => setIsUnlocked((prev) => !prev)}
                  aria-label={isUnlocked ? "Bloquear datos del producto" : "Editar datos del producto"}
                >
                  {isUnlocked ? (
                    <LockOpen className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Lock className="size-3.5" aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4} className="hidden md:block">
                {isUnlocked ? "Bloquear" : "Editar datos"}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <div className="col-span-2 flex items-end sm:col-span-1">
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
                    aria-label="Agregar item al lote"
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
