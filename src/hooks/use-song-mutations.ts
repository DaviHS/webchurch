import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
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
  const confirm = useConfirm();

  const refresh = () => Promise.all([utils.song.list.invalidate(), utils.song.getYouTubeStatus.invalidate(),
    utils.song.getSpotifyStatus.invalidate(),
  ]);

  const createSongMutation = api.song.create.useMutation(
    mutationFeedback({
      success: "Música criada com sucesso",
      error: "Erro ao criar música",
      onSuccess: async ({ warnings }) => {
        showWarnings(warnings);
        options?.onSuccess?.();
        await refresh();
      },
    })
  );

  const updateSongMutation = api.song.update.useMutation(
    mutationFeedback({
      success: "Música atualizada com sucesso",
      error: "Erro ao atualizar música",
      onSuccess: async ({ warnings }) => {
        showWarnings(warnings);
        options?.onSuccess?.();
        await refresh();
      },
    })
  );

  const deleteSongMutation = api.song.delete.useMutation(
    mutationFeedback({
      success: "Música excluída com sucesso",
      error: "Erro ao excluir música",
      onSuccess: async ({ warnings }) => {
        showWarnings(warnings);
        await refresh();
      },
    })
  );

  const handleSubmit = async (data: SongFormData, editingSong: Pick<Song, "id"> | null) => {
    const duplicate = await utils.song.findDuplicate
      .fetch({ title: data.title, artist: data.artist, excludeId: editingSong?.id }, { staleTime: 0 })
      .catch(() => null);

    if (duplicate) {
      const by = duplicate.artist ? ` de ${duplicate.artist}` : "";
      const confirmed = await confirm({
        title: "Música já cadastrada",
        description: `Já existe "${duplicate.title}"${by}. Deseja salvar mesmo assim?`,
        confirmLabel: "Salvar mesmo assim",
      });
      if (!confirmed) return;
    }

    const allowDuplicate = duplicate ? true : undefined;
    if (editingSong) {
      updateSongMutation.mutate({ id: editingSong.id, data, allowDuplicate });
    } else {
      createSongMutation.mutate({ ...data, allowDuplicate });
    }
  };

  const handleDelete = async (song: Pick<Song, "id" | "title">) => {
    const confirmed = await confirm({
      title: "Excluir música",
      description: `Tem certeza que deseja excluir a música "${song.title}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (confirmed) deleteSongMutation.mutate(song.id);
  };

  return {
    createSongMutation,
    updateSongMutation,
    deleteSongMutation,
    handleSubmit,
    handleDelete,
    isPending: createSongMutation.isPending || updateSongMutation.isPending || deleteSongMutation.isPending,
  };
}
