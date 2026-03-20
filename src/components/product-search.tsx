import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useProducts } from "@/features/inventory/hooks/useProducts";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/index";
import { formatCurrencyUSD } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export interface ProductSearchResult {
  id: string;
  code: string;
  description: string;
  price_usd: number;
  stock: number;
}

interface ProductSearchOptions {
  requireStock?: boolean;
  showPrice?: boolean;
  autoFocus?: boolean;
}

interface ProductSearchProps {
  value: string;
  onChange: (product: ProductSearchResult | null) => void;
  searchText?: string;
  onSearchTextChange?: (text: string) => void;
  onEnterWithNoResults?: () => void;
  options?: ProductSearchOptions;
  isInvalid?: boolean;
  className?: string;
}

const RESULT_LIMIT = 3;
const SHELL_CLASS_NAME = "min-h-8 w-full min-w-0";
const CONTROL_CLASS_NAME =
  "bg-card h-8 w-full rounded-md border shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]";
const INVALID_CLASS_NAME = "border-destructive ring-destructive/20 dark:ring-destructive/40";
const VALID_CLASS_NAME = "border-input";

function toSearchResult(product: Product): ProductSearchResult {
  return {
    id: product.id,
    code: product.code,
    description: product.description,
    price_usd: product.price_usd,
    stock: product.stock,
  };
}

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
  const { requireStock = false, showPrice = false, autoFocus = false } = options ?? {};
  const { data: products } = useProducts();
  const [internalSearch, setInternalSearch] = useState("");
  const isSearchControlled = controlledSearchText !== undefined;
  const search = isSearchControlled ? controlledSearchText : internalSearch;
  const [open, setOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const skipBlurRef = useRef(false);
  const commandRootRef = useRef<HTMLDivElement>(null);
  const filteredCountRef = useRef(0);

  const selectedProduct = useMemo(
    () => products?.find((product: Product) => product.id === value) ?? null,
    [products, value],
  );

  const filteredProducts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!products || !query) return [];

    return products
      .filter(
        (product) =>
          product.active &&
          (!requireStock || product.stock > 0) &&
          (product.code.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)),
      )
      .slice(0, RESULT_LIMIT);
  }, [deferredSearch, products, requireStock]);

  filteredCountRef.current = filteredProducts.length;

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      commandRootRef.current?.querySelector<HTMLInputElement>("[cmdk-input]")?.focus();
    });
  }, []);

  const handleSearchChange = useCallback(
    (nextValue: string) => {
      if (!isSearchControlled) {
        setInternalSearch(nextValue);
      }
      setOpen(true);
      onSearchTextChange?.(nextValue);
    },
    [isSearchControlled, onSearchTextChange],
  );

  const handleSelect = useCallback(
    (productId: string) => {
      const product = products?.find((item) => item.id === productId);
      if (!product) return;

      onChange(toSearchResult(product));
      skipBlurRef.current = false;
      if (!isSearchControlled) {
        setInternalSearch("");
      }
      setOpen(false);
      onSearchTextChange?.("");
    },
    [onChange, products, isSearchControlled, onSearchTextChange],
  );

  const handleClear = useCallback(() => {
    onChange(null);
    if (!isSearchControlled) {
      setInternalSearch("");
    }
    setOpen(false);
    onSearchTextChange?.("");
  }, [onChange, isSearchControlled, onSearchTextChange]);

  const handleInputFocus = useCallback(() => {
    setOpen(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }

    setOpen(false);
  }, []);

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      // Enter with no results → signal parent to continue as new product
      if (event.key === "Enter" && filteredCountRef.current === 0 && search.trim()) {
        event.preventDefault();
        setOpen(false);
        onEnterWithNoResults?.();
        return;
      }

      if (!open || event.key !== "Tab") return;

      // Allow Tab to leave the field when there are no results (UXR-008)
      if (filteredCountRef.current === 0) {
        setOpen(false);
        return;
      }

      event.preventDefault();
      commandRootRef.current?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: event.shiftKey ? "ArrowUp" : "ArrowDown",
          bubbles: true,
          cancelable: true,
        }),
      );
    },
    [open, search, onEnterWithNoResults],
  );

  const handleChipKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Escape" && event.key !== "Backspace" && event.key !== "Delete") return;

      event.preventDefault();
      handleClear();
    },
    [handleClear],
  );

  useEffect(() => {
    if (!autoFocus || selectedProduct) return;
    focusInput();
  }, [autoFocus, focusInput, selectedProduct]);

  if (selectedProduct) {
    return (
      <div className={cn(SHELL_CLASS_NAME, className)}>
        <div
          className={cn(
            "bg-accent/40 focus-within:border-ring focus-within:ring-ring/50 flex h-8 items-center gap-2 overflow-hidden rounded-md border px-2.5 py-1 transition-[color,box-shadow] focus-within:ring-[3px]",
            isInvalid ? INVALID_CLASS_NAME : "border-border/60",
          )}
          onKeyDown={handleChipKeyDown}
        >
          <span className="bg-muted text-muted-foreground max-w-16 shrink-0 truncate rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase">
            {selectedProduct.code}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{selectedProduct.description}</span>
          {showPrice && (
            <span className="text-muted-foreground hidden shrink-0 text-xs tabular-nums sm:inline">
              {formatCurrencyUSD(selectedProduct.price_usd)}
            </span>
          )}
          <span className="text-muted-foreground hidden shrink-0 text-[11px] tabular-nums md:inline">
            Stock: <strong className="text-foreground font-semibold">{selectedProduct.stock}</strong>
          </span>
          <Button
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
            onValueChange={handleSearchChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="text-sm"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {showDropdown && (
            <div className="bg-popover absolute top-full left-0 z-50 mt-1 w-full rounded-md border shadow-lg">
              <CommandList className="max-h-44 overflow-y-auto">
<CommandGroup>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onMouseDown={() => {
                        skipBlurRef.current = true;
                      }}
                      onSelect={handleSelect}
                      className="flex items-center gap-2 px-2.5 py-2"
                    >
                      <span className="product-code bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase">
                        {product.code}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{product.description}</span>
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
          )}
        </Command>
      </div>
    </div>
  );
}
