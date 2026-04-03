import { useCallback, useState } from "react";

type PendingItem = {
  tempId: string;
};

export function usePendingItems<Item extends PendingItem>() {
  const [items, setItems] = useState<Item[]>([]);

  const addItem = useCallback((item: Item) => {
    setItems((currentItems) => [...currentItems, item]);
  }, []);

  const removeItem = useCallback((tempId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.tempId !== tempId));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    clearItems,
  } as const;
}
