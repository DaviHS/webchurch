"use client";

import { useEffect, useEffectEvent, useMemo, useReducer, useRef, useState } from "react";
import { useBroadcastChannel } from "@/hooks/use-broadcast-channel";
import {
  isValidPosition,
  nextPosition,
  passageToDeckSong,
  previousPosition,
  slideAt,
  slideLabel,
  toDeckSong,
  type Deck,
  type DeckSong,
  type DeckSongSource,
  type PassageSource,
  type Position,
} from "./deck";
import { useNow } from "./hooks";
import {
  CONNECTION_TIMEOUT_MS,
  HEARTBEAT_MS,
  OUTPUT_ROLES,
  PRESENTATION_CHANNEL,
  presentationMessageSchema,
  type OutputRole,
  type PresentationCommand,
  type PresentationMessage,
  type PresentationState,
  type ProjectorMode,
} from "./protocol";

interface ControllerState {
  live: Position | null;
  mode: ProjectorMode;
  stageMessage: string;
  timerStartedAt: number | null;
  adHocSongs: DeckSong[];
}

type Action =
  | { type: "goTo"; position: Position }
  | { type: "toggleMode"; mode: Exclude<ProjectorMode, "live"> }
  | { type: "setStageMessage"; message: string }
  | { type: "startTimer"; at: number }
  | { type: "stopTimer" }
  | { type: "addSong"; song: DeckSong }
  | { type: "removeSong"; uid: string }
  | { type: "replaceSong"; song: DeckSong; live: Position | null };

const initialState: ControllerState = {
  live: null,
  mode: "logo",
  stageMessage: "",
  timerStartedAt: null,
  adHocSongs: [],
};

function reducer(state: ControllerState, action: Action): ControllerState {
  switch (action.type) {
    case "goTo":
      return { ...state, live: action.position, mode: "live" };
    case "toggleMode":
      return { ...state, mode: state.mode === action.mode ? "live" : action.mode };
    case "setStageMessage":
      return { ...state, stageMessage: action.message };
    case "startTimer":
      return { ...state, timerStartedAt: action.at };
    case "stopTimer":
      return { ...state, timerStartedAt: null };
    case "addSong":
      return { ...state, adHocSongs: [...state.adHocSongs, action.song] };
    case "removeSong":
      return { ...state, adHocSongs: state.adHocSongs.filter((song) => song.uid !== action.uid) };
    case "replaceSong":
      return {
        ...state,
        adHocSongs: state.adHocSongs.map((song) => (song.uid === action.song.uid ? action.song : song)),
        live: action.live ?? state.live,
      };
  }
}

export type OutputConnections = Record<OutputRole, boolean>;

export function usePresentationController(baseDeck: Deck | null) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [lastSeen, setLastSeen] = useState<Record<OutputRole, number>>({ projector: 0, stage: 0 });
  const now = useNow();

  const deck: Deck | null = useMemo(
    () => (baseDeck ? { ...baseDeck, songs: [...baseDeck.songs, ...state.adHocSongs] } : null),
    [baseDeck, state.adHocSongs]
  );

  const live = deck && isValidPosition(deck, state.live) ? state.live : null;
  const next = deck ? nextPosition(deck, live) : null;

  const liveRef = useRef<Position | null>(null);
  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  const goTo = (position: Position) => {
    liveRef.current = position;
    dispatch({ type: "goTo", position });
  };

  const broadcastState: PresentationState = useMemo(() => {
    const liveSong = live && deck ? deck.songs[live.song] : undefined;
    const showNextSlide = next !== null && (live === null || next.song === live.song);

    return {
      type: "STATE",
      mode: live === null && state.mode === "live" ? "logo" : state.mode,
      live: live && deck ? { text: slideAt(deck, live) ?? "", label: slideLabel(deck, live) } : null,
      next: showNextSlide && deck ? { text: slideAt(deck, next) ?? "", label: slideLabel(deck, next) } : null,
      song:
        live && liveSong && deck
          ? { title: liveSong.title, artist: liveSong.artist, position: live.song + 1, total: deck.songs.length }
          : null,
      nextSongTitle: live && deck ? (deck.songs[live.song + 1]?.title ?? null) : null,
      stageMessage: state.stageMessage,
      timerStartedAt: state.timerStartedAt,
    };
  }, [deck, live, next, state.mode, state.stageMessage, state.timerStartedAt]);

  const handleCommand = (command: PresentationCommand) => {
    if (!deck) return;
    if (command === "next") {
      const target = nextPosition(deck, liveRef.current);
      if (target) goTo(target);
    } else if (command === "previous") {
      const target = previousPosition(deck, liveRef.current);
      if (target) goTo(target);
    } else {
      dispatch({ type: "toggleMode", mode: command });
    }
  };

  const post = useBroadcastChannel<PresentationMessage>(PRESENTATION_CHANNEL, {
    schema: presentationMessageSchema,
    onMessage: (message, reply) => {
      switch (message.type) {
        case "HELLO":
          setLastSeen((prev) => ({ ...prev, [message.role]: Date.now() }));
          reply(broadcastState);
          break;
        case "BYE":
          setLastSeen((prev) => ({ ...prev, [message.role]: 0 }));
          break;
        case "COMMAND":
          handleCommand(message.command);
          break;
        default:
          break;
      }
    },
    onClose: (send) => send({ type: "OPERATOR_OFFLINE" }),
  });

  useEffect(() => {
    post(broadcastState);
  }, [post, broadcastState]);

  const resend = useEffectEvent(() => post(broadcastState));
  useEffect(() => {
    const timer = setInterval(resend, HEARTBEAT_MS);
    const onPageHide = () => post({ type: "OPERATOR_OFFLINE" });
    window.addEventListener("pagehide", onPageHide);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [post]);

  const connections = Object.fromEntries(
    OUTPUT_ROLES.map((role) => [role, now > 0 && now - lastSeen[role] < CONNECTION_TIMEOUT_MS])
  ) as OutputConnections;

  const reslicePassage = (current: DeckSong, updated: DeckSong) => {
    const songIndex = deck ? deck.songs.findIndex((song) => song.uid === current.uid) : -1;
    let nextLive: Position | null = null;
    if (live?.song === songIndex) {
      const firstVerse = current.slideFirstVerse?.[live.slide] ?? 0;
      let slide = 0;
      (updated.slideFirstVerse ?? []).forEach((verse, index) => {
        if (verse <= firstVerse) slide = index;
      });
      nextLive = { song: songIndex, slide };
    }
    dispatch({ type: "replaceSong", song: updated, live: nextLive });
  };

  return {
    deck,
    live,
    next,
    mode: broadcastState.mode,
    broadcastState,
    stageMessage: state.stageMessage,
    timerStartedAt: state.timerStartedAt,
    connections,
    now,
    goTo,
    goNext: () => handleCommand("next"),
    goPrevious: () => handleCommand("previous"),
    toggleMode: (mode: Exclude<ProjectorMode, "live">) => dispatch({ type: "toggleMode", mode }),
    setStageMessage: (message: string) => dispatch({ type: "setStageMessage", message }),
    startTimer: () => dispatch({ type: "startTimer", at: Date.now() }),
    stopTimer: () => dispatch({ type: "stopTimer" }),
    addSong: (source: DeckSongSource) =>
      dispatch({ type: "addSong", song: toDeckSong(source, `adhoc:${source.id}:${Date.now()}`, true) }),
    addPassage: (song: DeckSong) => dispatch({ type: "addSong", song }),
    setVersesPerSlide: (uid: string, perSlide: number | null) => {
      const current = state.adHocSongs.find((song) => song.uid === uid);
      if (!current?.source) return;
      reslicePassage(current, passageToDeckSong(current.source, uid, perSlide));
    },
    setPassageVersion: (uid: string, passage: PassageSource) => {
      const current = state.adHocSongs.find((song) => song.uid === uid);
      if (!current?.source) return;
      reslicePassage(current, passageToDeckSong(passage, uid, current.versesPerSlide));
    },
    removeSong: (uid: string) => dispatch({ type: "removeSong", uid }),
    closeOutputs: () => post({ type: "CLOSE" }),
  };
}

export type PresentationController = ReturnType<typeof usePresentationController>;
