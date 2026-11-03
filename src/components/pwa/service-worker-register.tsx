"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const INSTALL_DISMISSED_KEY = "pwa-install-dismissed-at";
const INSTALL_SNOOZE_MS = 1000 * 60 * 60 * 24 * 30;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
  }
}

const OUTPUT_PATHS = ["/presentation/projector", "/presentation/stage"];
const isOutputWindow = () => OUTPUT_PATHS.includes(window.location.pathname.replace(/\/$/, ""));

let updateRequested = false;

function promptReload(worker: ServiceWorker) {
  if (isOutputWindow()) return;
  toast("Nova versão disponível", {
    id: "pwa-update",
    description: "Atualize para usar a versão mais recente do app.",
    duration: Infinity,
    action: {
      label: "Atualizar",
      onClick: () => {
        updateRequested = true;
        worker.postMessage({ type: "SKIP_WAITING" });
      },
    },
  });
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => void reg.unregister());
      });
      return;
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing || !updateRequested) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);


    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          promptReload(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              promptReload(installing);
            }
          });
        });

        const onVisible = () => {
          if (document.visibilityState === "visible") void registration.update();
        };
        document.addEventListener("visibilitychange", onVisible);
      })
      .catch((error: unknown) => {
        console.error("Falha ao registrar o service worker:", error);
      });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (!["/", "/app"].includes(window.location.pathname)) return;
      const dismissedAt = Number(readStorage(INSTALL_DISMISSED_KEY) ?? 0);
      if (Date.now() - dismissedAt < INSTALL_SNOOZE_MS) return;

      const installEvent = event as BeforeInstallPromptEvent;
      toast("Instalar o app Igreja Central?", {
        id: "pwa-install",
        description: "Acesse mais rápido direto da tela inicial.",
        duration: 15000,
        action: {
          label: "Instalar",
          onClick: () => {
            void installEvent.prompt().then(() => installEvent.userChoice).then(({ outcome }) => {
              if (outcome === "dismissed") writeStorage(INSTALL_DISMISSED_KEY, String(Date.now()));
            });
          },
        },
        onDismiss: () => writeStorage(INSTALL_DISMISSED_KEY, String(Date.now())),
      });
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  return null;
}
