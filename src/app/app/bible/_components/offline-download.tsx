"use client";

import { useRef, useState } from "react";
import { CloudDownload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BIBLE_BOOKS } from "@/lib/bible";
import { toastError } from "@/lib/toast";
import { api } from "@/trpc/react";

const WORKERS = 4;
/** Falhas seguidas que indicam falta de internet: melhor parar do que insistir. */
const MAX_CONSECUTIVE_FAILURES = 8;

const ALL_CHAPTERS = BIBLE_BOOKS.flatMap((book) =>
  Array.from({ length: book.chapters }, (_, index) => ({ bookId: book.id, chapter: index + 1 })),
);

const storageKey = (version: string) => `bible-offline:${version}`;

function readSavedAt(version: string): string | null {
  try {
    return localStorage.getItem(storageKey(version));
  } catch {
    return null;
  }
}

function writeSavedAt(version: string, value: string) {
  try {
    localStorage.setItem(storageKey(version), value);
  } catch {
    // Sem armazenamento local, só não mostramos a data do download.
  }
}

const isNotFound = (error: unknown) =>
  error instanceof TRPCClientError && (error.data as { code?: string } | undefined)?.code === "NOT_FOUND";

/** Baixa todos os capítulos de uma versão. O service worker guarda cada resposta para uso sem internet. */
export function OfflineDownload({ version }: { version: string }) {
  const utils = api.useUtils();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [savedAt, setSavedAt] = useState(() => readSavedAt(version));
  const cancelled = useRef(false);

  const download = async () => {
    cancelled.current = false;
    setProgress({ done: 0, total: ALL_CHAPTERS.length });
    void navigator.storage?.persist?.().catch(() => false);

    let next = 0;
    let done = 0;
    let failures = 0;
    let consecutive = 0;

    const worker = async () => {
      while (!cancelled.current) {
        const item = ALL_CHAPTERS[next++];
        if (!item) return;
        try {
          await utils.client.bible.getChapter.query({ version, ...item });
          consecutive = 0;
        } catch (error) {
          if (isNotFound(error)) {
            // A versão não tem este capítulo (ex.: traduções parciais): não é falha.
            consecutive = 0;
          } else {
            failures += 1;
            consecutive += 1;
            if (consecutive >= MAX_CONSECUTIVE_FAILURES) cancelled.current = true;
          }
        }
        done += 1;
        setProgress({ done, total: ALL_CHAPTERS.length });
      }
    };

    await Promise.all(Array.from({ length: WORKERS }, worker));
    setProgress(null);

    if (consecutive >= MAX_CONSECUTIVE_FAILURES) {
      toastError("Não foi possível baixar. Verifique a internet e tente de novo.");
    } else if (cancelled.current) {
      toast.message("Download cancelado");
    } else if (failures > 0) {
      toastError(`${failures} capítulo(s) não foram baixados. Tente de novo.`);
    } else {
      const stamp = new Date().toLocaleDateString("pt-BR");
      writeSavedAt(version, stamp);
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
              <Loader2 className="size-3.5 animate-spin" /> {percent}% ({progress.done} de {progress.total})
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => (cancelled.current = true)}>
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
