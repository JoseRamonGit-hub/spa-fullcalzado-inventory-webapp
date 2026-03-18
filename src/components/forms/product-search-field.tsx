import { useCallback } from "react";
import { useFieldContext } from "@/hooks/form";
import { ProductSearchInput, type ProductSearchResult } from "@/components/product-search-input";
import { FieldWrapper, type FormFieldProps } from "./field-wrapper";

type ProductSearchFieldProps = FormFieldProps & {
  requireStock?: boolean;
  showPrice?: boolean;
  autoFocus?: boolean;
  onAfterSelect?: (product: ProductSearchResult) => void;
  onClear?: () => void;
};

/**
 * TanStack Form field component for product search.
 * Wires `field.state.value` (product id string) and `field.handleChange`
 * into `ProductSearchInput` — same composition pattern as TextField / NumberField.
 *
 * Usage inside form.AppField:
 *   <field.ProductSearchField label="Producto" autoFocus />
 */
export function ProductSearchField({
  label,
  description,
  compact,
  requireStock = false,
  showPrice = false,
  autoFocus = false,
  onAfterSelect,
  onClear,
}: ProductSearchFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.errors.length > 0;

  const handleChange = useCallback(
    (product: ProductSearchResult | null) => {
      field.handleChange(product?.id ?? "");
      field.handleBlur(); // mark touched so validation runs
      if (product && onAfterSelect) {
        onAfterSelect(product);
      }
      if (!product && onClear) {
        onClear();
      }
    },
    [field, onAfterSelect, onClear],
  );

  return (
    <FieldWrapper label={label} description={description} compact={compact}>
      <ProductSearchInput
        value={field.state.value}
        onChange={handleChange}
        requireStock={requireStock}
        showPrice={showPrice}
        autoFocus={autoFocus}
        isInvalid={isInvalid}
      />
    </FieldWrapper>
  );
}
