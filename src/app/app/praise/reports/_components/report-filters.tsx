"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { SongSearchInput } from "./song-search-input";
import type { Song, DateRange } from "@/types";

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
}

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
}: ReportFiltersProps) {
  return (
    <Card className="overflow-visible relative">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Filter className="h-4 w-4 text-primary" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] sm:text-xs font-medium">Período</Label>
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">6 meses</SelectItem>
                <SelectItem value="365">12 meses</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] sm:text-xs font-medium">
              {timeRange === "custom" ? "Período personalizado" : "Visualização"}
            </Label>
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              placeholder={timeRange === "custom" ? "Selecione as datas" : "Período definido"}
              disabled={timeRange !== "custom"}
              className="h-8 sm:h-9 text-xs sm:text-sm"
              closeOnSelect={false}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <Label className="text-[10px] sm:text-xs font-medium">Músicas</Label>
            <SongSearchInput
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
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3">
          <Button variant="outline" onClick={onClearFilters} size="sm" className="h-7 sm:h-8 text-xs">
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            Limpar filtros
          </Button>
        </div>

        {timeRange === "custom" && !isDateRangeValid && (
          <div className="mt-1.5 text-[10px] sm:text-xs text-amber-500">
            ⚠️ Selecione a data inicial e final para consultar
          </div>
        )}
      </CardContent>
    </Card>
  );
}