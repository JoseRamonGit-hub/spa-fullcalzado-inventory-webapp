import { useEffect, useEffectEvent } from "react";

type ModalKeyboardShortcut = {
  key: string;
  altKey?: boolean;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  when?: boolean;
  stopPropagation?: boolean;
  onTrigger: () => void;
};

type UseModalKeyboardShortcutsOptions = {
  enabled: boolean;
  shortcuts: ModalKeyboardShortcut[];
};

function matchesShortcut(event: KeyboardEvent, shortcut: ModalKeyboardShortcut) {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    event.altKey === Boolean(shortcut.altKey) &&
    event.shiftKey === Boolean(shortcut.shiftKey) &&
    event.ctrlKey === Boolean(shortcut.ctrlKey) &&
    event.metaKey === Boolean(shortcut.metaKey)
  );
}

export function useModalKeyboardShortcuts({ enabled, shortcuts }: UseModalKeyboardShortcutsOptions) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      if (shortcut.when === false || !matchesShortcut(event, shortcut)) continue;

      event.preventDefault();
      if (shortcut.stopPropagation) {
        event.stopPropagation();
      }

      shortcut.onTrigger();
      return;
    }
  });

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled]);
}
