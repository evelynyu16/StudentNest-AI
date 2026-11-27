import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "studentnest-theme";

// index.html sets data-theme before React loads, so the page never flashes the wrong theme.
const read = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

const listeners = new Set<() => void>();
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(KEY, theme); } catch { /* private mode: the choice just isn't remembered */ }
  listeners.forEach(fn => fn());
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}
