"use client";

import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROJECTION_THEMES, type ProjectionThemeId } from "../themes";

interface ThemePickerProps {
  value: ProjectionThemeId;
  onChange: (id: ProjectionThemeId) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <section className="space-y-1.5">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Palette className="h-3.5 w-3.5" /> Tema do projetor
      </h2>
      <div className="grid grid-cols-4 gap-2">
        {PROJECTION_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            aria-pressed={value === theme.id}
            aria-label={`Tema ${theme.label}`}
            onClick={() => onChange(theme.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md border p-1.5 text-xs transition-colors hover:bg-accent",
              value === theme.id && "border-primary bg-primary/10 text-primary",
            )}
          >
            <span
              className="relative flex aspect-video w-full items-center justify-center rounded border text-[0.65rem] font-bold"
              style={{ background: theme.background, color: theme.text }}
            >
              {value === theme.id ? <Check className="size-3.5" /> : "Aa"}
            </span>
            {theme.label}
          </button>
        ))}
      </div>
    </section>
  );
}
