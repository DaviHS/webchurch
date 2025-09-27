// components/lyrics-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from "lucide-react";

interface LyricsDialogProps {
  song: {
    title: string;
    artist?: string;
    lyrics?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LyricsDialog({ song, open, onOpenChange }: LyricsDialogProps) {
  const handleExport = () => {
    if (!song.lyrics) return;

    const content = `${song.title}\n${song.artist ? `por ${song.artist}` : ""}\n\n${song.lyrics}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${song.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col min-h-0">
        {/* Header fixo */}
        <DialogHeader className="flex-shrink-0 px-1">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <DialogTitle className="text-lg sm:text-xl line-clamp-1">
              Letra - {song.title}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
          {song.artist && (
            <p className="text-muted-foreground text-sm sm:text-base">
              por {song.artist}
            </p>
          )}
        </DialogHeader>

        {/* Área rolável */}
        <ScrollArea className="flex-1 min-h-0 px-1">
          <div className="p-4">
            <pre className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed font-sans">
              {song.lyrics || "Letra não disponível."}
            </pre>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
