"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Image as ImageIcon,
  Keyboard,
  Loader2,
  MessageSquareWarning,
  MonitorCog,
  Projector,
  Smartphone,
  Square,
  Timer,
  TimerOff,
  Tv,
  Type,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { buildDeck, passageToDeckSong, samePosition, type DeckSong, type DeckSongSource, type Position } from "../deck";
import { loadCachedDeck, saveCachedDeck } from "../deck-cache";
import { formatElapsed } from "../hooks";
import { ProjectorView } from "../projector-view";
import { OUTPUT_LABELS, OUTPUT_ROLES, type OutputRole, type ProjectorMode } from "../protocol";
import {
  detectScreensIfPermitted,
  openOutputWindow,
  resolveScreen,
  useDetectedScreens,
  useScreenAssignments,
} from "../screens";
import { StageView } from "../stage-view";
import { usePresentationController, type PresentationController } from "../use-presentation-controller";
import { useRemoteHost, type RemoteHost } from "../use-remote-host";
import { RemoteDialog } from "./remote-dialog";
import { ScreenSetupDialog } from "./screen-setup-dialog";
import { SlideGrid } from "./slide-grid";
import { Setlist } from "./setlist";

export type DeckRequest = { eventId: number } | { songId: number } | { bible: true };

export interface InitialPassage {
  version: string;
  reference: string;
  versesPerSlide?: number | null;
}

const deckKey = (request: DeckRequest) =>
  "eventId" in request ? `event-${request.eventId}` : "songId" in request ? `song-${request.songId}` : "bible";

const OUTPUT_ICONS: Record<OutputRole, typeof Projector> = { projector: Projector, stage: Tv };

const MODE_BUTTONS: { mode: Exclude<ProjectorMode, "live">; label: string; key: string; icon: typeof Square }[] = [
  { mode: "black", label: "Tela preta", key: "B", icon: Square },
  { mode: "logo", label: "Logo", key: "L", icon: ImageIcon },
  { mode: "clear", label: "Sem letra", key: "C", icon: Type },
];

const SHORTCUTS: [string, string][] = [
  ["→ / Espaço", "Próxima"],
  ["←", "Anterior"],
  ["1–9", "Estrofe da música"],
  ["B / L / C", "Preto / Logo / Sem letra"],
  ["Esc", "Voltar a letra"],
];

type ConsoleTab = "setlist" | "slides" | "outputs";

const CONSOLE_TABS: { value: ConsoleTab; label: string }[] = [
  { value: "setlist", label: "Repertório" },
  { value: "slides", label: "Estrofes" },
  { value: "outputs", label: "Saídas" },
];

const isConsoleTab = (value: string): value is ConsoleTab => CONSOLE_TABS.some((tab) => tab.value === value);

const PANEL_CLASS = "mt-0 min-h-0 data-[state=inactive]:hidden lg:data-[state=inactive]:block";

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function OutputControls({ controller, remote }: { controller: PresentationController; remote: RemoteHost }) {
  const screens = useDetectedScreens();
  const assignments = useScreenAssignments();
  const [setupOpen, setSetupOpen] = useState(false);
  const [remoteOpen, setRemoteOpen] = useState(false);

  const open = (role: OutputRole) => {
    const screen = resolveScreen(assignments[role], screens);
    if (assignments[role] && screens.length > 0 && !screen) {
      toast.warning(`A tela do ${OUTPUT_LABELS[role].toLowerCase()} não foi encontrada. Ela está ligada?`);
    }
    const win = openOutputWindow(role, screen);
    if (!win) {
      toast.error(`O navegador bloqueou a janela do ${OUTPUT_LABELS[role].toLowerCase()}. Permita pop-ups para este site.`);
    }
  };

  return (
    <div className="hidden flex-wrap items-center gap-2 md:flex">
      {OUTPUT_ROLES.map((role) => {
        const Icon = OUTPUT_ICONS[role];
        const connected = controller.connections[role];
        return (
          <Button
            key={role}
            type="button"
            size="sm"
            variant={connected ? "outline" : "default"}
            onClick={() => open(role)}
            title={connected ? `Reposicionar ${OUTPUT_LABELS[role]}` : `Abrir ${OUTPUT_LABELS[role]}`}
          >
            <span className={cn("mr-2 h-2 w-2 rounded-full", connected ? "bg-emerald-500" : "bg-red-500")} />
            <Icon className="mr-1 h-4 w-4" />
            {OUTPUT_LABELS[role]}
            {!connected && <span className="ml-1 font-normal opacity-80">· abrir</span>}
          </Button>
        );
      })}
      <Button type="button" size="sm" variant="ghost" onClick={() => setSetupOpen(true)}>
        <MonitorCog className="mr-1 h-4 w-4" />
        Telas
      </Button>
      <Button type="button" size="sm" variant={remote.code ? "outline" : "ghost"} onClick={() => setRemoteOpen(true)}>
        <span className={cn("h-2 w-2 rounded-full", remote.code ? "bg-emerald-500" : "bg-muted-foreground/40")} />
        <Smartphone className="mr-1 h-4 w-4" />
        Celular
      </Button>
      <ScreenSetupDialog open={setupOpen} onOpenChange={setSetupOpen} />
      <RemoteDialog open={remoteOpen} onOpenChange={setRemoteOpen} host={remote} now={controller.now} />
    </div>
  );
}

function SidePanel({ controller }: { controller: PresentationController }) {
  const [draft, setDraft] = useState("");
  const { mode, timerStartedAt, now, stageMessage } = controller;

  return (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-4">
        <section className="space-y-2 md:hidden">
          {OUTPUT_ROLES.map((role) => {
            const Icon = OUTPUT_ICONS[role];
            const connected = controller.connections[role];
            return (
              <div key={role} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <span className={cn("size-2 shrink-0 rounded-full", connected ? "bg-emerald-500" : "bg-red-500")} />
                <Icon className="size-4 shrink-0" />
                <span className="font-medium">{OUTPUT_LABELS[role]}</span>
                <span className="ml-auto text-xs text-muted-foreground">{connected ? "Conectado" : "Desconectado"}</span>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">Abra o projetor e o retorno no computador ligado às telas.</p>
        </section>

        <section className="space-y-1.5">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Projector className="h-3.5 w-3.5" /> Projetor
            <span className={cn("ml-auto rounded px-1.5 text-xs font-bold", mode === "live" ? "bg-red-500 text-white" : "bg-muted")}>
              {mode === "live" ? "AO VIVO" : MODE_BUTTONS.find((b) => b.mode === mode)?.label.toUpperCase()}
            </span>
          </h2>
          <div className="aspect-video overflow-hidden rounded-md border shadow-sm">
            <ProjectorView state={controller.broadcastState} />
          </div>
        </section>

        <section className="space-y-1.5">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Tv className="h-3.5 w-3.5" /> Retorno
          </h2>
          <div className="aspect-video overflow-hidden rounded-md border shadow-sm">
            <StageView state={controller.broadcastState} now={now} operatorOnline />
          </div>
        </section>

        <section className="hidden grid-cols-3 gap-2 lg:grid">
          {MODE_BUTTONS.map(({ mode: target, label, key, icon: Icon }) => (
            <Button
              key={target}
              type="button"
              variant={mode === target ? "default" : "outline"}
              className="h-auto min-w-0 flex-col gap-1 px-1 py-2 text-center leading-tight whitespace-normal sm:h-auto"
              aria-pressed={mode === target}
              onClick={() => controller.toggleMode(target)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{label}</span>
              <kbd className="hidden text-xs opacity-60 [@media(hover:hover)]:inline">{key}</kbd>
            </Button>
          ))}
        </section>

        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquareWarning className="h-3.5 w-3.5" /> Aviso no retorno
          </h2>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              controller.setStageMessage(draft.trim());
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ex.: Repetir refrão"
              enterKeyHint="send"
              aria-label="Aviso no retorno"
            />
            <Button type="submit" disabled={draft.trim() === ""}>
              Enviar
            </Button>
          </form>
          {stageMessage && (
            <div className="flex items-center justify-between gap-2 rounded-md bg-yellow-400/20 px-2 py-1 text-sm">
              <span className="truncate">Exibindo: “{stageMessage}”</span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="shrink-0"
                onClick={() => {
                  controller.setStageMessage("");
                  setDraft("");
                }}
                aria-label="Remover aviso"
              >
                <X />
              </Button>
            </div>
          )}
        </section>

        <section className="flex items-center justify-between gap-2 rounded-md border p-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cronômetro do culto</p>
            <p className="text-xl font-semibold tabular-nums">
              {timerStartedAt !== null && now > 0 ? formatElapsed(now - timerStartedAt) : "--:--"}
            </p>
          </div>
          {timerStartedAt === null ? (
            <Button type="button" size="sm" variant="outline" onClick={controller.startTimer}>
              <Timer className="mr-1 h-4 w-4" /> Iniciar
            </Button>
          ) : (
            <Button type="button" size="sm" variant="ghost" onClick={controller.stopTimer}>
              <TimerOff className="mr-1 h-4 w-4" /> Zerar
            </Button>
          )}
        </section>

        <section className="hidden space-y-1 rounded-md border p-2 text-xs [@media(hover:hover)]:block">
          <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground">
            <Keyboard className="h-3.5 w-3.5" /> Atalhos
          </p>
          {SHORTCUTS.map(([keys, action]) => (
            <p key={keys} className="flex justify-between gap-2">
              <kbd className="rounded border bg-muted px-1 font-mono">{keys}</kbd>
              <span className="text-muted-foreground">{action}</span>
            </p>
          ))}
        </section>
      </div>
    </ScrollArea>
  );
}

export function ControlConsole({ request, initialPassage }: { request: DeckRequest; initialPassage?: InitialPassage }) {
  const key = deckKey(request);
  const utils = api.useUtils();
  const [cached] = useState(() => loadCachedDeck(key));

  const query = api.presentation.getDeck.useQuery(request, {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  useEffect(() => {
    if (query.data) saveCachedDeck(query.data);
  }, [query.data]);

  const source = query.data ?? cached;
  const baseDeck = useMemo(() => (source ? buildDeck(source) : null), [source]);
  const controller = usePresentationController(baseDeck);
  const remote = useRemoteHost(controller);
  const { deck, live, next } = controller;

  const [pin, setPin] = useState<{ song: number; liveAtPin: Position | null } | null>(null);
  const [tab, setTab] = useState<ConsoleTab>("slides");
  const selectedSong = pin && samePosition(pin.liveAtPin, live) ? pin.song : (live?.song ?? pin?.song ?? 0);

  useEffect(() => {
    void detectScreensIfPermitted();
  }, []);

  const loadInitialPassage = useEffectEvent(async (target: InitialPassage) => {
    try {
      const passage = await utils.bible.getPassage.fetch({ version: target.version, reference: target.reference });
      controller.addPassage(
        passageToDeckSong(passage, `bible:${passage.title}:${target.version}:${Date.now()}`, target.versesPerSlide ?? null),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar a passagem.");
    }
  });
  const initialPassageLoaded = useRef(false);
  useEffect(() => {
    if (!initialPassage || !baseDeck || initialPassageLoaded.current) return;
    initialPassageLoaded.current = true;
    void loadInitialPassage(initialPassage);
  }, [initialPassage, baseDeck]);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (
      !deck ||
      event.defaultPrevented ||
      isTypingTarget(event.target) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }
    const { key: pressed } = event;

    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(pressed)) {
      event.preventDefault();
      controller.goNext();
    } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(pressed)) {
      event.preventDefault();
      controller.goPrevious();
    } else if (/^[1-9]$/.test(pressed)) {
      const slide = Number(pressed) - 1;
      if ((deck.songs[selectedSong]?.slides.length ?? 0) > slide) controller.goTo({ song: selectedSong, slide });
    } else if (pressed === "b" || pressed === "B") {
      controller.toggleMode("black");
    } else if (pressed === "l" || pressed === "L") {
      controller.toggleMode("logo");
    } else if (pressed === "c" || pressed === "C") {
      controller.toggleMode("clear");
    } else if (pressed === "Escape" && controller.mode !== "live" && live) {
      controller.goTo(live);
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const backHref = "eventId" in request ? "/app/praise/events" : "songId" in request ? "/app/praise/songs" : "/app/bible";

  if (!deck) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        {query.isPending ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando repertório…</p>
          </>
        ) : (
          <>
            <CloudOff className="h-10 w-10 text-muted-foreground" />
            <p className="max-w-md">
              {query.error?.data?.code === "UNAUTHORIZED"
                ? "Sua sessão expirou. Entre novamente para carregar o repertório."
                : (query.error?.message ?? "Não foi possível carregar o repertório.")}
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={backHref}>Voltar</Link>
              </Button>
              {query.error?.data?.code === "UNAUTHORIZED" && (
                <Button asChild>
                  <Link href="/sign-in">Entrar</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  const handleSelectSong = (song: number) => {
    setPin({ song, liveAtPin: live });
    setTab("slides");
  };

  const handleAddSong = (song: DeckSongSource) => {
    controller.addSong(song);
    setPin({ song: deck.songs.length, liveAtPin: live });
    setTab("slides");
  };

  const handleAddPassage = (song: DeckSong) => {
    controller.addPassage(song);
    setPin({ song: deck.songs.length, liveAtPin: live });
    setTab("slides");
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2 sm:gap-3 sm:px-4 md:flex-wrap">
        <Button asChild variant="ghost" size="icon" className="shrink-0" aria-label="Voltar ao app">
          <Link href={backHref} onClick={() => controller.closeOutputs()}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold leading-tight">{deck.title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {deck.subtitle ?? `${deck.songs.length} músicas`}
            {!query.data && cached && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                <CloudOff className="h-3 w-3" />
                Offline: repertório salvo em {new Date(cached.savedAt).toLocaleString("pt-BR")}
              </span>
            )}
          </p>
        </div>
        <OutputControls controller={controller} remote={remote} />
        <div className="hidden items-center gap-1 lg:flex">
          <Button type="button" size="icon" variant="outline" onClick={controller.goPrevious} aria-label="Estrofe anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" onClick={controller.goNext} aria-label="Próxima estrofe">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (isConsoleTab(value)) setTab(value);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mx-3 mt-2 grid h-11 shrink-0 grid-cols-3 lg:hidden">
          {CONSOLE_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="h-9">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-4 p-3 lg:grid-cols-[260px_minmax(0,1fr)_340px] lg:p-4">
          <TabsContent value="setlist" forceMount className={PANEL_CLASS}>
            <Setlist
              deck={deck}
              live={live}
              selectedSong={selectedSong}
              onSelect={handleSelectSong}
              onAddSong={handleAddSong}
              onAddPassage={handleAddPassage}
              onRemoveSong={controller.removeSong}
            />
          </TabsContent>
          <TabsContent value="slides" forceMount className={PANEL_CLASS}>
            <ScrollArea className="h-full pr-3">
              <SlideGrid deck={deck} songIndex={selectedSong} live={live} next={next} onGoTo={controller.goTo} onVersesPerSlide={controller.setVersesPerSlide} onPassage={controller.setPassageVersion} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="outputs" forceMount className={PANEL_CLASS}>
            <SidePanel controller={controller} />
          </TabsContent>
        </div>
      </Tabs>

      <nav
        aria-label="Controles da apresentação"
        className="shrink-0 space-y-2 border-t bg-background px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="grid grid-cols-3 gap-2">
          {MODE_BUTTONS.map(({ mode: target, label, icon: Icon }) => (
            <Button
              key={target}
              type="button"
              size="sm"
              variant={controller.mode === target ? "default" : "outline"}
              className="h-auto min-w-0 flex-col gap-0.5 px-1 py-1.5 text-center text-xs leading-tight whitespace-normal sm:h-auto"
              aria-pressed={controller.mode === target}
              onClick={() => controller.toggleMode(target)}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-14 flex-1 text-base [&_svg]:size-5" onClick={controller.goPrevious}>
            <ChevronLeft />
            Anterior
          </Button>
          <Button type="button" className="h-14 flex-1 text-base [&_svg]:size-5" onClick={controller.goNext}>
            Próxima
            <ChevronRight />
          </Button>
        </div>
      </nav>
    </div>
  );
}
