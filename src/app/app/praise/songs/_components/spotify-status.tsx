"use client";

import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from "lucide-react";
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border bg-card px-3 py-2 text-sm">
      <span className="flex items-center gap-2">
        <Spotify className="h-4 w-4 text-green-600" />
        <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
        Spotify conectado
      </span>
      {status.playlist && (
        <a
          href={status.playlist.url}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-10 min-w-0 items-center gap-1 break-words text-muted-foreground hover:text-foreground hover:underline sm:min-h-0"
        >
          {status.playlist.name} · {status.playlist.total} faixas
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      )}
      {canEdit && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full sm:ml-auto sm:w-auto"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          title="Vincula as músicas sem faixa e adiciona à playlist as que ficaram de fora"
        >
          {syncMutation.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Sincronizar playlist
        </Button>
      )}
    </div>
  );
}
