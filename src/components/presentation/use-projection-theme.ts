"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME_ID, themeById, type ProjectionThemeId } from "./themes";

const STORAGE_KEY = "projection-theme";
const listeners = new Set<() => void>();
let memoryValue: string | null = null;

function read(): ProjectionThemeId {
  try {
    return themeById(localStorage.getItem(STORAGE_KEY)).id;
  } catch {
    return themeById(memoryValue).id;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function write(id: ProjectionThemeId) {
  memoryValue = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
  listeners.forEach((listener) => listener());
}

export function useProjectionTheme(): [ProjectionThemeId, (id: ProjectionThemeId) => void] {
  const id = useSyncExternalStore(subscribe, read, () => DEFAULT_THEME_ID);
  return [id, write];
}
