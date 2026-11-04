"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { samePosition, VERSES_PER_SLIDE_OPTIONS, type Deck, type Position } from "../deck";

interface SlideGridProps {
  deck: Deck;
  songIndex: number;
  live: Position | null;
  next: Position | null;
  onGoTo: (position: Position) => void;
  onVersesPerSlide: (uid: string, perSlide: number | null) => void;
}

export function VersesPerSlideSelect({
  value,
  onChange,
  className,
  compact = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Select value={value === null ? "auto" : String(value)} onValueChange={(v) => onChange(v === "auto" ? null : Number(v))}>
      <SelectTrigger className={className} aria-label="Versículos por slide">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">{compact ? "Auto" : "Automático"}</SelectItem>
        {VERSES_PER_SLIDE_OPTIONS.map((n) => (
          <SelectItem key={n} value={String(n)}>
            {compact ? `${n} por slide` : `${n} ${n === 1 ? "versículo" : "versículos"} por slide`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SlideGrid({ deck, songIndex, live, next, onGoTo, onVersesPerSlide }: SlideGridProps) {
  const song = deck.songs[songIndex];
  const liveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    liveRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [live]);

  if (!song) {
    return <p className="p-6 text-sm text-muted-foreground">Selecione uma música no repertório.</p>;
  }

  if (song.slides.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{song.title}</p>
        <p>Esta música não tem letra cadastrada. Cadastre a letra em Músicas, separando as estrofes com uma linha em branco.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight">{song.title}</h2>
          {song.artist && <p className="text-sm text-muted-foreground">{song.artist}</p>}
        </div>
        {song.kind === "bible" && (
          <VersesPerSlideSelect
            className="w-full sm:w-60"
            value={song.versesPerSlide}
            onChange={(value) => onVersesPerSlide(song.uid, value)}
          />
        )}
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr))]">
        {song.slides.map((text, slide) => {
          const position = { song: songIndex, slide };
          const isLive = samePosition(position, live);
          const isNext = samePosition(position, next);
          return (
            <button
              key={slide}
              ref={isLive ? liveRef : undefined}
              type="button"
              onClick={() => onGoTo(position)}
              className={cn(
                "relative flex min-h-28 flex-col rounded-lg border-2 p-3 pt-6 text-left text-sm leading-snug transition-colors",
                isLive
                  ? "border-red-500 bg-red-500/10"
                  : isNext
                    ? "border-sky-500/70 bg-sky-500/5"
                    : "border-border hover:border-primary/60 hover:bg-accent"
              )}
            >
              <span className="absolute left-2 top-1.5 text-xs font-bold text-muted-foreground">
                {slide + 1}
                {song.slideLabels?.[slide] && <span className="ml-1 font-normal">· {song.slideLabels[slide]}</span>}
                {isLive && <span className="ml-2 rounded bg-red-500 px-1 text-white">AO VIVO</span>}
                {isNext && <span className="ml-2 rounded bg-sky-600 px-1 text-white">PRÓXIMA</span>}
              </span>
              <span className={song.kind === "bible" ? undefined : "whitespace-pre-line"}>
                {song.kind === "bible" ? text.replace(/\n/g, " ") : text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
