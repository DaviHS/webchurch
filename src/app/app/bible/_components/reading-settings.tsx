"use client";

import { AlignJustify, List, Minus, Plus, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DEFAULT_READING_PREFS,
  READING_FONTS,
  READING_SIZES,
  useReadingPrefs,
  type ReadingLayout,
} from "@/hooks/use-reading-prefs";
import { cn } from "@/lib/utils";

const LAYOUTS: { value: ReadingLayout; label: string; icon: typeof List }[] = [
  { value: "flow", label: "Texto corrido", icon: AlignJustify },
  { value: "lines", label: "Um versículo por linha", icon: List },
];

const optionClass = (active: boolean) =>
  cn(
    "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
    active && "border-primary bg-primary/10 text-primary",
  );

export function ReadingSettings({ className }: { className?: string }) {
  const [prefs, update] = useReadingPrefs();
  const pixels = READING_SIZES[prefs.size] ?? READING_SIZES[DEFAULT_READING_PREFS.size];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" className={className} title="Letra e leitura" aria-label="Letra e leitura">
          <Type />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4 p-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tamanho</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={prefs.size <= 0}
              onClick={() => update({ size: prefs.size - 1 })}
              aria-label="Diminuir a letra"
            >
              <Minus />
            </Button>
            <span className="flex-1 text-center text-sm tabular-nums">{pixels} px</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={prefs.size >= READING_SIZES.length - 1}
              onClick={() => update({ size: prefs.size + 1 })}
              aria-label="Aumentar a letra"
            >
              <Plus />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Letra</p>
          <div className="grid gap-1.5">
            {READING_FONTS.map((font) => (
              <button
                key={font.value}
                type="button"
                aria-pressed={prefs.font === font.value}
                className={optionClass(prefs.font === font.value)}
                onClick={() => update({ font: font.value })}
              >
                <span className="text-lg leading-none" style={{ fontFamily: font.family }}>
                  Aa
                </span>
                <span style={{ fontFamily: font.family }}>{font.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Disposição</p>
          <div className="grid gap-1.5">
            {LAYOUTS.map((layout) => (
              <button
                key={layout.value}
                type="button"
                aria-pressed={prefs.layout === layout.value}
                className={optionClass(prefs.layout === layout.value)}
                onClick={() => update({ layout: layout.value })}
              >
                <layout.icon className="size-4 shrink-0" />
                {layout.label}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
