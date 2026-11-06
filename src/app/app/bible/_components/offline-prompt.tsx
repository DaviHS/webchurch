"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  connectionIsLimited,
  downloadBibleVersion,
  markDownloaded,
  shouldAskToDownload,
  snoozeDownloadPrompt,
} from "@/lib/bible-offline";
import { toastError } from "@/lib/toast";
import { api } from "@/trpc/react";

const ASK_AFTER_MS = 4000;

/** Na primeira vez que a pessoa abre a Bíblia, oferece baixar a versão para ler sem internet. */
export function OfflinePrompt({ version }: { version: string | undefined }) {
  const utils = api.useUtils();
  const client = utils.client.bible.getChapter;
  const clientRef = useRef(client);
  useEffect(() => {
    clientRef.current = client;
  });

  useEffect(() => {
    if (!version || !navigator.onLine || connectionIsLimited() || !shouldAskToDownload(version)) return;

    const timer = setTimeout(() => {
      const startDownload = () => {
        const control = { cancelled: false };
        const cancel = { label: "Cancelar", onClick: () => (control.cancelled = true) };
        const id = toast.loading(`Baixando ${version}... 0%`, { duration: Infinity, action: cancel });
        void downloadBibleVersion(clientRef.current, version, control, (done, total) =>
          toast.loading(`Baixando ${version}... ${Math.round((done / total) * 100)}%`, { id, duration: Infinity, action: cancel }),
        ).then((result) => {
          if (result.offline) toastError("Não foi possível baixar. Tente de novo em “Aa”.", { id });
          else if (result.cancelled) toast.message("Download cancelado", { id });
          else if (result.failures > 0) toastError(`${result.failures} capítulo(s) não foram baixados. Tente de novo em “Aa”.`, { id });
          else {
            markDownloaded(version, new Date().toLocaleDateString("pt-BR"));
            toast.success(`${version} disponível sem internet`, { id });
          }
        });
      };

      toast("Ler a Bíblia sem internet?", {
        description: `Baixe a ${version} (cerca de 5 MB) para abrir mesmo sem sinal.`,
        duration: 20_000,
        action: { label: "Baixar", onClick: startDownload },
        cancel: { label: "Agora não", onClick: snoozeDownloadPrompt },
        onDismiss: snoozeDownloadPrompt,
      });
    }, ASK_AFTER_MS);

    return () => clearTimeout(timer);
  }, [version]);

  return null;
}
