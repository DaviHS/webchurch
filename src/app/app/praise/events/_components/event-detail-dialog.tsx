"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Calendar, Clock, Copy, ExternalLink, Info, Printer, Trash2, Loader2, MapPin, Music, Projector, User, Users, type LucideIcon } from "lucide-react";
import { useConfirm } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Spotify } from "@/components/icons/brand";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatTime } from "@/lib/formatters";
import { fullName } from "@/lib/formatters/person";
import { toast } from "sonner";
import { toastError } from "@/lib/toast";
import { eventTypeBadge, eventTypeLabel } from "@/lib/labels";
import { api } from "@/trpc/react";
import type { EventData, EventWithDetails } from "@/types";
import { PrintRepertoireDialog } from "./print-repertoire-dialog";
import { EventParticipantsManager } from "./event-participants-manager";
import { EventSongsManager } from "./event-songs-manager";
import { EventPassagesManager } from "./event-passages-manager";

interface EventDetailDialogProps {
  event: EventData | EventWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}

function InfoField({ label, icon: Icon, children }: { label: string; icon?: LucideIcon; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
        {Icon && <Icon className="size-4" />}
        {label}
      </p>
      <div className="break-words font-medium">{children}</div>
    </div>
  );
}

export function EventDetailDialog({ event, open, onOpenChange, isLoading = false }: EventDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [printOpen, setPrintOpen] = useState(false);
  const utils = api.useUtils();
  const canEdit = usePermissions().can("events.edit");
  const confirm = useConfirm();
  const [missingSongs, setMissingSongs] = useState<string[]>([]);
  const playlistQuery = api.event.spotifyPlaylist.useQuery(event.id, { enabled: open });
  const playlist = playlistQuery.data ?? null;
  const createPlaylist = api.event.createSpotifyPlaylist.useMutation({
    onSuccess: async (result) => {
      setMissingSongs(result.missing);
      await utils.event.spotifyPlaylist.invalidate(event.id);
    },
    onError: (error) => toastError(error.message),
  });
  const deletePlaylist = api.event.deleteSpotifyPlaylist.useMutation({
    onSuccess: async () => {
      setMissingSongs([]);
      await utils.event.spotifyPlaylist.invalidate(event.id);
      toast.success("Playlist excluída");
    },
    onError: (error) => toastError(error.message),
  });
  const handleDeletePlaylist = async () => {
    const ok = await confirm({
      title: "Excluir a playlist do Spotify?",
      description: "A playlist some do Spotify da igreja. O repertório do evento não é alterado, e dá para criar outra depois.",
      confirmLabel: "Excluir playlist",
      destructive: true,
    });
    if (ok) deletePlaylist.mutate(event.id);
  };

  const songs = "songs" in event ? event.songs : [];
  const passages = "passages" in event ? event.passages : [];
  const participants = "participants" in event ? event.participants : [];
  const withoutLyrics = songs.filter((item) => item.song && !item.song.lyrics?.trim()).map((item) => item.song?.title ?? "");
  const hasMessage = Boolean(event.preacher) || Boolean(event.bibleVerse);

  // Repertório em texto, pronto para colar no WhatsApp (negrito com asteriscos).
  const copyRepertoire = async () => {
    const lines = [...songs]
      .sort((a, b) => a.order - b.order)
      .map((item, index) => {
        const title = item.song?.title ?? "Música removida";
        const artist = item.song?.artist ? ` – ${item.song.artist}` : "";
        const leader = item.leader ? ` (${fullName(item.leader)})` : "";
        return `${index + 1}. ${title}${artist}${leader}`;
      });
    try {
      await navigator.clipboard.writeText([`*${event.title} – ${formatDate(event.date)}*`, ...lines].join("\n"));
      toast.success("Repertório copiado");
    } catch {
      toastError("Não foi possível copiar.");
    }
  };

  // Devolve a promessa para quem chamou poder esperar a lista atualizada (e atualiza também as contagens dos cards).
  const handleUpdate = () => Promise.all([utils.event.getById.invalidate(event.id), utils.event.list.invalidate()]);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="xl" className="h-[95dvh] sm:h-[90dvh]">
        <ResponsiveDialogHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:pr-8">
            <div className="min-w-0 flex-1">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <ResponsiveDialogTitle className="text-lg sm:text-xl">Carregando…</ResponsiveDialogTitle>
                </div>
              ) : (
                <>
                  <ResponsiveDialogTitle className="line-clamp-2 break-words text-lg sm:text-xl">
                    {event.title}
                  </ResponsiveDialogTitle>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={eventTypeBadge(event.type)}>{eventTypeLabel(event.type)}</Badge>
                    <Badge variant="outline">
                      <Calendar className="mr-1 size-3" />
                      {formatDate(event.date)}
                    </Badge>
                    {event.startTime && (
                      <Badge variant="outline">
                        <Clock className="mr-1 size-3" />
                        {formatTime(event.startTime)}
                      </Badge>
                    )}
                  </div>
                </>
              )}
              <ResponsiveDialogDescription className="sr-only">
                Informações, repertório e participantes do evento
              </ResponsiveDialogDescription>
            </div>
            {!isLoading && songs.length + passages.length > 0 && (
              <Button asChild className="w-full shrink-0 sm:w-auto">
                <Link href={`/presentation/control?event=${event.id}`}>
                  <Projector />
                  Apresentar
                </Link>
              </Button>
            )}
          </div>
        </ResponsiveDialogHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingState message="Carregando evento…" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-4 pt-3 sm:px-6">
              <TabsList className="grid h-11 w-full grid-cols-4 sm:h-9">
                <TabsTrigger value="info" className="h-full gap-1 px-1 text-xs sm:px-3 sm:text-sm">
                  <Info className="hidden size-4 sm:block" />
                  Informações
                </TabsTrigger>
                <TabsTrigger value="songs" className="h-full gap-1 px-1 text-xs sm:px-3 sm:text-sm">
                  <Music className="hidden size-4 sm:block" />
                  Músicas
                  {songs.length > 0 && <span className="text-muted-foreground">{songs.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="passages" className="h-full gap-1 px-1 text-xs sm:px-3 sm:text-sm">
                  <BookOpen className="hidden size-4 sm:block" />
                  Leituras
                  {passages.length > 0 && <span className="text-muted-foreground">{passages.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="participants" className="h-full gap-1 px-1 text-xs sm:px-3 sm:text-sm">
                  <Users className="hidden size-4 sm:block" />
                  Equipe
                  {participants.length > 0 && <span className="text-muted-foreground">{participants.length}</span>}
                </TabsTrigger>
              </TabsList>
            </div>

            <ResponsiveDialogBody className="pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:pb-6">
              <TabsContent value="info" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="size-5" />
                      Informações do evento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoField label="Tipo">{eventTypeLabel(event.type)}</InfoField>

                    <InfoField label="Data e horário" icon={Calendar}>
                      <span className="flex flex-wrap items-center gap-2">
                        {formatDate(event.date)}
                        {event.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-4" />
                            {formatTime(event.startTime)}
                            {event.endTime && <> - {formatTime(event.endTime)}</>}
                          </span>
                        )}
                      </span>
                    </InfoField>

                    {event.location && (
                      <InfoField label="Local" icon={MapPin}>
                        {event.location}
                      </InfoField>
                    )}
                  </CardContent>
                </Card>

                {hasMessage && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="size-5" />
                        Mensagem
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {event.preacher && (
                        <InfoField label="Pregador" icon={User}>
                          {event.preacher}
                        </InfoField>
                      )}
                      {event.bibleVerse && <InfoField label="Versículo bíblico">{event.bibleVerse}</InfoField>}
                    </CardContent>
                  </Card>
                )}

                {event.description && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Descrição</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap break-words text-muted-foreground">{event.description}</p>
                    </CardContent>
                  </Card>
                )}

              </TabsContent>

              <TabsContent value="songs" className="mt-0 space-y-4">
                {songs.length > 0 && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => void copyRepertoire()}>
                      <Copy className="mr-1" /> Copiar repertório
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setPrintOpen(true)}>
                      <Printer className="mr-1" /> Imprimir
                    </Button>
                    {canEdit && !playlist && !playlistQuery.isLoading && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={createPlaylist.isPending}
                        onClick={() => createPlaylist.mutate({ eventId: event.id, name: `${event.title} – ${formatDate(event.date)}` })}
                      >
                        {createPlaylist.isPending ? <Loader2 className="mr-1 animate-spin" /> : <Spotify className="mr-1" />}
                        Criar playlist no Spotify
                      </Button>
                    )}
                  </div>
                )}
                {withoutLyrics.length > 0 && (
                  <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm" role="status">
                    <p className="font-medium">
                      {withoutLyrics.length === 1 ? "1 música está sem letra" : `${withoutLyrics.length} músicas estão sem letra`}: {withoutLyrics.join(", ")}.
                    </p>
                    <p className="text-muted-foreground">Na apresentação elas passam sem slides. Cadastre a letra na tela de Músicas.</p>
                  </div>
                )}
                {playlist && (
                  <div className="space-y-1 rounded-md border border-success/40 bg-success/10 p-3 text-sm">
                    <p className="font-medium">Este repertório tem uma playlist no Spotify.</p>
                    <div className="flex flex-wrap items-center gap-x-4">
                      <a
                        href={playlist.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                      >
                        <ExternalLink className="size-4" /> Abrir no Spotify
                      </a>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => void handleDeletePlaylist()}
                          disabled={deletePlaylist.isPending}
                          className="inline-flex min-h-10 items-center gap-1 font-medium text-destructive underline-offset-4 hover:underline disabled:opacity-50"
                        >
                          {deletePlaylist.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                          Excluir playlist
                        </button>
                      )}
                    </div>
                    {missingSongs.length > 0 && (
                      <p className="text-muted-foreground">Ficaram de fora (sem faixa no Spotify): {missingSongs.join(", ")}.</p>
                    )}
                  </div>
                )}
                <EventSongsManager eventId={event.id} songs={songs} onUpdate={handleUpdate} />
              </TabsContent>

              <TabsContent value="passages" className="mt-0">
                <EventPassagesManager eventId={event.id} passages={passages} onUpdate={handleUpdate} />
              </TabsContent>

              <TabsContent value="participants" className="mt-0">
                <EventParticipantsManager eventId={event.id} participants={participants} onUpdate={handleUpdate} />
              </TabsContent>
            </ResponsiveDialogBody>
          </Tabs>
        )}
      </ResponsiveDialogContent>
      <PrintRepertoireDialog eventId={event.id} open={printOpen} onOpenChange={setPrintOpen} />
    </ResponsiveDialog>
  );
}
