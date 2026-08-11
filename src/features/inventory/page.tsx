import { useState, useCallback, useMemo } from "react";
import { useProducts } from "./hooks/useProductQueries";
import { useProductSearch } from "./hooks/useProductSearch";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { DataTableError } from "@/components/ui/data-table-error";
import { getColumns } from "./columns";
import { EditProductModal } from "./components/edit-product-modal";
import { AdjustProductStockModal } from "./components/adjust-product-stock-modal";
import { ToggleStatusModal } from "./components/toggle-status-modal";
import { MobileActionDrawer } from "./components/mobile-action-drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Product } from "@/types";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useExchangeRate } from "@/features/exchange-rates/hooks/useExchangeRateQueries";
import { Route } from "@/routes/_app/inventory";
import { useNavigate } from "@tanstack/react-router";

export function InventoryPage() {
  const { date, status } = Route.useSearch();
  const navigate = useNavigate({ from: "/inventory" });

  const setDate = (value: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, date: value }) });
  };

  const { data: products, isLoading, isError, isFetching, refetch } = useProducts(date, status);
  const { data: exchangeRateData, isLoading: isExchangeRateLoading, isError: isExchangeRateError } = useExchangeRate();
  const isMobile = useIsMobile();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");

  const { searchInput, setSearchInput, filteredProducts } = useProductSearch(products);
  const hasActiveFilters = Boolean(searchInput.trim() || date || status);

  // Action modals state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [adjustStockProduct, setAdjustStockProduct] = useState<Product | null>(null);
  const [toggleStatusProduct, setToggleStatusProduct] = useState<Product | null>(null);
  const [mobileActionProduct, setMobileActionProduct] = useState<Product | null>(null);

  const handleRowClick = useCallback(
    (product: Product) => {
      if (isMobile) {
        setMobileActionProduct(product);
        return;
      }

      navigate({ to: "/inventory/$productId", params: { productId: product.id } });
    },
    [isMobile, navigate],
  );

  const openProductDetail = (product: Product) => {
    setMobileActionProduct(null);
    navigate({ to: "/inventory/$productId", params: { productId: product.id } });
  };

  const tableMeta = useMemo(
    () => ({
      onEdit: (product: Product) => setEditProduct(product),
      onAdjustStock: (product: Product) => setAdjustStockProduct(product),
      onToggleStatus: (product: Product) => setToggleStatusProduct(product),
      isAdmin,
    }),
    [isAdmin],
  );

  const columns = useMemo(
    () => getColumns({ exchangeRate: exchangeRateData?.rate, isExchangeRateLoading, isExchangeRateError }),
    [exchangeRateData?.rate, isExchangeRateError, isExchangeRateLoading],
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar
        search={searchInput}
        onSearchChange={setSearchInput}
        date={date}
        onDateChange={setDate}
        stockStatus={status}
        onStockStatusChange={(value) => navigate({ search: (prev) => ({ ...prev, status: value }) })}
      />

      {isLoading ? (
        <DataTable columns={columns} data={[]} isLoading emptyMessage="" scrollAreaLabel="Inventario" />
      ) : isError && !products ? (
        <DataTableError title="No pudimos cargar el inventario" onRetry={refetch} isRetrying={isFetching} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredProducts}
          emptyMessage={
            hasActiveFilters
              ? "No se encontraron productos con los filtros aplicados."
              : "No hay productos registrados."
          }
          onRowClick={handleRowClick}
          getRowAriaLabel={(product) => `Abrir producto ${product.code}`}
          meta={tableMeta}
          getRowId={(row) => row.id}
          scrollAreaLabel="Inventario"
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

      {adjustStockProduct && (
        <AdjustProductStockModal
          open={!!adjustStockProduct}
          onOpenChange={(open) => !open && setAdjustStockProduct(null)}
          product={adjustStockProduct}
        />
      )}

      <MobileActionDrawer
        product={mobileActionProduct}
        isAdmin={isAdmin}
        onClose={() => setMobileActionProduct(null)}
        onViewDetail={openProductDetail}
        onEdit={(p) => {
          setMobileActionProduct(null);
          setEditProduct(p);
        }}
        onAdjustStock={(p) => {
          setMobileActionProduct(null);
          setAdjustStockProduct(p);
        }}
        onToggleStatus={(p) => {
          setMobileActionProduct(null);
          setToggleStatusProduct(p);
        }}
      />
    </section>
  );
}
