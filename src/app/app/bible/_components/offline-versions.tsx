"use client";

import { useRef, useState } from "react";
import { CloudDownload, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  downloadBibleVersion,
  MAIN_VERSIONS,
  markDownloaded,
  readDownloadedAt,
  removeDownloaded,
} from "@/lib/bible-offline";
import { toastError } from "@/lib/toast";
import { api } from "@/trpc/react";

export function OfflineVersions({ currentVersion }: { currentVersion?: string }) {
  const utils = api.useUtils();
  const { data: versions } = api.bible.versions.useQuery(undefined, { staleTime: Infinity, networkMode: "always" });
  const [refresh, setRefresh] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{ percent: number; label: string } | null>(null);
  const control = useRef({ cancelled: false });

  const savedAt = new Map(
    (versions ?? []).flatMap((version) => {
      const date = readDownloadedAt(version.code);
      return date ? [[version.code, date] as const] : [];
    }),
  );
  void refresh;

  const toggle = (code: string, checked: boolean) =>
    setPicked((previous) => {
      const next = new Set(previous);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });

  const download = async (codes: string[]) => {
    if (codes.length === 0) return;
    control.current = { cancelled: false };
    setProgress({ percent: 0, label: codes[0] ?? "" });

    let finished = 0;
    let problem: "offline" | "failures" | null = null;
    for (const [index, code] of codes.entries()) {
      const result = await downloadBibleVersion(utils.client.bible.getChapter, code, control.current, (done, total) =>
        setProgress({ percent: Math.round(((index + done / total) / codes.length) * 100), label: code }),
      );
      if (result.cancelled) break;
      if (result.offline) {
        problem = "offline";
        break;
      }
      if (result.failures > 0) {
        problem = "failures";
        continue;
      }
      markDownloaded(code, new Date().toLocaleDateString("pt-BR"));
      finished += 1;
      setRefresh((value) => value + 1);
    }

    setProgress(null);
    setPicked(new Set());
    if (problem === "offline") toastError("Não foi possível baixar. Verifique a internet e tente de novo.");
    else if (problem === "failures") toastError("Alguns capítulos não foram baixados. Tente de novo.");
    else if (control.current.cancelled) toast.message("Download cancelado");
    else if (finished > 0) toast.success(finished === 1 ? `${codes[0]} disponível sem internet` : `${finished} versões disponíveis sem internet`);
  };

  const remove = async (code: string) => {
    await removeDownloaded(code);
    setRefresh((value) => value + 1);
    toast.success(`${code} removida deste aparelho`);
  };

  const available = (versions ?? []).map((version) => version.code);
  const mainMissing = MAIN_VERSIONS.filter((code) => available.includes(code) && !savedAt.has(code));
  const toDownload = [...picked];

  if (!versions) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sem internet</p>

      {progress ? (
        <div className="space-y-2">
          <Progress value={progress.percent} aria-label="Baixando a Bíblia" />
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> {progress.label} · {progress.percent}%
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => (control.current.cancelled = true)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ul className="max-h-48 space-y-0.5 overflow-y-auto rounded-md border p-1">
            {versions.map((version) => {
              const date = savedAt.get(version.code);
              const id = `offline-${version.code}`;
              return (
                <li key={version.code} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent">
                  {date ? (
                    <span className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <Checkbox id={id} checked={picked.has(version.code)} onCheckedChange={(checked) => toggle(version.code, checked === true)} />
                  )}
                  <label htmlFor={id} className="min-w-0 flex-1 text-sm leading-tight">
                    <span className="font-medium">{version.code}</span>
                    {version.code === currentVersion && <span className="ml-1 text-xs text-primary">(aberta)</span>}
                    <span className="block truncate text-xs text-muted-foreground">
                      {date ? `Baixada em ${date}` : version.name}
                    </span>
                  </label>
                  {date && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void remove(version.code)}
                      title={`Remover ${version.code} deste aparelho`}
                      aria-label={`Remover ${version.code} deste aparelho`}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="grid gap-1.5">
            <Button type="button" variant="outline" disabled={toDownload.length === 0} onClick={() => void download(toDownload)}>
              <CloudDownload className="mr-2 size-4" />
              {toDownload.length > 0 ? `Baixar ${toDownload.length} selecionada(s)` : "Baixar selecionadas"}
            </Button>
            {mainMissing.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => void download(mainMissing)}>
                Baixar as principais ({mainMissing.join(", ")})
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Cada versão ocupa cerca de 5 MB neste aparelho. Os capítulos que você abre também ficam guardados.
          </p>
        </>
      )}
    </div>
  );
}
