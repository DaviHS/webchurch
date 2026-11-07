"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Music,
  Square,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { ProjectorMode } from "../protocol";
import { plainSlideText } from "../deck";
import {
  REMOTE_POLL_MS,
  REMOTE_STALE_SECONDS,
  remoteCodeSchema,
  type RemoteCommand,
  type RemoteOutline,
} from "../remote-protocol";
import { RemotePicker } from "./remote-picker";

const STORAGE_KEY = "remote-code";
const TAP_GUARD_MS = 250;
const NO_OUTLINE: RemoteOutline = [];

type Tab = "control" | "repertoire" | "slides";

const TABS: { value: Tab; label: string }[] = [
  { value: "control", label: "Controle" },
  { value: "repertoire", label: "Repertório" },
  { value: "slides", label: "Slides" },
];

const isTab = (value: string): value is Tab => TABS.some((tab) => tab.value === value);

const MODE_BUTTONS: { command: "black" | "logo" | "clear"; mode: ProjectorMode; label: string; icon: typeof Square }[] = [
  { command: "black", mode: "black", label: "Tela preta", icon: Square },
  { command: "logo", mode: "logo", label: "Logo", icon: ImageIcon },
  { command: "clear", mode: "clear", label: "Sem letra", icon: Type },
];

const MODE_LABELS: Record<ProjectorMode, string> = {
  live: "Ao vivo",
  black: "Tela preta",
  logo: "Logo",
  clear: "Sem letra",
};

function tapAllowed(lastTap: RefObject<number>): boolean {
  const now = Date.now();
  if (now - lastTap.current < TAP_GUARD_MS) return false;
  lastTap.current = now;
  return true;
}

function readStoredCode(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && remoteCodeSchema.safeParse(stored).success ? stored : null;
  } catch {
    return null;
  }
}

function storeCode(code: string | null) {
  try {
    if (code) localStorage.setItem(STORAGE_KEY, code);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function RemoteController({ initialCode }: { initialCode: string | null }) {
  const [code, setCodeState] = useState<string | null>(() =>
    initialCode && remoteCodeSchema.safeParse(initialCode).success ? initialCode : readStoredCode(),
  );
  const [tab, setTab] = useState<Tab>("control");
  const [pin, setPin] = useState<{ song: number; liveSong: number | null } | null>(null);
  const lastTap = useRef(0);

  const setCode = (next: string | null) => {
    storeCode(next);
    setCodeState(next);
    setPin(null);
    setTab("control");
  };

  const stateQuery = api.remote.getState.useQuery(
    { code: code ?? "0000" },
    { enabled: code !== null, refetchInterval: REMOTE_POLL_MS, staleTime: 0 },
  );
  const rev = stateQuery.data?.outlineRev ?? 0;
  const outlineQuery = api.remote.getOutline.useQuery(
    { code: code ?? "0000", rev },
    { enabled: code !== null && stateQuery.data !== undefined, staleTime: Infinity },
  );
  const send = api.remote.sendCommand.useMutation();

  const state = stateQuery.data?.state ?? null;
  const outline = outlineQuery.data ?? NO_OUTLINE;
  const liveSong = state?.position?.song ?? null;
  const liveSlide = state?.position?.slide ?? null;
  const lastSong = Math.max(outline.length - 1, 0);
  const selectedSong = clamp(pin?.liveSong === liveSong ? pin.song : (liveSong ?? pin?.song ?? 0), 0, lastSong);

  useEffect(() => {
    if (tab !== "repertoire" || liveSong === null) return;
    document.getElementById(`remote-song-${liveSong}`)?.scrollIntoView({ block: "nearest" });
  }, [tab, liveSong]);

  useEffect(() => {
    if (tab !== "slides" || liveSong === null || liveSlide === null || liveSong !== selectedSong) return;
    document.getElementById(`remote-slide-${liveSong}-${liveSlide}`)?.scrollIntoView({ block: "nearest" });
  }, [tab, liveSong, liveSlide, selectedSong]);

  if (code === null) return <RemotePicker onSelect={setCode} />;

  const errorCode = stateQuery.error?.data?.code;

  if (!stateQuery.data && stateQuery.error) {
    return (
      <RemotePicker
        error={errorCode === "NOT_FOUND" ? stateQuery.error.message : "Não foi possível conectar. Tente de novo."}
        onSelect={setCode}
      />
    );
  }

  if (!stateQuery.data) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const { ageSeconds } = stateQuery.data;
  const offline = stateQuery.isError || ageSeconds >= REMOTE_STALE_SECONDS;
  const mode = state?.mode ?? "logo";
  const song = outline[selectedSong];

  const press = (command: RemoteCommand) => {
    if (!tapAllowed(lastTap)) return;
    send.mutate({ code, command });
  };

  const selectSong = (index: number) => {
    setPin({ song: index, liveSong });
    setTab("slides");
  };

  const moveSong = (delta: number) => setPin({ song: clamp(selectedSong + delta, 0, lastSong), liveSong });

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold leading-tight">{stateQuery.data.title || "Projeção"}</h1>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("size-2 rounded-full", offline ? "bg-red-500" : "bg-emerald-500")} />
            {offline ? "Computador desconectado" : `Conectado · código ${code}`}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setCode(null)}>
          Trocar
        </Button>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (isTab(value)) setTab(value);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mx-3 mt-2 grid h-11 shrink-0 grid-cols-3">
          {TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="h-9">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="control" className="mt-0 min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <section className="space-y-1 rounded-lg border-2 border-red-500/70 bg-red-500/5 p-3">
            <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-white", mode === "live" ? "bg-red-500" : "bg-zinc-600")}>
                {MODE_LABELS[mode].toUpperCase()}
              </span>
              {liveSong !== null && outline.length > 0 && (
                <span className="shrink-0">
                  Música {liveSong + 1}/{outline.length}
                </span>
              )}
              {state?.songTitle && <span className="truncate">· {state.songTitle}</span>}
            </p>
            {state?.live ? (
              <>
                <p className="text-xs font-semibold text-muted-foreground">{state.live.label}</p>
                <p className="whitespace-pre-line text-base font-semibold leading-snug">{state.live.text}</p>
              </>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">Nenhum slide no ar.</p>
            )}
          </section>

          <section className="space-y-1 rounded-lg border p-3">
            <p className="text-xs font-bold text-sky-600">PRÓXIMA{state?.next ? ` · ${state.next.label}` : ""}</p>
            <p className="line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">
              {state?.next?.text ?? "Fim do repertório."}
            </p>
          </section>
        </TabsContent>

        <TabsContent value="repertoire" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
          {outline.length === 0 && <p className="text-sm text-muted-foreground">Carregando repertório…</p>}
          <ol className="space-y-1.5">
            {outline.map((item, index) => {
              const isLive = liveSong === index;
              return (
                <li key={`${index}:${item.title}`}>
                  <button
                    id={`remote-song-${index}`}
                    type="button"
                    onClick={() => selectSong(index)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-lg border-2 p-3 text-left",
                      isLive
                        ? "border-red-500 bg-red-500/10"
                        : index === selectedSong
                          ? "border-primary bg-primary/10"
                          : "border-border active:bg-accent",
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {item.slides.length === 0
                          ? "Sem letra"
                          : `${item.kind === "bible" ? item.slides.length : Math.max(0, item.slides.length - 1)} ${item.kind === "bible" ? "slides" : "estrofes"}`}
                      </span>
                    </span>
                    {isLive && <span className="shrink-0 rounded bg-red-500 px-1 text-xs font-bold text-white">AO VIVO</span>}
                    {item.kind === "bible" ? (
                      <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Music className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </TabsContent>

        <TabsContent value="slides" className="mt-0 min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {!song && <p className="text-sm text-muted-foreground">Carregando slides…</p>}
          {song && (
            <>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={selectedSong <= 0}
                  onClick={() => moveSong(-1)}
                  aria-label="Música anterior"
                >
                  <ChevronLeft />
                </Button>
                <div className="min-w-0 flex-1 text-center">
                  <p className="text-xs text-muted-foreground">
                    Música {selectedSong + 1} de {outline.length}
                  </p>
                  <h2 className="truncate font-bold leading-tight">{song.title}</h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={selectedSong >= lastSong}
                  onClick={() => moveSong(1)}
                  aria-label="Próxima música"
                >
                  <ChevronRight />
                </Button>
              </div>
              {song.slides.length === 0 && <p className="text-sm text-muted-foreground">Esta música não tem letra cadastrada.</p>}
              <div className="grid grid-cols-2 gap-2">
                {song.slides.map((slide, slideIndex) => {
                  const isLive = liveSong === selectedSong && liveSlide === slideIndex;
                  return (
                    <button
                      key={slideIndex}
                      id={`remote-slide-${selectedSong}-${slideIndex}`}
                      type="button"
                      onClick={() => press({ type: "goto", song: selectedSong, slide: slideIndex })}
                      className={cn(
                        "flex min-h-20 flex-col gap-1 rounded-lg border-2 p-2 text-left text-xs leading-snug",
                        isLive ? "border-red-500 bg-red-500/10" : "border-border active:bg-accent",
                      )}
                    >
                      <span className="font-bold text-muted-foreground">{slide.label}</span>
                      <span className="line-clamp-3 whitespace-pre-line">{plainSlideText(slide.text)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <nav
        aria-label="Controles da apresentação"
        className="shrink-0 space-y-2 border-t bg-background px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-3 gap-2">
          {MODE_BUTTONS.map(({ command, mode: target, label, icon: Icon }) => (
            <Button
              key={command}
              type="button"
              size="sm"
              variant={mode === target ? "default" : "outline"}
              className="h-auto min-w-0 flex-col gap-0.5 px-1 py-1.5 text-center text-xs leading-tight whitespace-normal sm:h-auto"
              aria-pressed={mode === target}
              onClick={() => press({ type: command })}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-16 flex-1 text-base [&_svg]:size-5" onClick={() => press({ type: "previous" })}>
            <ChevronLeft />
            Anterior
          </Button>
          <Button type="button" className="h-16 flex-1 text-base [&_svg]:size-5" onClick={() => press({ type: "next" })}>
            Próxima
            <ChevronRight />
          </Button>
        </div>
      </nav>
    </div>
  );
}
