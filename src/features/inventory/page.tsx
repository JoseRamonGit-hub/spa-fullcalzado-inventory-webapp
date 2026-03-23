import { useState, useCallback, useMemo } from "react";
import { useProducts } from "./hooks/useProductQueries";
import { useProductFilters } from "./hooks/useProductFilters";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./columns";
import { EditProductModal } from "./components/edit-product-modal";
import { ToggleStatusModal } from "./components/toggle-status-modal";
import { MobileActionDrawer } from "./components/mobile-action-drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Product } from "@/types";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useExchangeRate } from "@/features/exchange_rates/useExchangeRateQueries";
import { Route } from "@/routes/_app/inventory";
import { useNavigate } from "@tanstack/react-router";

export function InventoryPage() {
  const { date } = Route.useSearch();
  const navigate = useNavigate({ from: "/inventory" });

  const setDate = (value: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, date: value }) });
  };

  const { data: products, isLoading, isError } = useProducts(date);
  const { data: exchangeRateData, isLoading: isExchangeRateLoading } = useExchangeRate();
  const isMobile = useIsMobile();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");

  const { searchInput, setSearchInput, filteredProducts } = useProductFilters(products);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  // Action modals state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [toggleStatusProduct, setToggleStatusProduct] = useState<Product | null>(null);
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
      onToggleStatus: (product: Product) => setToggleStatusProduct(product),
      isAdmin,
    }),
    [isAdmin],
  );

  const columns = useMemo(
    () => getColumns({ exchangeRate: exchangeRateData?.rate, isExchangeRateLoading }),
    [exchangeRateData?.rate, isExchangeRateLoading],
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar search={searchInput} onSearchChange={handleSearchChange} date={date} onDateChange={setDate} />

      {isLoading ? (
        <DataTable columns={columns} data={[]} isLoading emptyMessage="" />
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar el inventario.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredProducts}
          emptyMessage="No hay productos registrados."
          onRowClick={handleRowClick}
          meta={tableMeta}
          getRowId={(row) => row.id}
        />
      )}

      {editProduct && (
        <EditProductModal
          open={!!editProduct}
          onOpenChange={(open) => !open && setEditProduct(null)}
          product={editProduct}
        />
      )}

      {toggleStatusProduct && (
        <ToggleStatusModal
          open={!!toggleStatusProduct}
          onOpenChange={(open) => !open && setToggleStatusProduct(null)}
          product={toggleStatusProduct}
        />
      )}

      <MobileActionDrawer
        product={mobileActionProduct}
        onClose={() => setMobileActionProduct(null)}
        onEdit={(p) => {
          setMobileActionProduct(null);
          setEditProduct(p);
        }}
        onToggleStatus={(p) => {
          setMobileActionProduct(null);
          setToggleStatusProduct(p);
        }}
      />
    </section>
  );
}
