import { useState } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useUpdateProduct } from "@/features/inventory/hooks";
import { toast } from "sonner";
import type { Product } from "@/types";

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export function EditProductModal({ open, onOpenChange, product }: EditProductModalProps) {
  const updateProduct = useUpdateProduct();

  const [code, setCode] = useState(product.code);
  const [description, setDescription] = useState(product.description);
  const [priceUsd, setPriceUsd] = useState(String(product.price_usd));
  const [stock, setStock] = useState(String(product.stock));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const promise = updateProduct.mutateAsync({
      id: product.id,
      payload: {
        code: code.trim(),
        description: description.trim(),
        price_usd: parseFloat(priceUsd),
        stock: parseInt(stock),
      },
    });

    toast.promise(promise, {
      loading: "Actualizando producto...",
      success: "Producto actualizado correctamente",
      error: "Error al actualizar el producto",
    });

    promise.then(() => onOpenChange(false));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCode(product.code);
      setDescription(product.description);
      setPriceUsd(String(product.price_usd));
      setStock(String(product.stock));
    }
    onOpenChange(open);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={handleOpenChange} title="Editar Producto">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Código</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-9 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Descripción</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-9 text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Precio USD</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              className="h-9 text-sm tabular-nums"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stock</label>
            <Input
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="h-9 text-sm tabular-nums"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-9 gap-2" disabled={updateProduct.isPending}>
          <Pencil className="h-4 w-4" />
          {updateProduct.isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </ResponsiveModal>
  );
}
