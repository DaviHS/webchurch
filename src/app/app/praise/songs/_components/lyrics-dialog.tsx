"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Download, Minus, Pencil, Plus, Projector, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { toastError } from "@/lib/toast";
import { type Song } from "@/types";

interface LyricsDialogProps {
  song: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (song: Song) => void;
}

const SIZES = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl"] as const;
const DEFAULT_SIZE = 1;

export function LyricsDialog({ song, open, onOpenChange, onEdit }: LyricsDialogProps) {
  const canEdit = usePermissions().can("songs.edit");
  const [size, setSize] = useState(DEFAULT_SIZE);
  const hasLyrics = Boolean(song.lyrics?.trim());

  const asText = () => `${song.title}${song.artist ? `\npor ${song.artist}` : ""}\n\n${song.lyrics ?? ""}`;

  const handleExport = () => {
    if (!song.lyrics) return;
    const blob = new Blob([asText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const filename = (song.title || "letra").replace(/[^\w\d-_]+/g, "_");
    anchor.download = `${filename}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      toast.success("Letra copiada");
    } catch {
      toastError("Não foi possível copiar.");
    }
  };

  const handleShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(asText())}`, "_blank", "noopener,noreferrer");
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit?.(song);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="xl" className="h-[95dvh] md:h-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="break-words text-lg sm:text-xl">{song.title || "Sem título"}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{song.artist ? `por ${song.artist}` : "Letra da música"}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-3 pb-4">
          {hasLyrics ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-md border" role="group" aria-label="Tamanho da letra">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSize((value) => Math.max(0, value - 1))}
                    disabled={size === 0}
                    aria-label="Diminuir a letra"
                  >
                    <Minus />
                  </Button>
                  <span className="px-1 text-sm font-medium" aria-hidden>
                    A
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSize((value) => Math.min(SIZES.length - 1, value + 1))}
                    disabled={size === SIZES.length - 1}
                    aria-label="Aumentar a letra"
                  >
                    <Plus />
                  </Button>
                </div>
                <Button type="button" variant="outline" onClick={() => void handleCopy()}>
                  <Copy />
                  Copiar
                </Button>
                <Button type="button" variant="outline" onClick={handleShare}>
                  <Share2 />
                  WhatsApp
                </Button>
                <Button type="button" variant="outline" onClick={handleExport}>
                  <Download />
                  <span className="sr-only sm:not-sr-only">Exportar</span>
                </Button>
              </div>
              <pre className={`whitespace-pre-wrap break-words font-sans leading-relaxed ${SIZES[size]}`}>{song.lyrics}</pre>
            </>
          ) : (
            <div className="space-y-3 rounded-md border border-dashed p-4 text-sm">
              <p className="font-medium">Esta música ainda não tem letra.</p>
              <p className="text-muted-foreground">Sem letra não é possível apresentar. Cadastre a letra na edição da música.</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {canEdit && onEdit && (
                  <Button type="button" onClick={handleEdit}>
                    <Pencil />
                    Cadastrar letra
                  </Button>
                )}
              </div>
            </div>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </ResponsiveDialogClose>
          {canEdit && onEdit && hasLyrics && (
            <Button type="button" variant="outline" onClick={handleEdit}>
              <Pencil />
              Editar
            </Button>
          )}
          {hasLyrics && (
            <Button asChild>
              <Link href={`/presentation/control?song=${song.id}`}>
                <Projector />
                Apresentar
              </Link>
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
