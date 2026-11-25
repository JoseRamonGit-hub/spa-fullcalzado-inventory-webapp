import { useState } from "react";

export function useDialogTarget<T>() {
  const [target, setTarget] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [key, setKey] = useState(0);

  function open(nextTarget: T) {
    setTarget(nextTarget);
    setKey((current) => current + 1);
    setIsOpen(true);
  }

  return { target, isOpen, key, open, setIsOpen };
}
