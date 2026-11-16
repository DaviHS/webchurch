"use client";

import { useEffect, useEffectEvent, useRef } from "react";

const PLAYER_ORIGIN = "https://www.youtube-nocookie.com";

interface ProjectorVideoProps {
  videoId: string;
  playing: boolean;
  onError?: (videoId: string) => void;
  seek?: { delta: number; nonce: number } | null;
}

export function ProjectorVideo({ videoId, playing, onError, seek }: ProjectorVideoProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const currentTime = useRef(0);

  const send = (message: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify(message), PLAYER_ORIGIN);
  };
  const command = (func: "playVideo" | "pauseVideo") => send({ event: "command", func, args: [] });

  const syncPlayback = useEffectEvent((shouldPlay: boolean) => command(shouldPlay ? "playVideo" : "pauseVideo"));

  useEffect(() => {
    syncPlayback(playing);
  }, [playing]);

  const reportError = useEffectEvent(() => onError?.(videoId));

  const seekNonce = seek?.nonce ?? 0;
  const applySeek = useEffectEvent(() => {
    if (!seek) return;
    const target = Math.max(0, currentTime.current + seek.delta);
    currentTime.current = target;
    send({ event: "command", func: "seekTo", args: [target, true] });
  });
  const appliedNonce = useRef(seekNonce);
  useEffect(() => {
    if (seekNonce === appliedNonce.current) return;
    appliedNonce.current = seekNonce;
    applySeek();
  }, [seekNonce]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin !== PLAYER_ORIGIN || event.source !== frame.current?.contentWindow) return;
      if (typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data) as { event?: string; info?: { currentTime?: number } | null };
        if (data.event === "onError") reportError();
        const time = data.info?.currentTime;
        if (typeof time === "number") currentTime.current = time;
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
