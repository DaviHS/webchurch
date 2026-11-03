"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { OUTPUT_PATHS, type OutputRole } from "./protocol";

interface ScreenDetailed extends Screen {
  readonly availLeft: number;
  readonly availTop: number;
  readonly left: number;
  readonly top: number;
  readonly isPrimary: boolean;
  readonly isInternal: boolean;
  readonly devicePixelRatio: number;
  readonly label: string;
}

interface ScreenDetails extends EventTarget {
  readonly screens: readonly ScreenDetailed[];
  readonly currentScreen: ScreenDetailed;
}

type WindowWithScreenDetails = Window & {
  getScreenDetails: () => Promise<ScreenDetails>;
};

function hasScreenDetails(win: Window): win is WindowWithScreenDetails {
  return "getScreenDetails" in win && typeof win.getScreenDetails === "function";
}

export function isScreenDetectionSupported(): boolean {
  return typeof window !== "undefined" && hasScreenDetails(window);
}

export function isMultiScreen(): boolean {
  return typeof window !== "undefined" && "isExtended" in window.screen && window.screen.isExtended === true;
}

export interface DetectedScreen {
  key: string;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  isPrimary: boolean;
  isInternal: boolean;
  isCurrent: boolean;
}

function toDetected(screen: ScreenDetailed, index: number, current: ScreenDetailed): DetectedScreen {
  const label = screen.label.trim() === "" ? `Tela ${index + 1}` : screen.label.trim();
  return {
    key: `${label}|${screen.width}x${screen.height}`,
    label,
    left: screen.availLeft,
    top: screen.availTop,
    width: screen.width,
    height: screen.height,
    isPrimary: screen.isPrimary,
    isInternal: screen.isInternal,
    isCurrent: screen === current,
  };
}

let screenDetails: ScreenDetails | null = null;
let detectedScreens: readonly DetectedScreen[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function refreshFromDetails() {
  if (!screenDetails) return;
  const current = screenDetails.currentScreen;
  detectedScreens = screenDetails.screens.map((screen, index) => toDetected(screen, index, current));
  emit();
}

export async function detectScreens(): Promise<readonly DetectedScreen[]> {
  if (!hasScreenDetails(window)) {
    throw new Error("Este navegador não permite detectar telas. Use Chrome, Edge ou Brave.");
  }
  if (!screenDetails) {
    screenDetails = await window.getScreenDetails();
    screenDetails.addEventListener("screenschange", refreshFromDetails);
    screenDetails.addEventListener("currentscreenchange", refreshFromDetails);
  }
  refreshFromDetails();
  return detectedScreens;
}

export async function detectScreensIfPermitted(): Promise<void> {
  if (!hasScreenDetails(window)) return;
  try {
    const status = await navigator.permissions.query({ name: "window-management" as PermissionName });
    if (status.state === "granted") await detectScreens();
  } catch {
  }
}

function subscribeScreens(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const EMPTY: readonly DetectedScreen[] = [];

export function useDetectedScreens(): readonly DetectedScreen[] {
  return useSyncExternalStore(subscribeScreens, () => detectedScreens, () => EMPTY);
}

const ASSIGNMENTS_KEY = "presentation-output-screens";
const ASSIGNMENTS_EVENT = "presentation-output-screens-change";

const screenRefSchema = z.object({
  key: z.string(),
  label: z.string(),
  left: z.number(),
  top: z.number(),
  width: z.number(),
  height: z.number(),
});
export type ScreenRef = z.infer<typeof screenRefSchema>;

const assignmentsSchema = z.object({
  projector: screenRefSchema.nullable().catch(null),
  stage: screenRefSchema.nullable().catch(null),
});
export type ScreenAssignments = z.infer<typeof assignmentsSchema>;

const NO_ASSIGNMENTS: ScreenAssignments = { projector: null, stage: null };

let lastAssignmentsRaw: string | null | undefined;
let lastAssignments: ScreenAssignments = NO_ASSIGNMENTS;

function readAssignments(): ScreenAssignments {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(ASSIGNMENTS_KEY);
  } catch {
    raw = null;
  }
  if (raw !== lastAssignmentsRaw) {
    lastAssignmentsRaw = raw;
    try {
      const parsed = assignmentsSchema.safeParse(raw ? JSON.parse(raw) : null);
      lastAssignments = parsed.success ? parsed.data : NO_ASSIGNMENTS;
    } catch {
      lastAssignments = NO_ASSIGNMENTS;
    }
  }
  return lastAssignments;
}

function subscribeAssignments(listener: () => void) {
  window.addEventListener(ASSIGNMENTS_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(ASSIGNMENTS_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function useScreenAssignments(): ScreenAssignments {
  return useSyncExternalStore(subscribeAssignments, readAssignments, () => NO_ASSIGNMENTS);
}

export function assignScreen(role: OutputRole, screen: DetectedScreen | null): void {
  const current = readAssignments();
  const ref: ScreenRef | null = screen
    ? { key: screen.key, label: screen.label, left: screen.left, top: screen.top, width: screen.width, height: screen.height }
    : null;

  const next: ScreenAssignments = { ...current, [role]: ref };
  const other: OutputRole = role === "projector" ? "stage" : "projector";
  if (ref && next[other]?.key === ref.key) next[other] = null;

  try {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Não foi possível salvar a configuração de telas:", error);
  }
  window.dispatchEvent(new Event(ASSIGNMENTS_EVENT));
}

export function resolveScreen(ref: ScreenRef | null, screens: readonly DetectedScreen[]): ScreenRef | DetectedScreen | null {
  if (!ref) return null;
  if (screens.length === 0) return ref;
  return (
    screens.find((s) => s.key === ref.key) ??
    screens.find((s) => s.width === ref.width && s.height === ref.height && s.left === ref.left && s.top === ref.top) ??
    null
  );
}

export function outputWindowName(role: OutputRole): string {
  return `webchurch-output-${role}`;
}

export function openOutputWindow(role: OutputRole, screen: ScreenRef | null): Window | null {
  const features = screen
    ? [
        "popup",
        `left=${screen.left}`,
        `top=${screen.top}`,
        `width=${screen.width}`,
        `height=${screen.height}`,
        "fullscreen",
      ].join(",")
    : "popup,width=1280,height=720";

  const win = window.open(OUTPUT_PATHS[role], outputWindowName(role), features);
  if (win && screen) {
    try {
      win.moveTo(screen.left, screen.top);
      win.resizeTo(screen.width, screen.height);
    } catch {
    }
  }
  window.focus();
  return win;
}
