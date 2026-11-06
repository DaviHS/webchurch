"use client";

import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SpotifyPlayerProps {
  song: {
    title: string;
    artist?: string;
    spotifyUrl?: string;
    spotifyTrackId?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpotifyPlayer({ song, open, onOpenChange }: SpotifyPlayerProps) {
  const trackId = song.spotifyTrackId;

  if (!trackId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faixa não disponível</DialogTitle>
            <DialogDescription>
              Esta música não tem uma faixa do Spotify válida. Edite a música e cole o link da faixa (ou deixe em branco
              para buscar automaticamente).
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl sm:p-0">
        <DialogHeader className="px-4 pb-3 pr-12 pt-4 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="break-words text-lg sm:text-xl">{song.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3">
            {song.artist && <span>{song.artist}</span>}
            <a
              href={song.spotifyUrl ?? `https://open.spotify.com/track/${trackId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-1 underline-offset-4 hover:underline sm:min-h-0"
            >
              Abrir no Spotify <ExternalLink className="size-3.5" />
            </a>
          </DialogDescription>
        </DialogHeader>
        <iframe
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
          title={`Faixa do Spotify - ${song.title}`}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="h-[352px] w-full border-0"
        />
      </DialogContent>
    </Dialog>
  );
}
