"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { abbreviateArtist } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Song } from "@/types";

interface SongSearchInputProps {
  id?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showResults: boolean;
  onShowResultsChange: (show: boolean) => void;
  selectedSongs: Song[];
  onSongSelect: (song: Song) => void;
  onSongRemove: (songId: number) => void;
  allSongs: Song[];
  isLoading: boolean;
  placeholder?: string;
  /** Resultados na própria página (dentro de uma folha), em vez de uma lista flutuante. */
  inline?: boolean;
}

export function SongSearchInput({
  id,
  searchTerm,
  onSearchChange,
  showResults,
  onShowResultsChange,
  selectedSongs,
  onSongSelect,
  onSongRemove,
  allSongs,
  isLoading,
  placeholder = "Digite o nome da música...",
  inline = false,
}: SongSearchInputProps) {
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDownOutside = (event: PointerEvent) => {
      if (searchRef.current && event.target instanceof Node && !searchRef.current.contains(event.target)) {
        onShowResultsChange(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () => document.removeEventListener("pointerdown", handlePointerDownOutside);
  }, [onShowResultsChange]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && searchTerm) {
      event.preventDefault();
      const foundSong = allSongs.find((song) => song.title.toLowerCase().includes(searchTerm.toLowerCase()));
      if (foundSong) {
        onSongSelect(foundSong);
      }
    }
  };

  return (
    <div className={cn("space-y-2", !inline && "relative z-50")} ref={searchRef}>
      {selectedSongs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSongs.map((song) => (
            <Badge key={song.id} variant="secondary" className="max-w-full gap-1 py-0 pl-2.5 pr-0 text-xs font-medium">
              <span className="min-w-0 truncate">{song.title}</span>
              {song.artist && (
                <span className="shrink-0 font-normal text-muted-foreground">{abbreviateArtist(song.artist)}</span>
              )}
              <button
                type="button"
                onClick={() => onSongRemove(song.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title={`Remover "${song.title}"`}
                aria-label={`Remover "${song.title}"`}
              >
                <X className="size-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          id={id}
          placeholder={selectedSongs.length > 0 ? "Adicionar música..." : placeholder}
          value={searchTerm}
          onChange={(event) => {
            onSearchChange(event.target.value);
            onShowResultsChange(true);
          }}
          onFocus={() => onShowResultsChange(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          enterKeyHint="search"
          className="h-10 pr-9 sm:h-9"
        />
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {showResults && searchTerm && (
        <div
          className={cn(
            "mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-popover",
            inline ? "max-h-[45dvh]" : "absolute z-9999 shadow-2xl sm:max-h-56",
          )}
        >
          <div className="p-1">
            {isLoading ? (
              <div className="py-3 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : allSongs.length === 0 ? (
              <div className="py-3 text-center text-sm text-muted-foreground">Nenhuma música encontrada</div>
            ) : (
              <div className="space-y-0.5">
                {allSongs.map((song) => {
                  const isSelected = selectedSongs.some((selected) => selected.id === song.id);
                  return (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => onSongSelect(song)}
                      disabled={isSelected}
                      className={cn(
                        "flex min-h-11 w-full flex-col justify-center rounded px-2 py-1.5 text-left text-sm transition-colors sm:min-h-9",
                        isSelected ? "cursor-not-allowed bg-muted opacity-60" : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <span className="w-full truncate font-medium">{song.title}</span>
                      <span className="w-full truncate text-xs text-muted-foreground">
                        {song.artist || "Artista desconhecido"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
