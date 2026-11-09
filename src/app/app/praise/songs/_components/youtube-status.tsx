"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Youtube } from "@/components/icons/brand";
import { api } from "@/trpc/react";
import { mutationFeedback } from "@/lib/mutation-feedback";

export function YouTubeStatus() {
  const utils = api.useUtils();
  const { data: status } = api.song.getYouTubeStatus.useQuery(undefined, {
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const syncPlaylistMutation = api.song.syncYouTubePlaylist.useMutation(
    mutationFeedback({
      loading: "Sincronizando a playlist do YouTube...",
      success: (result) => {
        const parts = [
          result.resolved > 0 ? `${result.resolved} link(s) do YouTube encontrado(s)` : null,
          result.notFound > 0 ? `${result.notFound} sem resultado no YouTube` : null,
          result.unresolvedLeft > 0 ? `${result.unresolvedLeft} sem link ainda: clique de novo para continuar` : null,
          result.added > 0 ? `${result.added} vídeo(s) adicionado(s) à playlist` : null,
          result.durationsFilled > 0 ? `${result.durationsFilled} duração(ões) preenchida(s)` : null,
          result.failed > 0 ? `${result.failed} vídeo(s) indisponível(is)` : null,
          result.remaining > 0 ? `${result.remaining} ficaram para a próxima (limite diário de cota)` : null,
        ].filter(Boolean);
        return parts.length === 0 ? "Tudo em dia: playlist completa e durações preenchidas" : parts.join(" · ");
      },
      error: "Erro ao sincronizar a playlist",
      onSuccess: () => Promise.all([utils.song.getYouTubeStatus.invalidate(), utils.song.list.invalidate(), utils.song.facets.invalidate()]),
    })
  );

  if (!status?.configured) return null;

  if (!status.ok) {
    return (
      <div
        className="flex max-w-full items-center gap-1.5 rounded-full border border-warning/50 bg-warning/10 px-2.5 py-1 text-xs"
        title="Avise o setor de desenvolvimento para verificar a integração. As músicas continuam sendo salvas, só não entram na playlist."
      >
        <AlertTriangle className="size-4 shrink-0 text-warning" />
        <span className="truncate">YouTube fora do ar</span>
      </div>
    );
  }

  return (
    <div className="flex max-w-full items-center gap-1.5 rounded-full border bg-card py-1 pl-2.5 pr-1.5 text-xs">
      <Youtube className="size-4 shrink-0" />
      <span className="size-1.5 shrink-0 rounded-full bg-success" aria-label="YouTube conectado" role="img" />
      {status.playlist ? (
        <a
          href={status.playlist.url}
          target="_blank"
          rel="noreferrer"
          title="Abrir a playlist no YouTube"
          className="min-w-0 truncate text-muted-foreground hover:text-foreground hover:underline"
        >
          {status.playlist.itemCount} vídeos
        </a>
      ) : (
        <span className="text-muted-foreground">YouTube</span>
      )}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-6"
        onClick={() => syncPlaylistMutation.mutate()}
        disabled={syncPlaylistMutation.isPending}
        title="Sincronizar a playlist"
        aria-label="Sincronizar a playlist do YouTube"
      >
        {syncPlaylistMutation.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      </Button>
    </div>
  );
}
