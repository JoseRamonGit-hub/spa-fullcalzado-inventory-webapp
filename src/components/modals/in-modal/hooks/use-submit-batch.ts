import { useCallback } from "react";
import { toast } from "sonner";
import { useCreateManyProducts } from "@/features/inventory/hooks/useProducts";
import { useCreateManyMovements } from "@/features/movements/hooks/useMovements";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import type { BatchItem, NewBatchItem, ExistingBatchItem } from "../columns";

interface UseSubmitBatchProps {
  batchItems: BatchItem[];
  clearBatch: () => void;
  onSuccess: () => void;
}

export function useSubmitBatch({ batchItems, clearBatch, onSuccess }: UseSubmitBatchProps) {
  const user = useAuthStore((s) => s.user);
  const createMany = useCreateManyProducts();
  const createManyMovements = useCreateManyMovements();

  const isPending = createMany.isPending || createManyMovements.isPending;

  const submitBatch = useCallback(async () => {
    if (batchItems.length === 0) return;

    const newItems = batchItems.filter((i): i is NewBatchItem => i._kind === "new");
    const existingItems = batchItems.filter((i): i is ExistingBatchItem => i._kind === "existing");

    const ops: Promise<unknown>[] = [];

    if (newItems.length > 0) {
      const payload = newItems.map(({ _tempId, _kind, ...rest }) => rest);
      ops.push(createMany.mutateAsync(payload));
    }

    if (existingItems.length > 0 && user) {
      const movementsPayload = existingItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        type: "entry" as const,
        user_id: user.id,
      }));
      ops.push(createManyMovements.mutateAsync(movementsPayload));
    }

    const totalItems = batchItems.length;
    const promise = Promise.all(ops);

    toast.promise(promise, {
      loading: `Procesando ${totalItems} item${totalItems > 1 ? "s" : ""}...`,
      success: `${totalItems} item${totalItems > 1 ? "s" : ""} cargado${totalItems > 1 ? "s" : ""} correctamente`,
      error: "Error al procesar el lote",
    });

    await promise;
    clearBatch();
    onSuccess();
  }, [batchItems, createMany, createManyMovements, user, clearBatch, onSuccess]);

  return { submitBatch, isPending };
}
