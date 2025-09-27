// components/youtube-player.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface YouTubePlayerProps {
  song: {
    title: string;
    artist?: string;
    youtubeUrl?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function YouTubePlayer({ song, open, onOpenChange }: YouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const videoId = song.youtubeUrl ? getYouTubeId(song.youtubeUrl) : null;

  if (!videoId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Vídeo não disponível</DialogTitle>
          </DialogHeader>
          <p>Esta música não possui um link do YouTube válido.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl">Assistir - {song.title}</DialogTitle>
          {song.artist && (
            <p className="text-muted-foreground text-sm sm:text-base">por {song.artist}</p>
          )}
        </DialogHeader>
        
        <div className="relative pt-[56.25%] bg-black"> {/* 16:9 aspect ratio */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <p className="text-white">Carregando vídeo...</p>
            </div>
          )}
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={`YouTube video player - ${song.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}