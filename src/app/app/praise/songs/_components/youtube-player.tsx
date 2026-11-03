"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { extractYouTubeVideoId, youtubeEmbedUrl, youtubeWatchUrl } from "@/lib/youtube-url";

interface YouTubePlayerProps {
  song: {
    title: string;
    artist?: string;
    youtubeUrl?: string;
    youtubeVideoId?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function YouTubePlayer({ song, open, onOpenChange }: YouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const videoId = song.youtubeVideoId ?? extractYouTubeVideoId(song.youtubeUrl);

  if (!videoId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Vídeo não disponível</DialogTitle>
            <DialogDescription>
              Esta música não tem um vídeo do YouTube válido. Edite a música e cole o link do vídeo (ou deixe em branco
              para buscar automaticamente).
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="px-6 pb-2 pt-6">
          <DialogTitle className="text-lg sm:text-xl">{song.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3">
            {song.artist && <span>{song.artist}</span>}
            <a
              href={youtubeWatchUrl(videoId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              Abrir no YouTube <ExternalLink className="h-3 w-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/80">Carregando vídeo…</p>
            </div>
          )}
          <iframe
            src={youtubeEmbedUrl(videoId, { autoplay: true })}
            title={`Vídeo do YouTube - ${song.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
