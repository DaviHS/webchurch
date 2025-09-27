// components/compact-song-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CompactSongCardProps {
  song: any;
  onEdit: (song: any) => void;
  onDelete: (song: any) => void;
  onViewLyrics: (song: any) => void;
  onPlayYouTube: (song: any) => void;
  onPresent: (song: any) => void;
}

export function CompactSongCard({ 
  song, 
  onEdit, 
  onDelete, 
  onViewLyrics, 
  onPlayYouTube, 
  onPresent 
}: CompactSongCardProps) {
  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      hymn: "Hino",
      praise: "Louvor",
      worship: "Adoração",
      chorus: "Coro",
      special: "Especial"
    };
    return categories[category] || category;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="transition-all hover:shadow-md h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm leading-tight line-clamp-2 flex-1">
            {song.title}
          </CardTitle>
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {formatDuration(song.duration)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
          {song.artist || "Artista não informado"}
        </p>
      </CardHeader>
      
      <CardContent className="pb-2 pt-0 flex-grow">
        <Badge variant="outline" className="text-xs">
          {getCategoryName(song.category)}
        </Badge>
      </CardContent>
      
      <CardContent className="pt-0 pb-2 flex-shrink-0">
        <div className="flex justify-between items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => onEdit(song)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(song)} 
                className="text-red-600"
              >
                Excluir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewLyrics(song)}>
                Ver Letra
              </DropdownMenuItem>
              {song.youtubeUrl && (
                <DropdownMenuItem onClick={() => onPlayYouTube(song)}>
                  YouTube
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