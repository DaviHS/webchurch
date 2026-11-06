"use client";

import { useRef, useState } from "react";
import { CloudDownload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { downloadBibleVersion, markDownloaded, readDownloadedAt } from "@/lib/bible-offline";
import { toastError } from "@/lib/toast";
import { api } from "@/trpc/react";

/** Baixa todos os capítulos de uma versão para ler sem internet (em "Aa"). */
export function OfflineDownload({ version }: { version: string }) {
  const utils = api.useUtils();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [savedAt, setSavedAt] = useState(() => readDownloadedAt(version));
  const control = useRef({ cancelled: false });

  const download = async () => {
    control.current = { cancelled: false };
    setProgress({ done: 0, total: 1 });
    const result = await downloadBibleVersion(utils.client.bible.getChapter, version, control.current, (done, total) =>
      setProgress({ done, total }),
    );
    setProgress(null);

    if (result.offline) {
      toastError("Não foi possível baixar. Verifique a internet e tente de novo.");
    } else if (result.cancelled) {
      toast.message("Download cancelado");
    } else if (result.failures > 0) {
      toastError(`${result.failures} capítulo(s) não foram baixados. Tente de novo.`);
    } else {
      const stamp = new Date().toLocaleDateString("pt-BR");
      markDownloaded(version, stamp);
      setSavedAt(stamp);
      toast.success(`${version} disponível sem internet`);
    }
  };

  const percent = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sem internet</p>
      {progress ? (
        <div className="space-y-2">
          <Progress value={percent} aria-label="Baixando a Bíblia" />
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> {percent}%
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => (control.current.cancelled = true)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Button type="button" variant="outline" className="w-full justify-start" onClick={() => void download()}>
            <CloudDownload className="mr-2 size-4" />
            {savedAt ? `Atualizar ${version} offline` : `Baixar ${version} para ler offline`}
          </Button>
          <p className="text-xs text-muted-foreground">
            {savedAt
              ? `Baixada em ${savedAt}. Abre sem internet neste aparelho.`
              : "Guarda a versão inteira neste aparelho (cerca de 5 MB). Os capítulos que você abre também ficam guardados."}
          </p>
        </>
      )}
    </div>
  );
}
