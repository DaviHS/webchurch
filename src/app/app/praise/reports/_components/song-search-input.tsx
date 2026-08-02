"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { abbreviateArtist } from "@/lib/formatters";
import type { Song } from "@/types";

interface SongSearchInputProps {
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
}

export function SongSearchInput({
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
}: SongSearchInputProps) {
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onShowResultsChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onShowResultsChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm) {
      const foundSong = allSongs.find(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (foundSong) {
        onSongSelect(foundSong);
      }
    }
  };

  return (
    <div className="space-y-1 relative z-50" ref={searchRef}>
      {selectedSongs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedSongs.map((song) => (
            <Badge 
              key={song.id} 
              variant="secondary" 
              className="gap-1 text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2"
            >
              <span className="max-w-[120px] sm:max-w-[200px] truncate">
                {song.title}
              </span>
              {song.artist && (
                <span className="text-muted-foreground text-[8px] sm:text-[10px]">
                  {abbreviateArtist(song.artist)}
                </span>
              )}
              <button
                onClick={() => onSongRemove(song.id)}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          placeholder={selectedSongs.length > 0 ? "Adicionar..." : placeholder}
          value={searchTerm}
          onChange={(e) => {
            onSearchChange(e.target.value);
            onShowResultsChange(true);
          }}
          onFocus={() => onShowResultsChange(true)}
          onKeyDown={handleKeyDown}
          className="pr-7 h-8 sm:h-9 text-xs sm:text-sm"
        />
        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
      </div>

      {showResults && searchTerm && (
        <div className="absolute z-[9999] w-full mt-1 bg-popover border rounded-lg shadow-2xl max-h-40 sm:max-h-48 overflow-auto">
          <div className="p-1.5">
            {isLoading ? (
              <div className="text-center py-2 text-xs text-muted-foreground">
                Carregando...
              </div>
            ) : allSongs.length === 0 ? (
              <div className="text-center py-2 text-xs text-muted-foreground">
                Nenhuma música encontrada
              </div>
            ) : (
              <div className="space-y-0.5">
                {allSongs.map((song) => {
                  const isSelected = selectedSongs.some(s => s.id === song.id);
                  return (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => onSongSelect(song)}
                      disabled={isSelected}
                      className={`w-full text-left p-1.5 rounded text-xs sm:text-sm transition-colors ${
                        isSelected
                          ? 'bg-muted cursor-not-allowed opacity-60'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <div className="font-medium">{song.title}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {song.artist || "Artista desconhecido"}
                      </div>
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