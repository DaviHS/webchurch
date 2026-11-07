"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { usePermissions } from "@/hooks/use-permissions";
import { History, Play, Pencil, Trash2, Eye } from "lucide-react";
import { Spotify, Youtube } from "@/components/icons/brand";
import { youtubeWatchUrl } from "@/lib/youtube-url";
import type { Song } from "@/types";

interface SongCardProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (song: Song) => void;
  onViewLyrics: (song: Song) => void;
  onPlayYouTube: (song: Song) => void;
  onPlaySpotify: (song: Song) => void;
  onViewHistory: (song: Song) => void;
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function SongCard({ song, onEdit, onDelete, onViewLyrics, onViewHistory }: SongCardProps) {
  const canEdit = usePermissions().can("songs.edit");
  const youtubeLink = song.youtubeUrl ?? (song.youtubeVideoId ? youtubeWatchUrl(song.youtubeVideoId) : undefined);
  const spotifyLink = song.spotifyUrl ?? (song.spotifyTrackId ? `https://open.spotify.com/track/${song.spotifyTrackId}` : undefined);
  return (
    <Card className="flex h-full flex-col transition-shadow [@media(hover:hover)]:hover:shadow-md">
      <CardContent className="flex flex-1 items-center justify-between gap-2 p-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-sm font-semibold leading-tight" title={song.title}>
            {song.title}
          </h3>
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{song.artist || "Artista não informado"}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {youtubeLink && (
            <Button asChild variant="ghost" size="icon-sm" className="size-8">
              <a href={youtubeLink} target="_blank" rel="noopener noreferrer" title="Abrir no YouTube" aria-label={`Abrir ${song.title} no YouTube`}>
                <Youtube className="size-5" />
              </a>
            </Button>
          )}
          {spotifyLink && (
            <Button asChild variant="ghost" size="icon-sm" className="size-8">
              <a href={spotifyLink} target="_blank" rel="noopener noreferrer" title="Abrir no Spotify" aria-label={`Abrir ${song.title} no Spotify`}>
                <Spotify className="size-5" />
              </a>
            </Button>
          )}
          <RowActionsMenu
            label={`Ações de ${song.title}`}
            actions={[
              { label: "Ver letra", icon: Eye, onSelect: () => onViewLyrics(song) },
              { label: "Histórico", icon: History, onSelect: () => onViewHistory(song) },
              { label: "Abrir no YouTube", icon: Youtube, onSelect: () => youtubeLink && openExternal(youtubeLink), hidden: !youtubeLink },
              { label: "Abrir no Spotify", icon: Spotify, onSelect: () => spotifyLink && openExternal(spotifyLink), hidden: !spotifyLink },
              { label: "Editar", icon: Pencil, onSelect: () => onEdit(song), hidden: !canEdit },
              { label: "Excluir", icon: Trash2, onSelect: () => onDelete(song), destructive: true, hidden: !canEdit },
            ]}
          />

          {song.lyrics ? (
            <Button asChild size="icon" title="Apresentar música" aria-label={`Apresentar ${song.title}`}>
              <Link href={`/presentation/control?song=${song.id}`}>
                <Play />
              </Link>
            </Button>
          ) : (
            <Button size="icon" disabled title="Cadastre a letra para apresentar" aria-label="Cadastre a letra para apresentar">
              <Play />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
