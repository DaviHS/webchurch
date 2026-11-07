"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spotify } from "@/components/icons/brand";
import { api } from "@/trpc/react";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { usePermissions } from "@/hooks/use-permissions";

export function SpotifyStatus() {
  const utils = api.useUtils();
  const canEdit = usePermissions().can("songs.edit");
  const { data: status } = api.song.getSpotifyStatus.useQuery(undefined, {
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const syncMutation = api.song.syncSpotifyPlaylist.useMutation(
    mutationFeedback({
      loading: "Sincronizando a playlist do Spotify...",
      success: (result) => {
        const parts = [
          result.resolved > 0 ? `${result.resolved} música(s) vinculada(s) ao Spotify` : null,
          result.added > 0 ? `${result.added} faixa(s) adicionada(s) à playlist` : null,
          result.notFound > 0 ? `${result.notFound} música(s) não encontrada(s) no Spotify` : null,
          result.remaining > 0 ? `${result.remaining} ficaram para a próxima sincronização` : null,
        ].filter(Boolean);
        return parts.length === 0 ? "Tudo em dia: playlist completa" : parts.join(" · ");
      },
      error: "Erro ao sincronizar a playlist do Spotify",
      onSuccess: () => Promise.all([utils.song.getSpotifyStatus.invalidate(), utils.song.list.invalidate()]),
    })
  );

  if (!status?.configured) return null;

  if (!status.ok) {
    return (
      <Alert className="border-warning/50 bg-warning/10">
        <AlertTriangle className="h-4 w-4 !text-warning" />
        <AlertTitle>Spotify fora do ar</AlertTitle>
        <AlertDescription>
          <p>
            Avise o setor de desenvolvimento para verificar a integração. Enquanto isso, as músicas continuam sendo salvas, e os links continuam sendo preenchidos, só não entram na playlist.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex max-w-full items-center gap-1.5 rounded-full border bg-card py-1 pl-2.5 pr-1.5 text-xs">
      <Spotify className="size-4 shrink-0" />
      <span className="size-1.5 shrink-0 rounded-full bg-success" aria-label="Spotify conectado" role="img" />
      {status.playlist ? (
        <a
          href={status.playlist.url}
          target="_blank"
          rel="noreferrer"
          title="Abrir a playlist no Spotify"
          className="min-w-0 truncate text-muted-foreground hover:text-foreground hover:underline"
        >
          {status.playlist.total} faixas
        </a>
      ) : (
        <span className="text-muted-foreground">Spotify</span>
      )}
      {canEdit && (
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-6"
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        title="Sincronizar a playlist"
        aria-label="Sincronizar a playlist do Spotify"
      >
        {syncMutation.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      </Button>
      )}
    </div>
  );
}
