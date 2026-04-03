import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useProducts } from "@/features/inventory/hooks/useProductQueries";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/index";
import { formatCurrencyUSD } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export type ProductSearchResult = {
  id: string;
  code: string;
  description: string;
  price_usd: number;
  stock: number;
};

export type ProductSearchOptions = {
  requireStock?: boolean;
  showPrice?: boolean;
  autoFocus?: boolean;
  /** When false (default), selecting an inactive product shows a warning and is blocked. */
  allowInactive?: boolean;
};

type ProductSearchProps = {
  value: string;
  onChange: (product: ProductSearchResult | null) => void;
  searchText?: string;
  onSearchTextChange?: (text: string) => void;
  onEnterWithNoResults?: () => void;
  options?: ProductSearchOptions;
  isInvalid?: boolean;
  className?: string;
};

const RESULT_LIMIT = 3;
const SHELL_CLASS_NAME = "min-h-8 w-full min-w-0";
const CONTROL_CLASS_NAME =
  "bg-card h-8 w-full rounded-md border shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]";
const INVALID_CLASS_NAME = "border-destructive ring-destructive/20 dark:ring-destructive/40";
const VALID_CLASS_NAME = "border-input";

export function toSearchResult(product: Product): ProductSearchResult {
  return {
    id: product.id,
    code: product.code,
    description: product.description,
    price_usd: product.price_usd,
    stock: product.stock,
  };
}

/** Ranks how well a product code matches the query: exact (3) > prefix (2) > contains (1) > description-only (0). */
function codeRelevance(code: string, query: string): number {
  const lower = code.toLowerCase();
  if (lower === query) return 3;
  if (lower.startsWith(query)) return 2;
  if (lower.includes(query)) return 1;
  return 0;
}

// ── Selected product chip ──────────────────────────────────────

function SelectedProductChip({
  product,
  showPrice,
  isInvalid,
  onClear,
  onKeyDown,
}: {
  product: Product;
  showPrice: boolean;
  isInvalid: boolean;
  onClear: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className={cn(
        "bg-accent/40 focus-within:border-ring focus-within:ring-ring/50 flex h-8 items-center gap-2 overflow-hidden rounded-md border px-3.5 py-1 transition-[color,box-shadow] focus-within:ring-[3px]",
        isInvalid ? INVALID_CLASS_NAME : "border-border/60",
      )}
      onKeyDown={onKeyDown}
    >
      <span className="product-code shrink-0 text-sm uppercase">{product.code}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{product.description}</span>
      {showPrice && (
        <span className="text-muted-foreground hidden shrink-0 text-xs tabular-nums sm:inline">
          {formatCurrencyUSD(product.price_usd)}
        </span>
      )}
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">Stock [{product.stock}]</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClear}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-5 shrink-0 rounded"
        aria-label="Cambiar producto (Esc / Backspace)"
      >
        <X className="size-3" aria-hidden="true" />
      </Button>
    </div>
  );
}

// ── Dropdown results list ──────────────────────────────────────

function SearchDropdown({
  products,
  showPrice,
  onMouseDown,
  onSelect,
}: {
  products: Product[];
  showPrice: boolean;
  onMouseDown: () => void;
  onSelect: (productId: string) => void;
}) {
  return (
    <div className="bg-popover absolute top-full left-0 z-50 mt-1 w-full rounded-md border shadow-lg">
      <CommandList className="max-h-44 overflow-y-auto">
        <CommandGroup>
          {products.map((product) => (
            <CommandItem
              key={product.id}
              value={product.id}
              onMouseDown={onMouseDown}
              onSelect={onSelect}
              className={cn("flex items-center gap-2 px-2.5 py-2", !product.active && "opacity-50")}
            >
              <span className="product-code text-xs uppercase">{product.code}</span>
              <span className="min-w-0 flex-1 truncate text-sm">{product.description}</span>
              {!product.active && (
                <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase">
                  Inactivo
                </span>
              )}
              {showPrice && (
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {formatCurrencyUSD(product.price_usd)}
                </span>
              )}
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">[{product.stock}]</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export function ProductSearch({
  value,
  onChange,
  searchText: controlledSearchText,
  onSearchTextChange,
  onEnterWithNoResults,
  options,
  isInvalid = false,
  className,
}: ProductSearchProps) {
  const { requireStock = false, showPrice = false, autoFocus = false, allowInactive = false } = options ?? {};
  const { data: products } = useProducts();
  const [internalSearch, setInternalSearch] = useState("");
  const isSearchControlled = controlledSearchText !== undefined;
  const search = isSearchControlled ? controlledSearchText : internalSearch;
  const [open, setOpen] = useState(false);
  const skipBlurRef = useRef(false);
  const commandRootRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products?.find((product: Product) => product.id === value) ?? null;

  const query = search.trim().toLowerCase();
  const filteredProducts =
    !products || !query
      ? []
      : products
          .filter(
            (product) =>
              (!requireStock || product.stock > 0) &&
              (product.code.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)),
          )
          .sort((a, b) => codeRelevance(b.code, query) - codeRelevance(a.code, query))
          .slice(0, RESULT_LIMIT);

  function focusInput() {
    requestAnimationFrame(() => {
      commandRootRef.current?.querySelector<HTMLInputElement>("[cmdk-input]")?.focus();
    });
  }

  function updateSearch(text: string) {
    if (!isSearchControlled) setInternalSearch(text);
    onSearchTextChange?.(text);
  }

  function handleSelect(productId: string) {
    const product = products?.find((item) => item.id === productId);
    if (!product) return;

    if (!product.active && !allowInactive) {
      toast.warning("Este producto está inactivo y no puede recibir cargas de inventario.");
      return;
    }

    onChange(toSearchResult(product));
    skipBlurRef.current = false;
    updateSearch("");
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    updateSearch("");
    setOpen(false);
  }

  function handleInputBlur() {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    setOpen(false);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "Enter" && filteredProducts.length === 0 && search.trim()) {
      event.preventDefault();
      setOpen(false);
      onEnterWithNoResults?.();
      return;
    }

    if (event.key === "Tab" && open) {
      setOpen(false);
    }
  }

  function handleChipKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" && event.key !== "Backspace" && event.key !== "Delete") return;
    event.preventDefault();
    handleClear();
  }

  useEffect(() => {
    if (!autoFocus || selectedProduct) return;
    focusInput();
  }, [autoFocus, selectedProduct]);

  if (selectedProduct) {
    return (
      <div className={cn(SHELL_CLASS_NAME, className)}>
        <SelectedProductChip
          product={selectedProduct}
          showPrice={showPrice}
          isInvalid={isInvalid}
          onClear={handleClear}
          onKeyDown={handleChipKeyDown}
        />
      </div>
    );
  }

  const showDropdown = open && search.length > 0 && filteredProducts.length > 0;

  return (
    <div className={cn(SHELL_CLASS_NAME, className)}>
      <div className="relative">
        <Command
          ref={commandRootRef}
          shouldFilter={false}
          className={cn(
            CONTROL_CLASS_NAME,
            "**:data-[slot=command-input-wrapper]:h-full **:data-[slot=command-input-wrapper]:border-b-0",
            "**:data-[slot=command-input]:h-full **:data-[slot=command-input]:py-0",
            isInvalid ? INVALID_CLASS_NAME : VALID_CLASS_NAME,
          )}
        >
          <CommandInput
            placeholder="Buscar por código o descripción…"
            value={search}
            onValueChange={(v) => {
              updateSearch(v);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="text-sm"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {showDropdown && (
            <SearchDropdown
              products={filteredProducts}
              showPrice={showPrice}
              onMouseDown={() => {
                skipBlurRef.current = true;
              }}
              onSelect={handleSelect}
            />
          )}
        </Command>
      </div>
    </div>
  );
}
