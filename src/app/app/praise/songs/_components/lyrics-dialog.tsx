// components/lyrics-dialog.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Song {
  title: string;
  artist?: string;
  lyrics?: string;
}

interface LyricsDialogProps {
  song: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LyricsDialog({ song, open, onOpenChange }: LyricsDialogProps) {
  const handleExport = () => {
    if (!song?.lyrics) return;

    const content = `${song.title}\n${song.artist ? `por ${song.artist}` : ""}\n\n${song.lyrics}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = (song.title || "letra").replace(/[^\w\d-_]+/g, "_");
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col min-h-0">
        {/* Header fixo */}
        <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-2">
          <DialogTitle className="text-lg sm:text-xl line-clamp-1">
            Letra - {song?.title || "Sem título"}
          </DialogTitle>

          {/* Artista */}
          {song?.artist && (
            <p className="text-muted-foreground text-sm mt-2">
              por {song.artist}
            </p>
          )}

          {/* Botão centralizado responsivo (embaixo do artista) */}
          <div className="mt-3 w-full flex justify-center">
            <div className="w-full sm:w-1/2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Corpo rolável (apenas a letra) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          <div className="p-2">
            <pre className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed font-sans">
              {song?.lyrics || "Letra não disponível."}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
