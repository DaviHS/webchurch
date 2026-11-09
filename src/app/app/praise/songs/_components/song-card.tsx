"use client";

import Link from "next/link";
import { CalendarPlus, Eye, FilePlus2, History, Pencil, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { Spotify, Youtube } from "@/components/icons/brand";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDateRelative } from "@/lib/formatters";
import { lyricsSnippet, matchesTitleOrArtist } from "@/lib/lyrics";
import { youtubeWatchUrl } from "@/lib/youtube-url";
import type { Song } from "@/types";

interface SongCardProps {
  song: Song;
  /** Termo da busca: se o acerto veio da letra, o card mostra o trecho. */
  search?: string;
  onEdit: (song: Song) => void;
  onDelete: (song: Song) => void;
  onViewLyrics: (song: Song) => void;
  onViewHistory: (song: Song) => void;
  onAddToEvent: (song: Song) => void;
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function SongCard({ song, search = "", onEdit, onDelete, onViewLyrics, onViewHistory, onAddToEvent }: SongCardProps) {
  const { can } = usePermissions();
  const canEdit = can("songs.edit");
  const canSchedule = can("events.edit");
  const hasLyrics = Boolean(song.lyrics?.trim());

  const youtubeLink = song.youtubeUrl ?? (song.youtubeVideoId ? youtubeWatchUrl(song.youtubeVideoId) : undefined);
  const spotifyLink = song.spotifyUrl ?? (song.spotifyTrackId ? `https://open.spotify.com/track/${song.spotifyTrackId}` : undefined);

  const snippet = search && !matchesTitleOrArtist(song.title, song.artist, search) ? lyricsSnippet(song.lyrics, search) : null;
  const played = song.playCount ?? 0;

  return (
    <Card className="flex h-full flex-col transition-shadow [@media(hover:hover)]:hover:shadow-md">
      <CardContent className="flex flex-1 items-center gap-1 p-1 pr-2">
        <button
          type="button"
          onClick={() => onViewLyrics(song)}
          aria-label={`Abrir a letra de ${song.title}`}
          className="min-w-0 flex-1 space-y-1 rounded-md p-2 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring active:bg-muted/50"
        >
          <span className="block truncate text-sm font-semibold leading-tight" title={song.title}>
            {song.title}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{song.artist || "Artista não informado"}</span>
          {snippet && <span className="block truncate text-xs italic text-muted-foreground">{snippet}</span>}
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {played > 0 && song.lastPlayed ? (
              <span>
                {formatDateRelative(song.lastPlayed)} · {played}×
              </span>
            ) : (
              <span>Nunca tocada</span>
            )}
            {!hasLyrics && (
              <Badge variant="warning" className="px-1.5 py-0 text-[11px]">
                Sem letra
              </Badge>
            )}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <RowActionsMenu
            label={`Ações de ${song.title}`}
            actions={[
              { label: "Ver letra", icon: Eye, onSelect: () => onViewLyrics(song) },
              { label: "Cadastrar letra", icon: FilePlus2, onSelect: () => onEdit(song), hidden: hasLyrics || !canEdit },
              { label: "Adicionar a um evento", icon: CalendarPlus, onSelect: () => onAddToEvent(song), hidden: !canSchedule },
              { label: "Histórico", icon: History, onSelect: () => onViewHistory(song) },
              { label: "Abrir no YouTube", icon: Youtube, onSelect: () => youtubeLink && openExternal(youtubeLink), hidden: !youtubeLink },
              { label: "Abrir no Spotify", icon: Spotify, onSelect: () => spotifyLink && openExternal(spotifyLink), hidden: !spotifyLink },
              { label: "Editar", icon: Pencil, onSelect: () => onEdit(song), hidden: !canEdit },
              { label: "Excluir", icon: Trash2, onSelect: () => onDelete(song), destructive: true, hidden: !canEdit },
            ]}
          />

          {hasLyrics && (
            <Button asChild size="icon" title="Apresentar música" aria-label={`Apresentar ${song.title}`}>
              <Link href={`/presentation/control?song=${song.id}`}>
                <Play />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
