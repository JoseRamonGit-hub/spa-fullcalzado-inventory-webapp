import { useState, useTransition, useCallback, useMemo } from "react";
import { useProducts } from "./hooks/useProducts";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { EditProductModal } from "./components/edit-product-modal";
import { DeleteProductModal } from "./components/delete-product-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

export function InventoryPage() {
  // Search + filtering with useTransition for non-blocking UI
  const [search, setSearch] = useState("");
  const [filteredSearch, setFilteredSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [date, setDate] = useState<string | undefined>(undefined);
  const [, startTransition] = useTransition();

  const { data: products, isLoading, isError } = useProducts(date);
  const isMobile = useIsMobile();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "admin";

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
      if (isMobile && isAdmin) {
        setMobileActionProduct(product);
      }
    },
    [isMobile, isAdmin],
  );

  const tableMeta = useMemo(
    () => ({
      onEdit: (product: Product) => setEditProduct(product),
      onDelete: (product: Product) => setDeleteProduct(product),
      isAdmin,
    }),
    [isAdmin],
  );

  const topbarProps = {
    search,
    onSearchChange: handleSearchChange,
    stockFilter,
    onStockFilterChange: setStockFilter,
    date,
    onDateChange: setDate,
  };

  if (isLoading) {
    return (
      <section className="flex min-h-0 flex-1 flex-col">
        <Topbar {...topbarProps} />
        <DataTable columns={columns} data={[]} isLoading emptyMessage="" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-1 flex-col">
        <Topbar {...topbarProps} />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar el inventario.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar {...topbarProps} />

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
            <DrawerTitle className="text-sm font-bold tracking-wide uppercase">
              {mobileActionProduct?.code} — {mobileActionProduct?.description}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-3 p-4">
            <Button
              variant="outline"
              className="h-14 w-full justify-start gap-3 px-4 text-base"
              onClick={() => {
                const p = mobileActionProduct!;
                setMobileActionProduct(null);
                setEditProduct(p);
              }}
            >
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Pencil className="text-primary h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Editar Producto</span>
            </Button>
            <Button
              variant="outline"
              className="border-destructive/30 h-14 w-full justify-start gap-3 px-4 text-base"
              onClick={() => {
                const p = mobileActionProduct!;
                setMobileActionProduct(null);
                setDeleteProduct(p);
              }}
            >
              <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Trash2 className="text-destructive h-5 w-5" />
              </div>
              <span className="text-destructive text-sm font-semibold">Eliminar Producto</span>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
