import { useState } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useUpdateProduct } from "@/features/inventory/hooks/useProducts";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { toast } from "sonner";
import type { Product } from "@/types";

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export function EditProductModal({ open, onOpenChange, product }: EditProductModalProps) {
  const updateProduct = useUpdateProduct();
  const currentUser = useAuthStore((state) => state.user);

  const [code, setCode] = useState(product.code);
  const [description, setDescription] = useState(product.description);
  const [priceUsd, setPriceUsd] = useState(String(product.price_usd));
  const [stock, setStock] = useState(String(product.stock));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const promise = updateProduct.mutateAsync({
      p_product_id: product.id,
      p_code: code.trim(),
      p_description: description.trim(),
      p_price_usd: parseFloat(priceUsd),
      p_stock: parseInt(stock),
      p_user_id: currentUser.id,
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Código</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-9 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Descripción</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-9 text-sm"
            required
          />
        </div>
        <fieldset className="m-0 grid grid-cols-2 gap-3 border-0 p-0">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Precio USD</label>
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
            <label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Stock</label>
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
        </fieldset>
        <Button type="submit" className="mt-2 h-9 w-full gap-2" disabled={updateProduct.isPending}>
          <Pencil className="h-4 w-4" />
          {updateProduct.isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </ResponsiveModal>
  );
}
