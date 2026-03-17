import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useProducts } from "@/features/inventory/hooks/useProducts";
import { ProductCommandSearch } from "@/components/product-command-search";
import { Button } from "@/components/ui/button";
import { formatCurrencyUSD } from "@/utils/formatters";
import { X } from "lucide-react";
import type { Product } from "@/types/index";

export interface ProductSearchResult {
  id: string;
  code: string;
  description: string;
  price_usd: number;
  stock: number;
}

interface ProductSearchInputProps {
  value: string;
  onChange: (product: ProductSearchResult | null) => void;
  requireStock?: boolean;
  autoFocus?: boolean;
  showPrice?: boolean;
  isInvalid?: boolean;
  className?: string;
}

export function ProductSearchInput({
  value,
  onChange,
  requireStock = false,
  autoFocus = false,
  showPrice = false,
  isInvalid = false,
  className,
}: ProductSearchInputProps) {
  const { data: products } = useProducts();

  const clearBtnRef = useRef<HTMLButtonElement>(null);

  const selectedProduct = products?.find((p: Product) => p.id === value) ?? null;

  // After selection, we yield focus control to the parent (e.g., to focus a quantity input).
  const handleSelect = useCallback(
    (product: ProductSearchResult) => {
      onChange(product);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  // Esc / Backspace / Delete on the chip area → clear product
  const handleChipKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleClear();
      }
    },
    [handleClear],
  );

  // ── Selected chip ──────────────────────────────────────────
  if (selectedProduct) {
    return (
      <div className={className}>
        <div
          className={cn(
            "flex min-h-9 items-center gap-2 rounded-md border bg-accent/40 px-2.5 py-1 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
            isInvalid
              ? "border-destructive ring-destructive/20 dark:ring-destructive/40"
              : "border-border/60",
          )}
          onKeyDown={handleChipKeyDown}
        >
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
            {selectedProduct.code}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {selectedProduct.description}
          </span>
          {showPrice && (
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {formatCurrencyUSD(selectedProduct.price_usd)}
            </span>
          )}
          <span className="text-muted-foreground shrink-0 tabular-nums text-[11px]">
            Stock:{" "}
            <strong className="text-foreground font-semibold">{selectedProduct.stock}</strong>
          </span>
          <Button
            ref={clearBtnRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-5 shrink-0 rounded"
            aria-label="Cambiar producto (Esc / Backspace)"
          >
            <X className="size-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Search UI ─────────────────────────────────────────────
  return (
    <div className={className}>
      <ProductCommandSearch
        products={products}
        requireStock={requireStock}
        showPrice={showPrice}
        autoFocus={autoFocus}
        isInvalid={isInvalid}
        onSelect={handleSelect}
      />
    </div>
  );
}
