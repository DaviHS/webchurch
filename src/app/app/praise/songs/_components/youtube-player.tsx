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
        <DialogContent>
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
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl sm:p-0">
        <DialogHeader className="px-4 pb-3 pr-12 pt-4 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="break-words text-lg sm:text-xl">{song.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3">
            {song.artist && <span>{song.artist}</span>}
            <a
              href={youtubeWatchUrl(videoId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-1 underline-offset-4 hover:underline sm:min-h-0"
            >
              Abrir no YouTube <ExternalLink className="size-3.5" />
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
