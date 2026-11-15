import { useState } from "react";

/**
 * Diálogo que actúa sobre un elemento elegido. El objetivo sobrevive al cierre para que la animación de salida no
 * pierda su contenido, y `key` cambia en cada apertura para que el diálogo empiece con su formulario limpio.
 */
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
