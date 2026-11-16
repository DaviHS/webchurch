"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REMOTE_MESSAGE_MAX } from "../remote-protocol";

interface MessageSectionProps {
  icon: ReactNode;
  title: string;
  placeholder: string;
  value: string;
  onChange: (message: string) => void;
  tourId?: string;
}

export function MessageSection({ icon, title, placeholder, value, onChange, tourId }: MessageSectionProps) {
  const [draft, setDraft] = useState("");

  return (
    <section data-tour={tourId} className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </h2>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onChange(draft.trim());
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          enterKeyHint="send"
          maxLength={REMOTE_MESSAGE_MAX}
          aria-label={title}
        />
        <Button type="submit" disabled={draft.trim() === ""}>
          Enviar
        </Button>
      </form>
      {value && (
        <div className="flex items-center justify-between gap-2 rounded-md bg-yellow-400/20 px-2 py-1 text-sm">
          <span className="truncate">Exibindo: “{value}”</span>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="shrink-0"
            onClick={() => {
              onChange("");
              setDraft("");
            }}
            aria-label={`Remover ${title.toLowerCase()}`}
          >
            <X />
          </Button>
        </div>
      )}
    </section>
  );
}
