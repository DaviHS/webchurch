"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@/trpc/react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ReportFilters } from "./_components/report-filters";
import { ReportStatsCard } from "./_components/report-stats-card";
import { ReportRanking } from "./_components/report-ranking";
import { ReportChart } from "./_components/report-chart";
import { SongDetailsDialog } from "./_components/song-details-dialog";
import type { Song, DateRange } from "@/types";

const DEFAULT_TIME_RANGE = "30";
const EMPTY_RANGE: DateRange = { from: undefined, to: undefined };

function getPresetRange(days: string): DateRange {
  const to = new Date();
  return { from: subDays(to, Number(days)), to };
}

function toCsvField(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState(DEFAULT_TIME_RANGE);
  const [customRange, setCustomRange] = useState<DateRange>(EMPTY_RANGE);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [selectedSongForDetails, setSelectedSongForDetails] = useState<Song | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { data: songsData, isLoading: songsLoading } = api.song.list.useQuery({
    search: debouncedSearchTerm || undefined,
    limit: 50,
  });

  const dateRange = timeRange === "custom" ? customRange : getPresetRange(timeRange);

  const allSongs: Song[] = songsData?.songs.map((song) => ({
    ...song,
    artist: song.artist ?? "",
    lyrics: song.lyrics ?? undefined,
    youtubeUrl: song.youtubeUrl ?? undefined,
    youtubeVideoId: song.youtubeVideoId ?? undefined,
    duration: song.duration ?? undefined,
  })) ?? [];

  const startDate = dateRange.from ? startOfDay(dateRange.from) : undefined;
  const endDate = dateRange.to ? endOfDay(dateRange.to) : undefined;
  const isDateRangeValid = startDate !== undefined && endDate !== undefined;

  const { data: report, isLoading } = api.event.getSongsReport.useQuery(
    { startDate, endDate, songIds: selectedSongs.length > 0 ? selectedSongs.map(s => s.id) : undefined },
    { enabled: isDateRangeValid, staleTime: 0, refetchOnWindowFocus: false }
  );

  const { data: songExecutions, isLoading: isLoadingExecutions } =
    api.event.getSongExecutions.useQuery(
      { songId: selectedSongForDetails?.id ?? 0, startDate, endDate },
      { enabled: isDialogOpen && selectedSongForDetails !== null }
    );

  const handleTimeRangeChange = (value: string) => {
    if (value === "custom") setCustomRange(dateRange);
    setTimeRange(value);
  };

  const getStats = () => {
    if (!report?.length) return null;
    const counts = report.map((item) => item.count);
    const totalExecucoes = counts.reduce((sum, count) => sum + count, 0);
    return {
      totalMusicas: report.length,
      totalExecucoes,
      media: totalExecucoes / counts.length,
      maxExecucoes: Math.max(...counts),
    };
  };

  const getPeriodText = () => {
    if (!dateRange.from || !dateRange.to) return "";
    return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`;
  };

  const handleSelectSong = (song: Song) => {
    if (!selectedSongs.find(s => s.id === song.id)) {
      setSelectedSongs([...selectedSongs, song]);
    }
    setSearchTerm("");
    setShowSearchResults(false);
  };

  const handleOpenSongDetails = (song: Song) => {
    setSelectedSongForDetails(song);
    setIsDialogOpen(true);
  };

  const exportToCSV = () => {
    if (!report) return;
    const headers = ["Posição", "Música", "Artista", "Execuções"];
    const csvContent = [
      headers.join(","),
      ...report.map((item, index) =>
        [index + 1, toCsvField(item.title), toCsvField(item.artist ?? ""), item.count].join(",")
      )
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-musicas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSongs([]);
    setTimeRange(DEFAULT_TIME_RANGE);
    setCustomRange(EMPTY_RANGE);
    setShowSearchResults(false);
  };

  const stats = getStats();
  const showLoading = isLoading && isDateRangeValid;

  return (
    <PageContainer>
      <PageHeader
        title="Relatórios"
        icon={TrendingUp}
        description="Análise das músicas mais executadas."
        actions={
          <Button onClick={exportToCSV} disabled={!report?.length} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        }
      />

      <ReportFilters
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        dateRange={dateRange}
        onDateRangeChange={setCustomRange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showSearchResults={showSearchResults}
        onShowSearchResultsChange={setShowSearchResults}
        selectedSongs={selectedSongs}
        onSongSelect={handleSelectSong}
        onSongRemove={(id) => setSelectedSongs(selectedSongs.filter(s => s.id !== id))}
        allSongs={allSongs}
        isLoadingSongs={songsLoading}
        onClearFilters={clearFilters}
        isDateRangeValid={isDateRangeValid}
      />

      <div className="grid gap-6">
        <ReportStatsCard stats={stats} isLoading={showLoading} periodText={isDateRangeValid ? getPeriodText() : ""} />

        <ReportRanking
          report={report}
          isLoading={showLoading}
          isDateRangeValid={isDateRangeValid}
          onSongClick={handleOpenSongDetails}
        />

        <ReportChart
          report={report}
          isLoading={showLoading}
          isDateRangeValid={isDateRangeValid}
          onBarClick={handleOpenSongDetails}
        />
      </div>

      <SongDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        song={selectedSongForDetails}
        executions={songExecutions}
        isLoading={isLoadingExecutions}
        onFilterBySong={handleSelectSong}
      />
    </PageContainer>
  );
}