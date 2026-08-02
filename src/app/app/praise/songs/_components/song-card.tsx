"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { History, Play, Edit, Trash2, Eye, Youtube, MoreVertical } from "lucide-react";
import { getCategoryName } from "@/lib/formatters";
import type { Song } from "@/types";

interface SongCardProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (song: Song) => void;
  onViewLyrics: (song: Song) => void;
  onPlayYouTube: (song: Song) => void;
  onViewHistory: (song: Song) => void;
  onPresent: (song: Song) => void;
}

export function SongCard({
  song,
  onEdit,
  onDelete,
  onViewLyrics,
  onPlayYouTube,
  onViewHistory,
  onPresent,
}: SongCardProps) {
  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-md">
      <CardContent className="p-3 flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <CardTitle className="text-sm leading-tight line-clamp-1">
            {song.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="line-clamp-1">
              {song.artist || "Artista não informado"}
            </span>
            {song.category && (
              <Badge variant="outline" className="text-xs">
                {getCategoryName(song.category)}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => onEdit(song)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onDelete(song)}
                className="flex items-center gap-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onViewLyrics(song)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                <span>Ver Letra</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onViewHistory(song)}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                <span>Histórico</span>
              </DropdownMenuItem>

              {song.youtubeUrl && (
                <DropdownMenuItem
                  onClick={() => onPlayYouTube(song)}
                  className="flex items-center gap-2"
                >
                  <Youtube className="h-4 w-4" />
                  <span>YouTube</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="default"
            size="sm"
            onClick={() => onPresent(song)}
            disabled={!song.lyrics}
            title="Apresentar música"
            className="h-6 w-6 p-0"
          >
            <Play className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}