import { useCallback } from "react";
import { useFieldContext } from "@/hooks/form";
import { ProductSearch, type ProductSearchResult } from "@/components/product-search";
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
 * Keeps the form-aware adapter thin and delegates UI/search behavior to ProductSearch.
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
      <ProductSearch
        value={field.state.value}
        onChange={handleChange}
        options={{ requireStock, showPrice, autoFocus }}
        isInvalid={isInvalid}
      />
    </FieldWrapper>
  );
}
