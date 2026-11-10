"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { formatDate } from "@/lib/formatters";
import { eventTypeBadge, eventTypeLabel } from "@/lib/labels";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { api } from "@/trpc/react";
import type { Song } from "@/types";

interface AddToEventDialogProps {
  song: Song | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToEventDialog({ song, open, onOpenChange }: AddToEventDialogProps) {
  const utils = api.useUtils();
  const [today] = useState(() => startOfDay(new Date()));
  const { data, isLoading } = api.event.list.useQuery({ scope: "upcoming", today, limit: 20 }, { enabled: open, staleTime: 30_000 });

  const upcoming = [...(data?.events ?? [])]
    .filter((event) => event.type !== "template")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const addSong = api.event.addSongToEnd.useMutation(
    mutationFeedback({
      success: "Música adicionada ao repertório",
      error: "Erro ao adicionar a música",
      onSuccess: async () => {
        onOpenChange(false);
        await utils.event.invalidate();
      },
    }),
  );

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Adicionar a um evento</ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="break-words">
            {song ? `“${song.title}” entra no fim do repertório do evento escolhido.` : "Escolha o evento."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="pb-4">
          {isLoading ? (
            <LoadingState />
          ) : upcoming.length === 0 ? (
            <EmptyState icon={CalendarPlus} title="Nenhum evento a partir de hoje" description="Crie ou duplique um evento em Eventos." className="py-8" />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    disabled={!song || addSong.isPending}
                    onClick={() => song && addSong.mutate({ eventId: event.id, songId: song.id })}
                    className="flex min-h-14 w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{event.title}</span>
                      <span className="block text-xs text-muted-foreground">{formatDate(event.date)}</span>
                    </span>
                    <Badge variant={eventTypeBadge(event.type)} className="shrink-0">
                      {eventTypeLabel(event.type)}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
