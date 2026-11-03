"use client";

import { useCallback, useEffect, useEffectEvent, useRef } from "react";
import type { z } from "zod";

export type BroadcastPost<TMessage> = (message: TMessage) => boolean;

interface UseBroadcastChannelOptions<TMessage> {
  schema: z.ZodType<TMessage>;
  onMessage?: (message: TMessage, post: BroadcastPost<TMessage>) => void;
  onOpen?: (post: BroadcastPost<TMessage>) => void;
  onClose?: (post: BroadcastPost<TMessage>) => void;
}

function postTo<TMessage>(channel: BroadcastChannel, message: TMessage): boolean {
  try {
    channel.postMessage(message);
    return true;
  } catch (error) {
    console.error("Erro ao enviar mensagem pelo BroadcastChannel:", error);
    return false;
  }
}

export function useBroadcastChannel<TMessage>(
  channelName: string | null,
  { schema, onMessage, onOpen, onClose }: UseBroadcastChannelOptions<TMessage>,
): BroadcastPost<TMessage> {
  const channelRef = useRef<BroadcastChannel | null>(null);

  const handleMessage = useEffectEvent((channel: BroadcastChannel, data: unknown) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.warn("Mensagem inválida ignorada no BroadcastChannel:", result.error.issues);
      return;
    }
    onMessage?.(result.data, (message) => postTo(channel, message));
  });

  const handleOpen = useEffectEvent((channel: BroadcastChannel) => {
    onOpen?.((message) => postTo(channel, message));
  });

  const handleClose = useEffectEvent((channel: BroadcastChannel) => {
    onClose?.((message) => postTo(channel, message));
  });

  useEffect(() => {
    if (!channelName) return;

    let channel: BroadcastChannel;
    try {
      channel = new BroadcastChannel(channelName);
    } catch (error) {
      console.error("Erro ao criar BroadcastChannel:", error);
      return;
    }

    const listener = (event: MessageEvent<unknown>) => handleMessage(channel, event.data);
    channel.addEventListener("message", listener);
    channelRef.current = channel;
    handleOpen(channel);

    return () => {
      handleClose(channel);
      channel.removeEventListener("message", listener);
      channel.close();
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [channelName]);

  return useCallback((message: TMessage) => {
    const channel = channelRef.current;
    return channel ? postTo(channel, message) : false;
  }, []);
}
