import { toast } from "sonner";
import { useCreateManyProducts } from "@/features/inventory/hooks/useProductMutations";
import { useCreateManyMovements } from "@/features/movements/hooks/useMovementMutations";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { isExistingBatchItem, isNewBatchItem, type BatchItem } from "../types";

type UseSubmitBatchProps = {
  pendingBatchItems: BatchItem[];
  clearPendingBatchItems: () => void;
  onSuccess: () => void;
};

export function useSubmitBatch({ pendingBatchItems, clearPendingBatchItems, onSuccess }: UseSubmitBatchProps) {
  const currentUser = useAuthStore((state) => state.user);
  const createManyProductsMutation = useCreateManyProducts();
  const createManyMovementsMutation = useCreateManyMovements();

  const isSubmissionPending = createManyProductsMutation.isPending || createManyMovementsMutation.isPending;

  const submitPendingBatchItems = async () => {
    const hasNoItems = pendingBatchItems.length === 0;
    if (!currentUser || hasNoItems) return;

    const newBatchItems = pendingBatchItems.filter(isNewBatchItem);
    const existingBatchItems = pendingBatchItems.filter(isExistingBatchItem);

    const batchOperations: Promise<unknown>[] = [];

    if (newBatchItems.length > 0) {
      const newProductsPayload = newBatchItems.map((item) => ({
        code: item.code,
        description: item.description,
        price_usd: item.priceUsd,
        stock: item.initialStock,
      }));

      batchOperations.push(createManyProductsMutation.mutateAsync(newProductsPayload));
    }

    if (existingBatchItems.length > 0) {
      const movementsPayload = existingBatchItems.map((item) => ({
        product_id: item.productId,
        quantity: item.addedQuantity,
        type: "entry" as const,
        user_id: currentUser.id,
        stock_before: item.currentStock,
        price_usd: item.priceUsd ?? item.currentPriceUsd,
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
  };

  return { submitPendingBatchItems, isSubmissionPending };
}
