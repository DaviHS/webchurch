"use client";

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
import { Download } from "lucide-react";
import { type Song } from "@/types";

interface LyricsDialogProps {
  song: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LyricsDialog({ song, open, onOpenChange }: LyricsDialogProps) {
  const hasLyrics = Boolean(song.lyrics);

  const handleExport = () => {
    if (!song.lyrics) return;

    const content = `${song.title}\n${song.artist ? `por ${song.artist}` : ""}\n\n${song.lyrics}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
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

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="xl" className="h-[95dvh] md:h-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="break-words text-lg sm:text-xl">{song.title || "Sem título"}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{song.artist ? `por ${song.artist}` : "Letra da música"}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="pb-4">
          <pre className="whitespace-pre-wrap break-words font-sans text-base leading-relaxed">
            {hasLyrics ? song.lyrics : "Letra não disponível."}
          </pre>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </ResponsiveDialogClose>
          <Button onClick={handleExport} disabled={!hasLyrics}>
            <Download />
            Exportar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
