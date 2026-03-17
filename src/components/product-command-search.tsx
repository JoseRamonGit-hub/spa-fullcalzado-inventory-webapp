import { useState, useMemo, useTransition, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { Product } from "@/types/index";
import type { ProductSearchResult } from "./product-search-input";

interface ProductCommandSearchProps {
  products: Product[] | undefined;
  requireStock: boolean;
  showPrice: boolean;
  autoFocus: boolean;
  isInvalid?: boolean;
  onSelect: (product: ProductSearchResult) => void;
}

export function ProductCommandSearch({
  products,
  requireStock,
  showPrice,
  autoFocus,
  isInvalid = false,
  onSelect,
}: ProductCommandSearchProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [deferredSearch, setDeferredSearch] = useState("");

  // Prevents handleBlur from firing when user clicks a list item
  const skipBlurRef = useRef(false);
  const commandRootRef = useRef<HTMLDivElement>(null);

  // ── Filtering ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!products || !deferredSearch) return [];
    const q = deferredSearch.toLowerCase();
    return products
      .filter(
        (p) =>
          p.active &&
          (!requireStock || p.stock > 0) &&
          (p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
      )
      .slice(0, 3);
  }, [products, deferredSearch, requireStock]);

  // ── Handlers ──────────────────────────────────────────────
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    setOpen(true);
    startTransition(() => setDeferredSearch(val));
  }, []);

  const handleSelect = useCallback(
    (productId: string) => {
      const product = products?.find((p) => p.id === productId);
      if (!product) return;
      onSelect({
        id: product.id,
        code: product.code,
        description: product.description,
        price_usd: product.price_usd,
        stock: product.stock,
      });
      skipBlurRef.current = false;
      setSearch("");
      setDeferredSearch("");
      setOpen(false);
    },
    [products, onSelect],
  );

  const handleFocus = useCallback(() => setOpen(true), []);

  const handleBlur = useCallback(() => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    setOpen(false);
  }, []);

  // Tab → ArrowDown / Shift+Tab → ArrowUp inside cmdk
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;
      if (e.key === "Tab") {
        e.preventDefault();
        commandRootRef.current?.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: e.shiftKey ? "ArrowUp" : "ArrowDown",
            bubbles: true,
            cancelable: true,
          }),
        );
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
    [open],
  );

  // ── Auto-focus ────────────────────────────────────────────
  useEffect(() => {
    if (!autoFocus) return;
    requestAnimationFrame(() => {
      commandRootRef.current?.querySelector<HTMLInputElement>("[cmdk-input]")?.focus();
    });
  }, [autoFocus]);

  const showDropdown = open && search.length > 0;

  return (
    <div className="relative">
      <Command
        ref={commandRootRef}
        shouldFilter={false}
        className={cn(
          // Match Input sizing & shape
          "h-9 w-full rounded-md border bg-card shadow-xs transition-[color,box-shadow]",
          // Remove the internal border-b that CommandInput adds (we use the outer border only)
          "**:data-[slot=command-input-wrapper]:border-b-0",
          // Focus ring — same as Input's focus-visible ring
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          // Invalid state — same as Input's aria-invalid ring
          isInvalid
            ? "border-destructive ring-destructive/20 dark:ring-destructive/40"
            : "border-input",
        )}
      >
        <CommandInput
          placeholder="Buscar por código o descripción…"
          value={search}
          onValueChange={handleSearchChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="text-sm"
          autoComplete="off"
        />

        {showDropdown && (
          <div className="bg-popover absolute top-full left-0 z-50 mt-1 w-full rounded-md border shadow-lg">
            <CommandList className="max-h-44 overflow-y-auto">
              <CommandEmpty className="text-muted-foreground py-4 text-center text-xs">
                Sin resultados
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onMouseDown={() => {
                      skipBlurRef.current = true;
                    }}
                    onSelect={handleSelect}
                    className="flex items-center gap-2 px-2.5 py-2"
                  >
                    <span className="product-code bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                      {p.code}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{p.description}</span>
                    {showPrice && (
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {formatCurrencyUSD(p.price_usd)}
                      </span>
                    )}
                    <span className="text-muted-foreground shrink-0 tabular-nums text-[11px]">
                      [{p.stock}]
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}
