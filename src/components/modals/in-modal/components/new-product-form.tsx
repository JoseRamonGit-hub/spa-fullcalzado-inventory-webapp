import { useCallback } from "react";
import { useAppForm } from "@/hooks/form";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import type { NewBatchItem } from "../columns";

const REQUIRED_FIELD_ERROR = "Requerido";
const INVALID_NUMBER_ERROR = "Inválido";
const MINIMUM_VALUE_ERROR = "Mín. 1";
const MINIMUM_ALLOWED_PRICE = 0;
const MINIMUM_ALLOWED_STOCK = 1;

interface NewProductFormProps {
  onAddPendingBatchItem: (item: NewBatchItem) => void;
}

export function NewProductForm({ onAddPendingBatchItem }: NewProductFormProps) {
  const newProductForm = useAppForm({
    defaultValues: {
      code: "",
      description: "",
      priceUsd: "" as unknown as number,
      initialStock: "" as unknown as number,
    },
    onSubmit: async ({ value }) => {
      const newPendingItem: NewBatchItem = {
        tempId: crypto.randomUUID(),
        kind: "new",
        code: value.code.trim(),
        description: value.description.trim(),
        priceUsd: value.priceUsd,
        initialStock: value.initialStock,
      };
      onAddPendingBatchItem(newPendingItem);
      newProductForm.reset();

      // Return focus to the code input field
      requestAnimationFrame(() => {
        const codeInputHtmlElement = document.querySelector<HTMLInputElement>('input[name="code"]');
        codeInputHtmlElement?.focus();
      });
    },
  });

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();
      newProductForm.handleSubmit();
    },
    [newProductForm],
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-3">
      <fieldset className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-[1fr_2fr_auto_auto_auto]">
        <div className="col-span-2 sm:col-span-1">
          <newProductForm.AppField
            name="code"
            validators={{
              onChange: ({ value }) => (!value ? REQUIRED_FIELD_ERROR : undefined),
            }}
          >
            {(field) => (
              <field.TextField
                label="Código"
                compact
                placeholder="SKU-001"
                required
                autoFocus
                className="h-8 text-sm uppercase"
                autoComplete="off"
              />
            )}
          </newProductForm.AppField>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <newProductForm.AppField
            name="description"
            validators={{
              onChange: ({ value }) => (!value ? REQUIRED_FIELD_ERROR : undefined),
            }}
          >
            {(field) => (
              <field.TextField
                label="Descripción"
                compact
                placeholder="Zapato deportivo negro T42"
                required
                className="h-8 text-sm"
                autoComplete="off"
              />
            )}
          </newProductForm.AppField>
        </div>

        <div className="col-span-1 sm:col-span-1">
          <newProductForm.AppField
            name="priceUsd"
            validators={{
              onChange: ({ value }) => {
                const isValueEmpty = value === undefined || value === null || String(value) === "";
                if (isValueEmpty) return REQUIRED_FIELD_ERROR;
                if (value < MINIMUM_ALLOWED_PRICE) return INVALID_NUMBER_ERROR;
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.NumberField
                label="Precio USD"
                compact
                step="0.01"
                min={String(MINIMUM_ALLOWED_PRICE)}
                placeholder="0.00"
                required
                className="h-8 text-sm tabular-nums"
              />
            )}
          </newProductForm.AppField>
        </div>

        <div className="col-span-1 sm:col-span-1">
          <newProductForm.AppField
            name="initialStock"
            validators={{
              onChange: ({ value }) => {
                const isValueEmpty = value === undefined || value === null || String(value) === "";
                if (isValueEmpty) return REQUIRED_FIELD_ERROR;
                if (value < MINIMUM_ALLOWED_STOCK) return MINIMUM_VALUE_ERROR;
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.NumberField
                label="Stock"
                compact
                min={String(MINIMUM_ALLOWED_STOCK)}
                step="1"
                placeholder="0"
                required
                className="h-8 text-sm tabular-nums"
              />
            )}
          </newProductForm.AppField>
        </div>

        <div className="col-span-2 flex items-end sm:col-span-1">
          <newProductForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
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
          </newProductForm.Subscribe>
        </div>
      </fieldset>
    </form>
  );
}
