"use client";

import { useRef } from "react";
import { skipToken } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { SongForm } from "@/app/app/praise/songs/_components/song-form";
import { useSongMutations } from "@/hooks/use-song-mutations";
import { api } from "@/trpc/react";
import { isSongCategory, type SongFormData } from "@/validators/song";
import type { DeckSongSource } from "../deck";

interface EditSongDialogProps {
  songId: number | null;
  onClose: () => void;
  onSaved: (song: DeckSongSource) => void;
}

export function EditSongDialog({ songId, onClose, onSaved }: EditSongDialogProps) {
  const { data: song, isLoading } = api.song.getById.useQuery(songId ?? skipToken, { staleTime: 0 });

  const submitted = useRef<DeckSongSource | null>(null);

  const { handleSubmit, isPending } = useSongMutations({
    onSuccess: () => {
      if (submitted.current) onSaved(submitted.current);
      submitted.current = null;
      onClose();
    },
  });

  const submit = async (formData: SongFormData) => {
    if (songId === null) return;
    submitted.current = { id: songId, title: formData.title, artist: formData.artist ?? null, lyrics: formData.lyrics ?? null };
    await handleSubmit(formData, { id: songId });
  };

  return (
    <ResponsiveDialog open={songId !== null} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Editar música</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        {isLoading || !song ? (
          <ResponsiveDialogBody className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </ResponsiveDialogBody>
        ) : (
          <SongForm
            key={song.id}
            onSubmit={(formData) => void submit(formData)}
            initialData={{
              title: song.title,
              artist: song.artist ?? "",
              category: isSongCategory(song.category) ? song.category : undefined,
              lyrics: song.lyrics ?? undefined,
              youtubeUrl: song.youtubeUrl ?? undefined,
              youtubeVideoId: song.youtubeVideoId ?? undefined,
              spotifyUrl: song.spotifyUrl ?? undefined,
              spotifyTrackId: song.spotifyTrackId ?? undefined,
              skipPlaylist: song.skipPlaylist,
              duration: song.duration ?? undefined,
            }}
            isLoading={isPending}
            onCancel={onClose}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
