"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { slideAt, slideLabel } from "./deck";
import {
  REMOTE_HEARTBEAT_MS,
  REMOTE_POLL_MS,
  type RemoteCommand,
  type RemoteOutline,
  type RemoteState,
} from "./remote-protocol";
import type { PresentationController } from "./use-presentation-controller";

const clip = (text: string, max: number) => (text.length > max ? text.slice(0, max) : text);

const isSessionGone = (error: unknown) =>
  error instanceof TRPCClientError && (error.data as { code?: string } | undefined)?.code === "NOT_FOUND";

export function useRemoteHost(controller: PresentationController) {
  const utils = api.useUtils();
  const createSession = api.remote.create.useMutation();
  const publish = api.remote.publish.useMutation();
  const closeSession = api.remote.close.useMutation();

  const [code, setCode] = useState<string | null>(null);
  const [lastCommandAt, setLastCommandAt] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);
  const lastIdRef = useRef(0);
  const sentOutlineRef = useRef<RemoteOutline | null>(null);
  const publishingRef = useRef(false);
  const dirtyRef = useRef(false);

  const { deck, live, next, mode, broadcastState } = controller;

  const outline = useMemo<RemoteOutline>(
    () =>
      deck
        ? deck.songs.slice(0, 100).map((song, songIndex) => ({
            title: clip(song.title, 200),
            kind: song.kind,
            slides: song.slides.slice(0, 400).map((text, slide) => ({
              text: clip(text, 2000),
              label: clip(slideLabel(deck, { song: songIndex, slide }), 100),
            })),
          }))
        : [],
    [deck],
  );

  const state = useMemo<RemoteState | null>(() => {
    if (!deck) return null;
    return {
      title: clip(deck.title, 200),
      mode,
      songTitle: broadcastState.song ? clip(broadcastState.song.title, 200) : null,
      live: broadcastState.live
        ? { text: clip(broadcastState.live.text, 2000), label: clip(broadcastState.live.label, 100) }
        : null,
      next: next
        ? { text: clip(slideAt(deck, next) ?? "", 2000), label: clip(slideLabel(deck, next), 100) }
        : null,
      position: live,
    };
  }, [deck, mode, broadcastState.song, broadcastState.live, next, live]);

  const endSession = () => {
    setCode(null);
  };

  const push = useEffectEvent(async () => {
    if (!code || !state) return;
    if (publishingRef.current) {
      dirtyRef.current = true;
      return;
    }
    publishingRef.current = true;
    const sendOutline = sentOutlineRef.current !== outline;
    await publish
      .mutateAsync({ code, state, ...(sendOutline ? { outline } : {}) })
      .then(() => {
        if (sendOutline) sentOutlineRef.current = outline;
      })
      .catch((error: unknown) => {
        if (isSessionGone(error)) {
          endSession();
          toast.error("O controle remoto foi encerrado. Ative de novo para gerar outro código.");
        }
      });
    publishingRef.current = false;
    if (dirtyRef.current) {
      dirtyRef.current = false;
      setRetry((value) => value + 1);
    }
  });

  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => void push(), 120);
    return () => clearTimeout(timer);
  }, [code, state, outline, retry]);

  useEffect(() => {
    if (!code) return;
    const timer = setInterval(() => void push(), REMOTE_HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [code]);

  const apply = useEffectEvent((command: RemoteCommand) => {
    switch (command.type) {
      case "next":
        controller.goNext();
        break;
      case "previous":
        controller.goPrevious();
        break;
      case "goto":
        controller.goTo({ song: command.song, slide: command.slide });
        break;
      default:
        controller.toggleMode(command.type);
    }
  });

  const poll = useEffectEvent(async () => {
    if (!code) return;
    await utils.remote.pollCommands
      .fetch({ code, afterId: lastIdRef.current }, { staleTime: 0 })
      .then((result) => {
        lastIdRef.current = result.lastId;
        if (result.commands.length > 0) {
          result.commands.forEach((item) => apply(item.command));
          setLastCommandAt(Date.now());
        }
      })
      .catch(() => undefined);
  });

  useEffect(() => {
    if (!code) return;
    let busy = false;
    const timer = setInterval(() => {
      if (busy) return;
      busy = true;
      void poll().finally(() => {
        busy = false;
      });
    }, REMOTE_POLL_MS);
    return () => clearInterval(timer);
  }, [code]);

  const start = async () => {
    if (!deck) return;
    await createSession
      .mutateAsync({ title: clip(deck.title, 200), deckKey: clip(deck.key, 100) })
      .then((result) => {
        lastIdRef.current = result.lastCommandId;
        sentOutlineRef.current = null;
        setCode(result.code);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Não foi possível ativar o controle remoto.");
      });
  };

  const stop = () => {
    if (!code) return;
    closeSession.mutate({ code });
    endSession();
  };

  return { code, starting: createSession.isPending, start, stop, lastCommandAt };
}

export type RemoteHost = ReturnType<typeof useRemoteHost>;
