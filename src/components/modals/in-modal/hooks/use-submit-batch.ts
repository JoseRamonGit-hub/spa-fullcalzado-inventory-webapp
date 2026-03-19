import { useCallback } from "react";
import { toast } from "sonner";
import { useCreateManyProducts } from "@/features/inventory/hooks/useProducts";
import { useCreateManyMovements } from "@/features/movements/hooks/useMovements";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import type { BatchItem, NewBatchItem, ExistingBatchItem } from "../columns";

interface UseSubmitBatchProps {
  pendingBatchItems: BatchItem[];
  clearPendingBatchItems: () => void;
  onSuccess: () => void;
}

export function useSubmitBatch({ pendingBatchItems, clearPendingBatchItems, onSuccess }: UseSubmitBatchProps) {
  const currentUser = useAuthStore((state) => state.user);
  const createManyProductsMutation = useCreateManyProducts();
  const createManyMovementsMutation = useCreateManyMovements();

  const isSubmissionPending = createManyProductsMutation.isPending || createManyMovementsMutation.isPending;

  const submitPendingBatchItems = useCallback(async () => {
    const hasNoItems = pendingBatchItems.length === 0;
    if (hasNoItems) return;

    const newBatchItems = pendingBatchItems.filter((item): item is NewBatchItem => item._kind === "new");
    const existingBatchItems = pendingBatchItems.filter((item): item is ExistingBatchItem => item._kind === "existing");

    const batchOperations: Promise<unknown>[] = [];

    if (newBatchItems.length > 0) {
      const newProductsPayload = newBatchItems.map(({ _tempId, _kind, initialStock, ...restProps }) => ({
        ...restProps,
        price_usd: restProps.priceUsd,
        stock: initialStock,
      }));

      // Clean up properties not expected by the API
      const safePayload = newProductsPayload.map(({ priceUsd, ...keep }) => keep);

      batchOperations.push(createManyProductsMutation.mutateAsync(safePayload));
    }

    if (existingBatchItems.length > 0 && currentUser) {
      const movementsPayload = existingBatchItems.map((item) => ({
        product_id: item.productId,
        quantity: item.addedQuantity,
        type: "entry" as const,
        user_id: currentUser.id,
      }));
      batchOperations.push(createManyMovementsMutation.mutateAsync(movementsPayload));
    }

    const totalItemsCount = pendingBatchItems.length;
    const isMultipleItems = totalItemsCount > 1;
    const batchPromises = Promise.all(batchOperations);

    toast.promise(batchPromises, {
      loading: `Procesando ${totalItemsCount} item${isMultipleItems ? "s" : ""}...`,
      success: `${totalItemsCount} item${isMultipleItems ? "s" : ""} cargado${isMultipleItems ? "s" : ""} correctamente`,
      error: "Error al procesar el lote",
    });

    await batchPromises;
    clearPendingBatchItems();
    onSuccess();
  }, [
    pendingBatchItems,
    createManyProductsMutation,
    createManyMovementsMutation,
    currentUser,
    clearPendingBatchItems,
    onSuccess,
  ]);

  return { submitPendingBatchItems, isSubmissionPending };
}
