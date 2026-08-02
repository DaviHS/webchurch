"use client";

import { useEffect, useRef, useCallback } from "react";

type MessageType = "NAVIGATE" | "SONG_CHANGE" | "CLOSE" | "BLACK_SCREEN" | "READY";

interface BroadcastMessage {
  type: MessageType;
  payload?: any;
}

export function useBroadcastChannel(channelName: string) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!channelName) return;

    try {
      channelRef.current = new BroadcastChannel(channelName);
    } catch (error) {
      console.error("Erro ao criar BroadcastChannel:", error);
    }

    return () => {
      try {
        channelRef.current?.close();
      } catch (error) {
        // Canal já pode estar fechado
      }
      channelRef.current = null;
    };
  }, [channelName]);

  const sendMessage = useCallback((message: BroadcastMessage) => {
    if (!mountedRef.current) return;
    
    try {
      channelRef.current?.postMessage(message);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  }, []);

  const onMessage = useCallback((handler: (message: BroadcastMessage) => void) => {
    const channel = channelRef.current;
    if (!channel) {
      return () => {};
    }

    const listener = (event: MessageEvent<BroadcastMessage>) => {
      if (!mountedRef.current) return;
      handler(event.data);
    };

    channel.addEventListener("message", listener);

    return () => {
      try {
        channel.removeEventListener("message", listener);
      } catch (error) {
        // Canal já pode estar fechado
      }
    };
  }, []);

  return { sendMessage, onMessage };
}