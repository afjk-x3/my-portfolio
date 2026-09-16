import { useSyncExternalStore } from "react";

const formatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

function subscribe(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(id);
}

/**
 * Current wall-clock time in `timeZone` as "HH:MM:SS", updating once a second.
 *
 * Returns null on the server and during hydration, so server and client markup
 * always match; callers render a placeholder for null. The snapshot is a
 * string, so React compares it by value and the component only re-renders when
 * the displayed second actually changes.
 */
export function useLocalTime(timeZone: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => getFormatter(timeZone).format(new Date()),
    () => null,
  );
}
