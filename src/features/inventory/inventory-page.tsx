import { useState, useTransition, useCallback, useMemo } from "react";
import { useProducts } from "./hooks";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { EditProductModal } from "./components/edit-product-modal";
import { DeleteProductModal } from "./components/delete-product-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types";

export function InventoryPage() {
  const { data: products, isLoading, isError } = useProducts();
  const isMobile = useIsMobile();

  // Search + filtering with useTransition for non-blocking UI
  const [search, setSearch] = useState("");
  const [filteredSearch, setFilteredSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [, startTransition] = useTransition();

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      startTransition(() => {
        setFilteredSearch(value);
      });
    },
    [startTransition],
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;

    // Text filter
    if (filteredSearch) {
      const q = filteredSearch.toLowerCase();
      result = result.filter((p) => p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // Stock filter
    if (stockFilter === "in-stock") {
      result = result.filter((p) => p.stock > 0);
    } else if (stockFilter === "no-stock") {
      result = result.filter((p) => p.stock === 0);
    }

    return result;
  }, [products, filteredSearch, stockFilter]);

  // Action modals state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  // Mobile row-click drawer
  const [mobileActionProduct, setMobileActionProduct] = useState<Product | null>(null);

  const handleRowClick = useCallback(
    (product: Product) => {
      if (isMobile) {
        setMobileActionProduct(product);
      }
    },
    [isMobile],
  );

  const tableMeta = useMemo(
    () => ({
      onEdit: (product: Product) => setEditProduct(product),
      onDelete: (product: Product) => setDeleteProduct(product),
    }),
    [],
  );

  if (isLoading) {
    return (
      <section className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          search={search}
          onSearchChange={handleSearchChange}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
        />
        <DataTable columns={columns} data={[]} isLoading emptyMessage="" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col flex-1">
        <Topbar
          search={search}
          onSearchChange={handleSearchChange}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive">Error al cargar el inventario.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        search={search}
        onSearchChange={handleSearchChange}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
      />

      <DataTable
        columns={columns}
        data={filteredProducts}
        emptyMessage="No hay productos registrados."
        onRowClick={handleRowClick}
        meta={tableMeta}
      />

      {/* Edit modal */}
      {editProduct && (
        <EditProductModal
          open={!!editProduct}
          onOpenChange={(open) => !open && setEditProduct(null)}
          product={editProduct}
        />
      )}

      {/* Delete modal */}
      {deleteProduct && (
        <DeleteProductModal
          open={!!deleteProduct}
          onOpenChange={(open) => !open && setDeleteProduct(null)}
          product={deleteProduct}
        />
      )}

      {/* Mobile action drawer */}
      <Drawer open={!!mobileActionProduct} onOpenChange={(open) => !open && setMobileActionProduct(null)}>
        <DrawerContent>
          <DrawerHeader className="border-b pb-3">
            <DrawerTitle className="text-sm font-bold uppercase tracking-wide">
              {mobileActionProduct?.code} — {mobileActionProduct?.description}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full h-14 gap-3 text-base justify-start px-4"
              onClick={() => {
                const p = mobileActionProduct!;
                setMobileActionProduct(null);
                setEditProduct(p);
              }}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Pencil className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-sm">Editar Producto</span>
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 gap-3 text-base justify-start px-4 border-destructive/30"
              onClick={() => {
                const p = mobileActionProduct!;
                setMobileActionProduct(null);
                setDeleteProduct(p);
              }}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <span className="font-semibold text-sm text-destructive">Eliminar Producto</span>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
