"use client";

import { useEffect, useEffectEvent, useRef } from "react";

const PLAYER_ORIGIN = "https://www.youtube-nocookie.com";

interface ProjectorVideoProps {
  videoId: string;
  playing: boolean;
  onError?: (videoId: string) => void;
}

export function ProjectorVideo({ videoId, playing, onError }: ProjectorVideoProps) {
  const frame = useRef<HTMLIFrameElement>(null);

  const send = (message: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify(message), PLAYER_ORIGIN);
  };
  const command = (func: "playVideo" | "pauseVideo") => send({ event: "command", func, args: [] });

  const syncPlayback = useEffectEvent((shouldPlay: boolean) => command(shouldPlay ? "playVideo" : "pauseVideo"));

  useEffect(() => {
    syncPlayback(playing);
  }, [playing]);

  const reportError = useEffectEvent(() => onError?.(videoId));

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin !== PLAYER_ORIGIN || event.source !== frame.current?.contentWindow) return;
      if (typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data) as { event?: string };
        if (data.event === "onError") reportError();
      } catch {}
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  const origin = typeof window === "undefined" ? "" : `&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <iframe
      ref={frame}
      key={videoId}
      title="Vídeo do YouTube"
      src={`${PLAYER_ORIGIN}/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&controls=0&playsinline=1&iv_load_policy=3${origin}`}
      allow="autoplay; encrypted-media; fullscreen"
      referrerPolicy="strict-origin-when-cross-origin"
      className="absolute inset-0 h-full w-full border-0 bg-black"
      onLoad={() => {
        send({ event: "listening", id: "projector", channel: "widget" });
        command(playing ? "playVideo" : "pauseVideo");
      }}
    />
  );
}
