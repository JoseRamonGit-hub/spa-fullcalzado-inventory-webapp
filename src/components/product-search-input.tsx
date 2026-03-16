import { useState, useMemo, useTransition, useCallback, useRef, useEffect } from "react";
import { useProducts } from "@/features/inventory/hooks/useProducts";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  label?: string;
  requireStock?: boolean;
  autoFocus?: boolean;
  showPrice?: boolean;
  className?: string;
}

export function ProductSearchInput({
  value,
  onChange,
  label = "Producto",
  requireStock = false,
  autoFocus = false,
  showPrice = false,
  className,
}: ProductSearchInputProps) {
  const { data: products } = useProducts();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deferredSearch, setDeferredSearch] = useState("");
  const [, startTransition] = useTransition();

  // Prevents handleBlur from closing the list when the user
  // is clicking one of the CommandItem buttons.
  const skipBlurRef = useRef(false);
  // Ref to the [cmdk-root] element so we can forward Tab → ArrowDown
  const commandRootRef = useRef<HTMLDivElement>(null);

  // ── Filtering ──────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (val: string) => {
      setSearch(val);
      if (!open) setOpen(true);
      startTransition(() => setDeferredSearch(val));
    },
    [open, startTransition],
  );

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = deferredSearch.toLowerCase();
    return products.filter(
      (p: Product) =>
        p.active &&
        (!requireStock || p.stock > 0) &&
        (p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
    );
  }, [products, deferredSearch, requireStock]);

  const selectedProduct = useMemo(() => products?.find((p: any) => p.id === value) ?? null, [products, value]);

  // ── Select ─────────────────────────────────────────────────
  const handleSelect = useCallback(
    (productId: string) => {
      const product = products?.find((p: any) => p.id === productId);
      if (!product) return;
      onChange({
        id: product.id,
        code: product.code,
        description: product.description,
        price_usd: product.price_usd,
        stock: product.stock,
      });
      setOpen(false);
      setSearch("");
      setDeferredSearch("");
      skipBlurRef.current = false;
    },
    [products, onChange],
  );

  // ── Clear ──────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    onChange(null);
    setSearch("");
    setDeferredSearch("");
    // After React re-renders (chip → search), focus the input
    requestAnimationFrame(() => {
      // The CommandInput renders its own <input> inside [cmdk-input-wrapper]
      const input = commandRootRef.current?.querySelector<HTMLInputElement>("[cmdk-input]");
      input?.focus();
    });
  }, [onChange]);

  // ── Open/close ─────────────────────────────────────────────
  const handleFocus = useCallback(() => setOpen(true), []);

  const handleBlur = useCallback(() => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    setOpen(false);
  }, []);

  // ── Tab/Shift+Tab → ArrowDown/ArrowUp inside cmdk ──────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;
      if (e.key === "Tab") {
        e.preventDefault();
        // Dispatch Arrow event to [cmdk-root] so the built-in navigation moves
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

  // ── Auto-focus ─────────────────────────────────────────────
  useEffect(() => {
    if (autoFocus && !value) {
      requestAnimationFrame(() => {
        const input = commandRootRef.current?.querySelector<HTMLInputElement>("[cmdk-input]");
        input?.focus();
      });
    }
  }, [autoFocus, value]);

  // ── Selected chip ──────────────────────────────────────────
  if (selectedProduct) {
    return (
      <div className={className}>
        {label && (
          <label className="text-muted-foreground mb-1 block text-xs font-medium tracking-wider uppercase">
            {label}
          </label>
        )}
        <div className="bg-accent/50 flex items-center gap-2 rounded-md border px-2.5 py-1.5">
          <span className="product-code text-xs">{selectedProduct.code}</span>
          <span className="min-w-0 flex-1 truncate text-sm">{selectedProduct.description}</span>
          {showPrice && (
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {formatCurrencyUSD(selectedProduct.price_usd)}
            </span>
          )}
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            Stock: <strong className="text-foreground">{selectedProduct.stock}</strong>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground h-5 w-5 shrink-0"
            aria-label="Cambiar producto"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Search UI — single Command context, inline dropdown ────
  return (
    <div className={className}>
      {label && (
        <label className="text-muted-foreground mb-1 block text-xs font-medium tracking-wider uppercase">{label}</label>
      )}

      {/*
       * Single <Command> wraps BOTH the input AND the list.
       * This keeps them in the same cmdk context so:
       *   - Arrow keys / Enter work natively
       *   - Typing always goes to the CommandInput (focus stays here)
       *   - No separate Popover FocusScope to fight with
       *
       * The list is absolutely positioned below the input — no Portal,
       * no z-index conflicts with the Radix Dialog.
       */}
      <div className="relative">
        <Command ref={commandRootRef} shouldFilter={false} className="rounded-md border">
          <CommandInput
            placeholder="Buscar por código o descripción..."
            value={search}
            onValueChange={handleSearchChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-6 text-sm"
            autoComplete="off"
          />

          {/* Dropdown — appears below, absolutely positioned */}
          {open && (
            <div className="bg-popover custom-scrollbar absolute top-full left-0 z-50 mt-1 w-full rounded-md border shadow-md">
              <CommandList className="max-h-48 overflow-y-auto">
                <CommandEmpty className="text-muted-foreground py-4 text-center text-xs">
                  {search
                    ? "Sin resultados"
                    : requireStock
                      ? "Sin productos con stock disponible"
                      : "Escribe para buscar..."}
                </CommandEmpty>
                <CommandGroup>
                  {filtered.slice(0, 20).map((p: any) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      // mousedown fires BEFORE blur — set the flag so handleBlur
                      // knows not to close the list; onSelect resets it.
                      onMouseDown={() => {
                        skipBlurRef.current = true;
                      }}
                      onSelect={handleSelect}
                      className="flex items-center gap-2 px-2.5 py-1.5"
                    >
                      <span className="product-code text-xs">{p.code}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{p.description}</span>
                      {showPrice && (
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          {formatCurrencyUSD(p.price_usd)}
                        </span>
                      )}
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">[{p.stock}]</span>
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
