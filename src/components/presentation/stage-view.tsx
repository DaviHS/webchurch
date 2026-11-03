import { cn } from "@/lib/utils";
import { formatClock, formatElapsed } from "./hooks";
import type { PresentationState, ProjectorMode } from "./protocol";
import { SlideText } from "./slide-text";

interface StageViewProps {
  state: PresentationState | null;
  now: number;
  operatorOnline: boolean;
  className?: string;
}

const MODE_BADGES: Partial<Record<ProjectorMode, { label: string; className: string }>> = {
  black: { label: "PROJETOR: TELA PRETA", className: "bg-zinc-700 text-white" },
  logo: { label: "PROJETOR: LOGO", className: "bg-amber-500 text-black" },
  clear: { label: "PROJETOR: SEM LETRA", className: "bg-sky-600 text-white" },
};

export function StageView({ state, now, operatorOnline, className }: StageViewProps) {
  const badge = state ? MODE_BADGES[state.mode] : undefined;
  const elapsed = state?.timerStartedAt != null && now > 0 ? formatElapsed(now - state.timerStartedAt) : null;

  return (
    <div className={cn("@container/stage flex h-full w-full flex-col bg-zinc-950 text-white [container-type:size]", className)}>
      <header className="flex items-center justify-between gap-[2cqw] border-b border-zinc-800 px-[2.5cqw] py-[1.5cqh]">
        <div className="min-w-0">
          <p className="truncate text-[4.2cqh] font-bold leading-tight">
            {state?.song?.title ?? "Aguardando o painel de controle"}
          </p>
          {state?.song && (
            <p className="truncate text-[2.6cqh] text-zinc-400">
              {state.song.artist ? `${state.song.artist} · ` : ""}
              Música {state.song.position}/{state.song.total}
              {state.live ? ` · ${state.live.label}` : ""}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-[2cqw] text-right tabular-nums">
          {elapsed && (
            <div>
              <p className="text-[2cqh] uppercase tracking-wider text-zinc-500">Culto</p>
              <p className="text-[4.2cqh] font-semibold text-emerald-400">{elapsed}</p>
            </div>
          )}
          <div>
            <p className="text-[2cqh] uppercase tracking-wider text-zinc-500">Hora</p>
            <p className="text-[4.2cqh] font-semibold">{now > 0 ? formatClock(now) : "--:--"}</p>
          </div>
        </div>
      </header>

      {state?.stageMessage && (
        <div className="animate-pulse bg-yellow-400 px-[2.5cqw] py-[1.2cqh] text-center text-[4cqh] font-bold text-black">
          {state.stageMessage}
        </div>
      )}

      <main className="relative flex min-h-0 flex-[3] items-center justify-center">
        {badge && (
          <span className={cn("absolute right-[2cqw] top-[1.5cqh] rounded px-[1cqw] py-[0.4cqh] text-[2.2cqh] font-bold", badge.className)}>
            {badge.label}
          </span>
        )}
        <div className="@container/slide h-full w-full [container-type:size]">
          <div className="flex h-full items-center justify-center">
            {state?.live ? (
              <SlideText text={state.live.text} maxHeight={84} maxFont={13} className="px-[3cqw]" />
            ) : (
              <p className="text-[5cqh] text-zinc-600">—</p>
            )}
          </div>
        </div>
      </main>

      <section className="flex min-h-0 flex-[1.4] flex-col border-t border-zinc-800 bg-zinc-900/60">
        <p className="px-[2.5cqw] pt-[1cqh] text-[2.2cqh] font-semibold uppercase tracking-wider text-zinc-500">
          {state?.next ? "Próxima" : state?.nextSongTitle ? `Próxima música: ${state.nextSongTitle}` : "Fim do repertório"}
        </p>
        <div className="@container/slide min-h-0 flex-1 [container-type:size]">
          <div className="flex h-full items-center justify-center">
            {state?.next && (
              <SlideText text={state.next.text} maxHeight={80} maxFont={16} className="px-[3cqw] font-medium text-zinc-400" />
            )}
          </div>
        </div>
      </section>

      {!operatorOnline && (
        <footer className="bg-red-700 px-[2.5cqw] py-[0.8cqh] text-center text-[2.4cqh] font-semibold">
          Painel de controle desconectado — exibindo o último conteúdo recebido
        </footer>
      )}
    </div>
  );
}
