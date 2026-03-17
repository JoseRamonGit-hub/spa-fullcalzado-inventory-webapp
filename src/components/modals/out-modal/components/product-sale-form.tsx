import { useState, useRef, useEffect, useCallback } from "react";
import { ProductSearchInput, type ProductSearchResult } from "@/components/product-search-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingSale } from "../columns";

const DECIMAL_RADIX = 10;
const MINIMUM_QUANTITY = 1;
const DEFAULT_VALUE = 0;

interface ProductSaleFormProps {
  currentExchangeRate: number;
  onAddPendingSale: (sale: PendingSale) => void;
}

export function ProductSaleForm({ currentExchangeRate, onAddPendingSale }: ProductSaleFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [quantityInput, setQuantityInput] = useState("");
  
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Focus quantity input automatically when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      requestAnimationFrame(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      });
    }
  }, [selectedProduct]);

  const parsedQuantity = parseInt(quantityInput, DECIMAL_RADIX) || DEFAULT_VALUE;
  const productPriceUsd = selectedProduct?.price_usd ?? DEFAULT_VALUE;
  const calculatedPriceVes = productPriceUsd * currentExchangeRate;
  
  const hasInsufficientStock = selectedProduct ? parsedQuantity > selectedProduct.stock : false;
  const isQuantityValid = quantityInput && parsedQuantity >= MINIMUM_QUANTITY;
  const canAddProductToSale = isQuantityValid && !hasInsufficientStock && selectedProduct;

  const handleProductChange = useCallback((product: ProductSearchResult | null) => {
    setSelectedProduct(product);
    setQuantityInput("");
  }, []);

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canAddProductToSale) return;

    const newPendingSale: PendingSale = {
      _tempId: crypto.randomUUID(),
      productId: selectedProduct.id,
      code: selectedProduct.code,
      description: selectedProduct.description,
      quantity: parsedQuantity,
      priceUsd: productPriceUsd,
      priceVes: calculatedPriceVes,
      totalUsd: parsedQuantity * productPriceUsd,
      totalVes: parsedQuantity * calculatedPriceVes,
      availableStock: selectedProduct.stock,
    };

    onAddPendingSale(newPendingSale);
    setSelectedProduct(null);
    setQuantityInput("");
  };

  if (!selectedProduct) {
    return (
      <section className="space-y-1.5">
        <label className="text-muted-foreground block text-[11px] font-semibold tracking-widest uppercase">
          Seleccionar Producto
        </label>
        <ProductSearchInput
          value=""
          onChange={handleProductChange}
          requireStock
          showPrice
          autoFocus
        />
      </section>
    );
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <fieldset className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
        {/* Selected product chip */}
        <div className="min-w-0 flex-1">
          <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-widest uppercase">
            Producto
          </label>
          <ProductSearchInput
            value={selectedProduct.id}
            onChange={handleProductChange}
            showPrice
          />
        </div>

        {/* Quantity input + add button */}
        <div className="flex items-end gap-2">
          <div className="relative w-32 shrink-0">
            <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-widest uppercase">
              Cantidad
            </label>
            <Input
              ref={quantityInputRef}
              type="number"
              min={String(MINIMUM_QUANTITY)}
              max={selectedProduct.stock}
              step="1"
              placeholder="0"
              value={quantityInput}
              onChange={(event) => setQuantityInput(event.target.value)}
              className="h-9 text-sm tabular-nums"
              required
            />

            {/* Error flotante solido */}
            {hasInsufficientStock && (
              <div className="animate-in fade-in slide-in-from-top-1 absolute top-full left-0 z-20 mt-1.5 w-full">
                <p className="bg-background border-destructive/20 text-destructive rounded border px-2 py-1 text-[10.5px] leading-tight font-medium shadow-sm">
                  Stock insuficiente (disponible: {selectedProduct.stock})
                </p>
              </div>
            )}

            {/* Totales flotantes solidos */}
            {parsedQuantity > 0 && !hasInsufficientStock && (
              <div className="bg-popover text-popover-foreground animate-in fade-in slide-in-from-top-1 absolute top-full left-0 z-20 mt-1.5 flex w-full flex-col rounded-md border px-2 py-1.5 text-[11px] shadow-md">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px]">USD</span>
                  <span className="font-semibold tabular-nums">{formatCurrencyUSD(parsedQuantity * productPriceUsd)}</span>
                </div>
                <div className="border-border/50 flex items-center justify-between border-t pt-1">
                  <span className="text-muted-foreground text-[10px]">Bs</span>
                  <span className="font-medium tabular-nums">{formatCurrencyVES(parsedQuantity * calculatedPriceVes)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button type="submit" className="h-9 shrink-0 px-3" disabled={!canAddProductToSale}>
              Agregar
            </Button>
            <Kbd className="hidden opacity-50 shadow-none select-none md:inline-flex" aria-hidden="true">
              Enter
            </Kbd>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
