import { useCallback } from "react";
import { useAppForm } from "@/hooks/form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { NewBatchItem } from "../columns";

interface NewProductFormProps {
  onAddToBatch: (item: NewBatchItem) => void;
}

export function NewProductForm({ onAddToBatch }: NewProductFormProps) {
  const form = useAppForm({
    defaultValues: {
      code: "",
      description: "",
      price_usd: "" as unknown as number,
      stock: "" as unknown as number,
    },
    onSubmit: async ({ value }) => {
      const newItem: NewBatchItem = {
        _tempId: crypto.randomUUID(),
        _kind: "new",
        code: value.code.trim(),
        description: value.description.trim(),
        price_usd: value.price_usd,
        stock: value.stock,
      };
      onAddToBatch(newItem);
      form.reset();

      // Devolver el foco al campo código
      requestAnimationFrame(() => {
        const codeInput = document.querySelector<HTMLInputElement>('input[name="code"]');
        codeInput?.focus();
      });
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto_auto_auto]">
        <form.AppField
          name="code"
          validators={{
            onChange: ({ value }) => (!value ? "Requerido" : undefined),
          }}
        >
          {(field) => (
            <field.TextField
              label="Código"
              placeholder="SKU-001"
              required
              autoFocus
              className="h-8 text-sm"
            />
          )}
        </form.AppField>

        <form.AppField
          name="description"
          validators={{
            onChange: ({ value }) => (!value ? "Requerido" : undefined),
          }}
        >
          {(field) => (
            <field.TextField
              label="Descripción"
              placeholder="Zapato deportivo negro T42"
              required
              className="h-8 text-sm"
            />
          )}
        </form.AppField>

        <form.AppField
          name="price_usd"
          validators={{
            onChange: ({ value }) => {
              if (value === undefined || value === null || String(value) === "") return "Requerido";
              if (value < 0) return "Inválido";
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.NumberField
              label="Precio USD"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              className="h-8 text-sm tabular-nums"
            />
          )}
        </form.AppField>

        <form.AppField
          name="stock"
          validators={{
            onChange: ({ value }) => {
              if (value === undefined || value === null || String(value) === "") return "Requerido";
              if (value < 1) return "Mín. 1";
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.NumberField
              label="Stock"
              min="1"
              step="1"
              placeholder="0"
              required
              className="h-8 text-sm tabular-nums"
            />
          )}
        </form.AppField>

        <div className="flex items-end">
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0"
                disabled={!canSubmit || isSubmitting}
                aria-label="Agregar item al lote"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>
    </form>
  );
}
