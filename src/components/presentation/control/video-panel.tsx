"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ExternalLink, MonitorPlay, Pause, Play, RotateCcw, SkipBack, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractYouTubeVideoId, youtubeWatchUrl } from "@/lib/youtube-url";
import { toastError } from "@/lib/toast";
import { openExternalWindow, resolveScreen, useDetectedScreens, useScreenAssignments } from "../screens";

const SEEK_STEP = 10;
const SEEK_RESTART = 1_000_000;

interface VideoPanelProps {
  video: { id: string; playing: boolean; blocked?: boolean } | null;
  onShow: (videoId: string) => void;
  onTogglePlaying: () => void;
  onClose: () => void;
  onSeek: (delta: number) => void;
}

export function VideoPanel({ video, onShow, onTogglePlaying, onClose, onSeek }: VideoPanelProps) {
  const [link, setLink] = useState("");
  const externalWindow = useRef<Window | null>(null);
  const screens = useDetectedScreens();
  const assignments = useScreenAssignments();

  const closeExternal = () => {
    try {
      externalWindow.current?.close();
    } catch {}
    externalWindow.current = null;
  };

  const openOnYouTube = (videoId: string) => {
    const win = openExternalWindow(youtubeWatchUrl(videoId), "webchurch-youtube", resolveScreen(assignments.projector, screens));
    if (!win) {
      toastError("O navegador bloqueou a janela do YouTube. Toque em “Abrir no YouTube”.");
      return;
    }
    externalWindow.current = win;
  };

  const blockedId = video?.blocked ? video.id : null;
  const openBlocked = useEffectEvent((videoId: string) => openOnYouTube(videoId));
  useEffect(() => {
    if (blockedId) openBlocked(blockedId);
  }, [blockedId]);

  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <MonitorPlay className="h-3.5 w-3.5" /> Vídeo do YouTube
      </h2>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const videoId = extractYouTubeVideoId(link);
          if (!videoId) {
            toastError("Link do YouTube inválido.");
            return;
          }
          closeExternal();
          onShow(videoId);
          setLink("");
        }}
      >
        <Input
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="Cole o link do vídeo"
          inputMode="url"
          aria-label="Link do vídeo do YouTube"
        />
        <Button type="submit" disabled={link.trim() === ""}>
          Exibir
        </Button>
      </form>

      {video && !video.blocked && (
        <div className="space-y-2 rounded-md bg-red-500/10 p-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-medium">{video.playing ? "Vídeo no projetor" : "Vídeo pausado"}</span>
            <Button type="button" size="icon-sm" variant="ghost" className="shrink-0" onClick={onClose} aria-label="Fechar o vídeo">
              <X />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => onSeek(-SEEK_RESTART)} aria-label="Voltar ao início" title="Voltar ao início">
              <RotateCcw />
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onSeek(-SEEK_STEP)} aria-label="Voltar 10 segundos" title="Voltar 10 segundos">
              <SkipBack />
              10s
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onTogglePlaying} aria-label={video.playing ? "Pausar" : "Tocar"}>
              {video.playing ? <Pause /> : <Play />}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onSeek(SEEK_STEP)} aria-label="Avançar 10 segundos" title="Avançar 10 segundos">
              10s
              <SkipForward />
            </Button>
          </div>
        </div>
      )}

      {video?.blocked && (
        <div className="space-y-2 rounded-md bg-yellow-400/20 p-2 text-sm">
          <p>Este vídeo só toca no próprio YouTube. Ele foi aberto numa janela na tela do projetor.</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => openOnYouTube(video.id)}>
              <ExternalLink />
              Abrir no YouTube
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                closeExternal();
                onClose();
              }}
            >
              <X />
              Fechar o vídeo
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
