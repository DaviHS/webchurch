import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { Song } from "@/types";
import type { SongFormData } from "@/validators/song";

interface UseSongMutationsOptions {
  onSuccess?: () => void;
}

function showWarnings(warnings: readonly string[]) {
  for (const warning of warnings) {
    toast.warning(warning, { duration: 10_000 });
  }
}

export function useSongMutations(options?: UseSongMutationsOptions) {
  const utils = api.useUtils();

  const refresh = () => Promise.all([utils.song.list.invalidate(), utils.song.youtubeStatus.invalidate()]);

  const createSong = api.song.create.useMutation({
    onSuccess: async ({ warnings }) => {
      toast.success("Música criada com sucesso!");
      showWarnings(warnings);
      options?.onSuccess?.();
      await refresh();
    },
    onError: (error) => {
      toast.error("Erro ao criar música: " + error.message);
    },
  });

  const updateSong = api.song.update.useMutation({
    onSuccess: async ({ warnings }) => {
      toast.success("Música atualizada com sucesso!");
      showWarnings(warnings);
      options?.onSuccess?.();
      await refresh();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar música: " + error.message);
    },
  });

  const deleteSong = api.song.delete.useMutation({
    onSuccess: async ({ warnings }) => {
      toast.success("Música excluída com sucesso!");
      showWarnings(warnings);
      await refresh();
    },
    onError: (error) => {
      toast.error("Erro ao excluir música: " + error.message);
    },
  });

  const handleSubmit = (data: SongFormData, editingSong: Pick<Song, "id"> | null) => {
    if (editingSong) {
      updateSong.mutate({ id: editingSong.id, data });
    } else {
      createSong.mutate(data);
    }
  };

  const handleDelete = (song: Pick<Song, "id" | "title">) => {
    if (confirm(`Tem certeza que deseja excluir a música "${song.title}"?`)) {
      deleteSong.mutate(song.id);
    }
  };

  return {
    createSong,
    updateSong,
    deleteSong,
    handleSubmit,
    handleDelete,
    isPending: createSong.isPending || updateSong.isPending || deleteSong.isPending,
  };
}
