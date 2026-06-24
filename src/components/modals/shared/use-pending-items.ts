import { useState } from "react";

type PendingItem = {
  tempId: string;
};

export function usePendingItems<Item extends PendingItem>() {
  const [items, setItems] = useState<Item[]>([]);

  const addItem = (item: Item) => {
    setItems((currentItems) => [...currentItems, item]);
  };

  const removeItem = (tempId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.tempId !== tempId));
  };

  const clearItems = () => {
    setItems([]);
  };

  return {
    items,
    addItem,
    removeItem,
    clearItems,
  } as const;
}
