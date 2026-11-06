"use client";

import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Youtube } from "@/components/icons/brand";
import { api } from "@/trpc/react";
import { mutationFeedback } from "@/lib/mutation-feedback";

export function YouTubeStatus() {
  const utils = api.useUtils();
  const { data: status, isFetching } = api.song.getYouTubeStatus.useQuery(undefined, {
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const handleRecheck = async () => {
    const fresh = await utils.song.getYouTubeStatus.fetch({ force: true });
    utils.song.getYouTubeStatus.setData(undefined, fresh);
    if (fresh.ok) toast.success("YouTube conectado");
  };

  const syncPlaylistMutation = api.song.syncYouTubePlaylist.useMutation(
    mutationFeedback({
      loading: "Sincronizando a playlist do YouTube...",
      success: (result) => {
        const parts = [
          result.added > 0 ? `${result.added} vídeo(s) adicionado(s) à playlist` : null,
          result.durationsFilled > 0 ? `${result.durationsFilled} duração(ões) preenchida(s)` : null,
          result.failed > 0 ? `${result.failed} vídeo(s) indisponível(is)` : null,
          result.remaining > 0 ? `${result.remaining} ficaram para a próxima (limite diário de cota)` : null,
        ].filter(Boolean);
        return parts.length === 0 ? "Tudo em dia: playlist completa e durações preenchidas" : parts.join(" · ");
      },
      error: "Erro ao sincronizar a playlist",
      onSuccess: () => Promise.all([utils.song.getYouTubeStatus.invalidate(), utils.song.list.invalidate()]),
    })
  );

  if (!status?.configured) return null;

  if (!status.ok) {
    return (
      <Alert className="border-warning/50 bg-warning/10">
        <AlertTriangle className="h-4 w-4 !text-warning" />
        <AlertTitle>Integração com o YouTube parada</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{status.message}</p>
          {status.reason === "auth" && (
            <ol className="list-decimal space-y-0.5 pl-5 text-sm">
              <li>
                No computador do sistema, rode <code className="rounded bg-muted px-1">npm run youtube:token</code> e autorize
                com a conta dona da playlist.
              </li>
              <li>
                Atualize <code className="rounded bg-muted px-1">YOUTUBE_REFRESH_TOKEN</code> no <code>.env</code> e na
                Vercel (o script mostra o valor).
              </li>
              <li>
                Para não expirar de novo: no Google Cloud, em <em>Tela de consentimento OAuth</em>, mude o app de “Teste”
                para <strong>“Em produção”</strong>.
              </li>
            </ol>
          )}
          <p className="text-sm text-muted-foreground">
            Enquanto isso, as músicas continuam sendo salvas — só não entram na playlist. Depois de corrigir, use
            “Sincronizar”.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void handleRecheck()} disabled={isFetching}>
            {isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Verificar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border bg-card px-3 py-2 text-sm">
      <span className="flex items-center gap-2">
        <Youtube className="h-4 w-4 text-red-600" />
        <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
        YouTube conectado
      </span>
      {status.playlist && (
        <a
          href={status.playlist.url}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-10 min-w-0 items-center gap-1 break-words text-muted-foreground hover:text-foreground hover:underline sm:min-h-0"
        >
          {status.playlist.title} · {status.playlist.itemCount} vídeos
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full sm:ml-auto sm:w-auto"
        onClick={() => syncPlaylistMutation.mutate()}
        disabled={syncPlaylistMutation.isPending}
        title="Adiciona à playlist os vídeos das músicas que ficaram de fora"
      >
        {syncPlaylistMutation.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        Sincronizar playlist
      </Button>
    </div>
  );
}
