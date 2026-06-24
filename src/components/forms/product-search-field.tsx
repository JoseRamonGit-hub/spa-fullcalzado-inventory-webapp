import { useFieldContext } from "@/hooks/form";
import { ProductSearch } from "@/components/product-search";
import type { ProductSearchOptions, ProductSearchResult } from "@/components/product-search/types";
import { FieldWrapper, type FormFieldProps } from "./field-wrapper";

type ProductSearchFieldProps = FormFieldProps &
  ProductSearchOptions &
  Omit<React.ComponentProps<typeof ProductSearch>, "value" | "onChange" | "isInvalid" | "options"> & {
    onAfterSelect?: (product: ProductSearchResult) => void;
    onClear?: () => void;
  };

export function ProductSearchField({
  label,
  description,
  compact,
  onAfterSelect,
  onClear,
  requireStock,
  showPrice,
  autoFocus,
  allowInactive,
  ...searchProps
}: ProductSearchFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const options: ProductSearchOptions = { requireStock, showPrice, autoFocus, allowInactive };

  function handleChange(product: ProductSearchResult | null) {
    field.handleChange(product?.id ?? "");
    field.handleBlur();
    if (product) onAfterSelect?.(product);
    else onClear?.();
  }

  return (
    <FieldWrapper label={label} description={description} compact={compact}>
      <ProductSearch
        {...searchProps}
        options={options}
        value={field.state.value}
        onChange={handleChange}
        isInvalid={isInvalid}
      />
    </FieldWrapper>
  );
}
