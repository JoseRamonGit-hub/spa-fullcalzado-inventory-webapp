import { useAppForm } from "@/hooks/form";
import { useCreateProduct } from "@/features/inventory/hooks";
import { Button } from "@/components/ui/button";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";

interface NewProductFormProps {
  onSuccess: () => void;
}

export function NewProductForm({ onSuccess }: NewProductFormProps) {
  const createProduct = useCreateProduct();

  const form = useAppForm({
    defaultValues: {
      code: "",
      description: "",
      price_usd: "" as unknown as number, // Start empty but treat as number
      stock: "" as unknown as number,
    },
    onSubmit: async ({ value }) => {
      const promise = createProduct.mutateAsync({
        code: value.code.trim(),
        description: value.description.trim(),
        price_usd: value.price_usd,
        stock: value.stock,
      });

      toast.promise(promise, {
        loading: "Registrando producto...",
        success: "Producto creado correctamente",
        error: "Error al crear el producto",
      });

      await promise;
      form.reset();
      onSuccess();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <form.AppField
          name="code"
          validators={{
            onChange: ({ value }) => (!value ? "El código es requerido" : undefined),
          }}
        >
          {(field) => (
            <field.TextField
              label="Código"
              placeholder="SKU-001"
              required
              autoFocus
              className="h-9 text-sm"
            />
          )}
        </form.AppField>
      </div>

      <div className="space-y-1.5">
        <form.AppField
          name="description"
          validators={{
            onChange: ({ value }) => (!value ? "La descripción es requerida" : undefined),
          }}
        >
          {(field) => (
            <field.TextField
              label="Descripción"
              placeholder="Zapato deportivo negro T42"
              required
              className="h-9 text-sm"
            />
          )}
        </form.AppField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <form.AppField
            name="price_usd"
            validators={{
              onChange: ({ value }) => {
                if (value === undefined || value === null || String(value) === "") return "El precio es requerido";
                if (value < 0) return "El precio no puede ser negativo";
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
                className="h-9 text-sm tabular-nums"
              />
            )}
          </form.AppField>
        </div>

        <div className="space-y-1.5">
          <form.AppField
            name="stock"
            validators={{
              onChange: ({ value }) => {
                if (value === undefined || value === null || String(value) === "") return "El stock es requerido";
                if (value < 1) return "El stock debe ser al menos 1";
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
                className="h-9 text-sm tabular-nums"
              />
            )}
          </form.AppField>
        </div>
      </div>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="h-9 w-full gap-2" disabled={!canSubmit || isSubmitting || createProduct.isPending}>
            <PackagePlus className="h-4 w-4" />
            {isSubmitting || createProduct.isPending ? "Guardando..." : "Guardar"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
