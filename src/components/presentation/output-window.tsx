"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Maximize } from "lucide-react";
import { useBroadcastChannel } from "@/hooks/use-broadcast-channel";
import { enterFullscreen } from "./fullscreen";
import { useIsFullscreen, useNow, useScreenWakeLock } from "./hooks";
import {
  CONNECTION_TIMEOUT_MS,
  HEARTBEAT_MS,
  OUTPUT_LABELS,
  PRESENTATION_CHANNEL,
  presentationMessageSchema,
  type OutputRole,
  type PresentationCommand,
  type PresentationMessage,
  type PresentationState,
} from "./protocol";
import { ProjectorView } from "./projector-view";
import { StageView } from "./stage-view";

const KEY_COMMANDS: Record<string, PresentationCommand> = {
  ArrowRight: "next",
  ArrowDown: "next",
  PageDown: "next",
  " ": "next",
  ArrowLeft: "previous",
  ArrowUp: "previous",
  PageUp: "previous",
  b: "black",
  B: "black",
  l: "logo",
  L: "logo",
  c: "clear",
  C: "clear",
};

export function OutputWindow({ role }: { role: OutputRole }) {
  const [state, setState] = useState<PresentationState | null>(null);
  const [lastOperatorMessageAt, setLastOperatorMessageAt] = useState(0);
  const [operatorClosed, setOperatorClosed] = useState(false);
  const now = useNow();
  const isFullscreen = useIsFullscreen();

  useScreenWakeLock();

  const post = useBroadcastChannel<PresentationMessage>(PRESENTATION_CHANNEL, {
    schema: presentationMessageSchema,
    onOpen: (send) => send({ type: "HELLO", role }),
    onClose: (send) => send({ type: "BYE", role }),
    onMessage: (message) => {
      switch (message.type) {
        case "STATE":
          setState(message);
          setLastOperatorMessageAt(Date.now());
          setOperatorClosed(false);
          break;
        case "OPERATOR_OFFLINE":
          setOperatorClosed(true);
          break;
        case "CLOSE":
          window.close();
          break;
        default:
          break;
      }
    },
  });

  const heartbeat = useEffectEvent(() => post({ type: "HELLO", role }));
  useEffect(() => {
    const timer = setInterval(heartbeat, HEARTBEAT_MS);
    const onPageHide = () => post({ type: "BYE", role });
    window.addEventListener("pagehide", onPageHide);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [post, role]);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "f" || event.key === "F") {
      enterFullscreen();
      return;
    }
    const command = KEY_COMMANDS[event.key];
    if (command) {
      event.preventDefault();
      post({ type: "COMMAND", command });
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  useEffect(() => {
    document.title = `${OUTPUT_LABELS[role]} - Igreja Central`;
  }, [role]);

  const operatorOnline = !operatorClosed && now > 0 && now - lastOperatorMessageAt < CONNECTION_TIMEOUT_MS;

  return (
    <div className="fixed inset-0 cursor-none select-none" onClick={() => enterFullscreen()}>
      {role === "projector" ? (
        <ProjectorView state={state} />
      ) : (
        <StageView state={state} now={now} operatorOnline={state === null || operatorOnline} />
      )}

      {!isFullscreen && (
        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
          <span className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white shadow-lg">
            <Maximize className="h-4 w-4" />
            {OUTPUT_LABELS[role]}: clique nesta tela (ou tecle F) para tela cheia
          </span>
        </div>
      )}

      {role === "projector" && state === null && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm text-white/60">
          Aguardando o painel de controle…
        </div>
      )}
    </div>
  );
}
