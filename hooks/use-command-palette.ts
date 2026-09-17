import { useSyncExternalStore } from "react";

/*
 * Open state of the command palette, shared by the palette itself and every
 * button that opens it, without a React context provider. A tiny external
 * store: the palette renders once in the root layout, triggers can live
 * anywhere.
 */
let open = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setCommandPaletteOpen(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((listener) => listener());
}

/** Whether the palette is open. Always `false` on the server. */
export function useCommandPaletteOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}

function subscribeNever() {
  return () => {};
}

/**
 * The label for the palette shortcut's modifier key: "⌘" on Apple platforms,
 * "Ctrl" elsewhere. "Ctrl" on the server and during hydration.
 */
export function useModifierKeyLabel(): string {
  return useSyncExternalStore(
    subscribeNever,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}
