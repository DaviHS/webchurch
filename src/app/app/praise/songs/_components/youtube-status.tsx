"use client";

import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Youtube } from "@/components/icons/brand";
import { api } from "@/trpc/react";

export function YouTubeStatus() {
  const utils = api.useUtils();
  const { data: status, isFetching } = api.song.youtubeStatus.useQuery(undefined, {
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const recheck = async () => {
    const fresh = await utils.song.youtubeStatus.fetch({ force: true });
    utils.song.youtubeStatus.setData(undefined, fresh);
    if (fresh.ok) toast.success("YouTube conectado!");
  };

  const sync = api.song.syncYouTubePlaylist.useMutation({
    onSuccess: async (result) => {
      const parts = [
        result.added > 0 ? `${result.added} vídeo(s) adicionado(s) à playlist` : null,
        result.durationsFilled > 0 ? `${result.durationsFilled} duração(ões) preenchida(s)` : null,
        result.failed > 0 ? `${result.failed} vídeo(s) indisponível(is)` : null,
        result.remaining > 0 ? `${result.remaining} ficaram para a próxima (limite diário de cota)` : null,
      ].filter(Boolean);
      toast.success(parts.length === 0 ? "Tudo em dia: playlist completa e durações preenchidas." : parts.join(" · "));
      await Promise.all([utils.song.youtubeStatus.invalidate(), utils.song.list.invalidate()]);
    },
    onError: (error) => toast.error("Erro ao sincronizar a playlist: " + error.message),
  });

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
          <Button type="button" size="sm" variant="outline" onClick={() => void recheck()} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
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
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
        >
          {status.playlist.title} · {status.playlist.itemCount} vídeos
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="ml-auto h-7"
        onClick={() => sync.mutate()}
        disabled={sync.isPending}
        title="Adiciona à playlist os vídeos das músicas que ficaram de fora"
      >
        {sync.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
        Sincronizar playlist
      </Button>
    </div>
  );
}
