"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Filter, X } from "lucide-react";
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
    <Card className="relative overflow-visible">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="size-4 shrink-0 text-primary" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="report-period" className="text-xs font-medium sm:text-sm">
              Período
            </Label>
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger id="report-period" className="h-10 sm:h-9">
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

          <div className="space-y-1.5">
            <Label className="text-xs font-medium sm:text-sm">
              {timeRange === "custom" ? "Período personalizado" : "Visualização"}
            </Label>
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              placeholder={timeRange === "custom" ? "Selecione as datas" : "Período definido"}
              disabled={timeRange !== "custom"}
              closeOnSelect={false}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="report-song-search" className="text-xs font-medium sm:text-sm">
              Músicas
            </Label>
            <SongSearchInput
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
          </div>
        </div>

        <Button variant="outline" onClick={onClearFilters} className="w-full sm:w-auto">
          <X />
          Limpar filtros
        </Button>

        {timeRange === "custom" && !isDateRangeValid && (
          <p className="flex items-center gap-1.5 text-xs text-warning">
            <AlertTriangle className="size-3.5 shrink-0" />
            Selecione a data inicial e a final para consultar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
