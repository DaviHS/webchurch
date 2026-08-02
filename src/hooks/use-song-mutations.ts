import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { SongFormData } from "@/validators/song";

interface UseSongMutationsOptions {
  onSuccess?: () => void;
}

export function useSongMutations(refetch: () => void, options?: UseSongMutationsOptions) {
  const createSong = api.song.create.useMutation({
    onSuccess: () => {
      toast.success("Música criada com sucesso!");
      options?.onSuccess?.();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar música: " + error.message);
    },
  });

  const updateSong = api.song.update.useMutation({
    onSuccess: () => {
      toast.success("Música atualizada com sucesso!");
      options?.onSuccess?.();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar música: " + error.message);
    },
  });

  const deleteSong = api.song.delete.useMutation({
    onSuccess: () => {
      toast.success("Música excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao excluir música: " + error.message);
    },
  });

  const handleSubmit = (data: SongFormData, editingSong: any) => {
    if (editingSong) {
      updateSong.mutate({ id: editingSong.id, data });
    } else {
      createSong.mutate(data);
    }
  };

  const handleDelete = (song: any) => {
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