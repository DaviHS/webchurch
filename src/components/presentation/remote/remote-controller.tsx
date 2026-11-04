"use client";

import { useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CloudOff, Image as ImageIcon, Loader2, Square, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { ProjectorMode } from "../protocol";
import {
  REMOTE_CODE_LENGTH,
  REMOTE_POLL_MS,
  REMOTE_STALE_SECONDS,
  remoteCodeSchema,
  type RemoteCommand,
} from "../remote-protocol";

const STORAGE_KEY = "remote-code";
const TAP_GUARD_MS = 250;

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

function CodeForm({ error, onSubmit }: { error?: string; onSubmit: (code: string) => void }) {
  const [value, setValue] = useState("");
  const valid = remoteCodeSchema.safeParse(value).success;

  return (
    <form
      className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onSubmit(value);
      }}
    >
      <h1 className="text-xl font-bold">Controle remoto</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Digite o código de {REMOTE_CODE_LENGTH} números que aparece no computador da projeção.
      </p>
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value.replace(/\D/g, "").slice(0, REMOTE_CODE_LENGTH))}
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        placeholder="0000"
        aria-label="Código do controle remoto"
        className="h-16 max-w-48 text-center text-3xl font-bold tracking-[0.3em] tabular-nums"
      />
      {error && <p className="max-w-xs text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full max-w-48" disabled={!valid}>
        Conectar
      </Button>
    </form>
  );
}

export function RemoteController({ initialCode }: { initialCode: string | null }) {
  const [code, setCodeState] = useState<string | null>(() =>
    initialCode && remoteCodeSchema.safeParse(initialCode).success ? initialCode : readStoredCode(),
  );
  const lastTap = useRef(0);

  const setCode = (next: string | null) => {
    storeCode(next);
    setCodeState(next);
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

  if (code === null) return <CodeForm onSubmit={setCode} />;

  const errorCode = (stateQuery.error?.data as { code?: string } | null | undefined)?.code;

  if (!stateQuery.data && stateQuery.error) {
    if (errorCode === "UNAUTHORIZED") {
      return (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
          <CloudOff className="size-10 text-muted-foreground" />
          <p className="max-w-xs">Entre com a sua conta para controlar a projeção.</p>
          <Button asChild>
            <Link href="/sign-in">Entrar</Link>
          </Button>
        </div>
      );
    }
    return (
      <CodeForm
        error={errorCode === "NOT_FOUND" ? stateQuery.error.message : "Não foi possível conectar. Tente de novo."}
        onSubmit={setCode}
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

  const { state, ageSeconds } = stateQuery.data;
  const computerOnline = ageSeconds < REMOTE_STALE_SECONDS;
  const offline = stateQuery.isError || !computerOnline;

  const press = (command: RemoteCommand) => {
    if (!tapAllowed(lastTap)) return;
    send.mutate({ code, command });
  };

  const outline = outlineQuery.data ?? [];
  const mode = state?.mode ?? "logo";

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

      <Tabs defaultValue="control" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-2 grid h-11 shrink-0 grid-cols-2">
          <TabsTrigger value="control" className="h-9">
            Controle
          </TabsTrigger>
          <TabsTrigger value="slides" className="h-9">
            Slides
          </TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="mt-0 min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <section className="space-y-1 rounded-lg border-2 border-red-500/70 bg-red-500/5 p-3">
            <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span className={cn("rounded px-1.5 py-0.5 text-white", mode === "live" ? "bg-red-500" : "bg-zinc-600")}>
                {MODE_LABELS[mode].toUpperCase()}
              </span>
              {state?.songTitle && <span className="truncate">{state.songTitle}</span>}
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
            <p className="text-xs font-bold text-sky-600">
              PRÓXIMA{state?.next ? ` · ${state.next.label}` : ""}
            </p>
            <p className="line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">
              {state?.next?.text ?? "Fim do repertório."}
            </p>
          </section>
        </TabsContent>

        <TabsContent value="slides" className="mt-0 min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
          {outline.length === 0 && <p className="text-sm text-muted-foreground">Carregando slides…</p>}
          {outline.map((song, songIndex) => (
            <section key={`${songIndex}:${song.title}`} className="space-y-2">
              <h2 className="text-sm font-bold">{song.title}</h2>
              <div className="grid grid-cols-2 gap-2">
                {song.slides.map((slide, slideIndex) => {
                  const isLive = state?.position?.song === songIndex && state.position.slide === slideIndex;
                  return (
                    <button
                      key={slideIndex}
                      type="button"
                      onClick={() => press({ type: "goto", song: songIndex, slide: slideIndex })}
                      className={cn(
                        "flex min-h-20 flex-col gap-1 rounded-lg border-2 p-2 text-left text-xs leading-snug",
                        isLive ? "border-red-500 bg-red-500/10" : "border-border active:bg-accent",
                      )}
                    >
                      <span className="font-bold text-muted-foreground">{slide.label}</span>
                      <span className="line-clamp-3 whitespace-pre-line">{slide.text}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
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
