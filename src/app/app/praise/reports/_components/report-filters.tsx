"use client";

import { useState } from "react";
import { AlertTriangle, Music, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { SongSearchInput } from "./song-search-input";
import type { Song, DateRange } from "@/types";

export const PERIODS = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "3 meses" },
  { value: "180", label: "6 meses" },
  { value: "365", label: "12 meses" },
  { value: "custom", label: "Personalizado" },
];

interface ReportFiltersProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showSearchResults: boolean;
  onShowSearchResultsChange: (show: boolean) => void;
  selectedSongs: Song[];
  onSongSelect: (song: Song) => void;
  onSongRemove: (songId: number) => void;
  allSongs: Song[];
  isLoadingSongs: boolean;
  onClearFilters: () => void;
  isDateRangeValid: boolean;
  /** Há algo diferente do padrão (outro período ou músicas escolhidas). */
  isFiltered: boolean;
}

/** Período em chips (um toque) e filtro por música numa folha, para o resultado aparecer logo na primeira tela. */
export function ReportFilters({
  timeRange,
  onTimeRangeChange,
  dateRange,
  onDateRangeChange,
  searchTerm,
  onSearchChange,
  showSearchResults,
  onShowSearchResultsChange,
  selectedSongs,
  onSongSelect,
  onSongRemove,
  allSongs,
  isLoadingSongs,
  onClearFilters,
  isDateRangeValid,
  isFiltered,
}: ReportFiltersProps) {
  const [songsOpen, setSongsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="Período"
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {PERIODS.map((period) => {
          const active = timeRange === period.value;
          return (
            <button
              key={period.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onTimeRangeChange(period.value)}
              className={cn(
                "min-h-10 shrink-0 snap-start rounded-full border px-4 text-sm font-medium transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
              )}
            >
              {period.label}
            </button>
          );
        })}
      </div>

      {timeRange === "custom" && (
        <div className="space-y-1.5">
          <DateRangePicker value={dateRange} onChange={onDateRangeChange} placeholder="Selecione as datas" closeOnSelect={false} />
          {!isDateRangeValid && (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle className="size-3.5 shrink-0" />
              Selecione a data inicial e a final para consultar.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setSongsOpen(true)}>
          <Music />
          {selectedSongs.length > 0 ? `Músicas (${selectedSongs.length})` : "Filtrar por música"}
        </Button>
        {selectedSongs.map((song) => (
          <Badge key={song.id} variant="secondary" className="max-w-full gap-1 py-0 pl-2.5 pr-0 text-xs font-medium">
            <span className="min-w-0 truncate">{song.title}</span>
            <button
              type="button"
              onClick={() => onSongRemove(song.id)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Remover "${song.title}"`}
            >
              <X className="size-3.5" />
            </button>
          </Badge>
        ))}
        {isFiltered && (
          <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
            <X />
            Limpar
          </Button>
        )}
      </div>

      <ResponsiveDialog open={songsOpen} onOpenChange={setSongsOpen}>
        <ResponsiveDialogContent size="md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Filtrar por música</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Escolha uma ou mais músicas para ver só o histórico delas.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="pb-4">
            <SongSearchInput
              inline
              id="report-song-search"
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              showResults={showSearchResults}
              onShowResultsChange={onShowSearchResultsChange}
              selectedSongs={selectedSongs}
              onSongSelect={onSongSelect}
              onSongRemove={onSongRemove}
              allSongs={allSongs}
              isLoading={isLoadingSongs}
            />
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button type="button" onClick={() => setSongsOpen(false)}>
              Pronto
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
