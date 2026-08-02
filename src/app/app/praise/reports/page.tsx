"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp } from "lucide-react";
import { api } from "@/trpc/react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { safeParseNumber } from "@/lib/formatters";
import { ReportFilters } from "./_components/report-filters";
import { ReportStatsCard } from "./_components/report-stats-card";
import { ReportRanking } from "./_components/report-ranking";
import { ReportChart } from "./_components/report-chart";
import { SongDetailsDialog } from "./_components/song-details-dialog";
import type { Song, DateRange, ReportItem } from "@/types";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [selectedSongForDetails, setSelectedSongForDetails] = useState<Song | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: songsData, isLoading: songsLoading } = api.song.list.useQuery({
    search: searchTerm || undefined,
    limit: 50,
  });

  const allSongs: Song[] = songsData?.songs?.map((song) => ({
    ...song,
    artist: song.artist ?? "",
    lyrics: song.lyrics ?? undefined,
    youtubeUrl: song.youtubeUrl ?? undefined,
    youtubeVideoId: song.youtubeVideoId ?? undefined,
    duration: song.duration ?? undefined,
  })) || [];

  const getPeriodParams = () => {
    if (timeRange === "custom" && dateRange.from && dateRange.to) {
      return {
        startDate: startOfDay(dateRange.from),
        endDate: endOfDay(dateRange.to),
      };
    }
    if (timeRange !== "custom") {
      const endDate = endOfDay(new Date());
      return {
        startDate: startOfDay(subDays(endDate, Number(timeRange))),
        endDate,
      };
    }
    return { startDate: undefined, endDate: undefined };
  };

  const { startDate, endDate } = getPeriodParams();
  const isDateRangeValid = timeRange !== "custom" || !!(dateRange.from && dateRange.to);

  const { data: report, isLoading, refetch } = api.event.getSongsReport.useQuery(
    { startDate, endDate, songIds: selectedSongs.length > 0 ? selectedSongs.map(s => s.id) : undefined },
    { enabled: isDateRangeValid, staleTime: 0, refetchOnWindowFocus: false }
  );

  const { data: songExecutions, isLoading: isLoadingExecutions, refetch: refetchExecutions } =
    api.event.getSongExecutions.useQuery(
      { songId: selectedSongForDetails?.id || 0, startDate, endDate },
      { enabled: false }
    );

  useEffect(() => {
    if (timeRange !== "custom") {
      const end = new Date();
      const start = subDays(end, Number(timeRange));
      setDateRange({ from: start, to: end });
    }
  }, [timeRange]);

  useEffect(() => {
    if (isDateRangeValid) {
      void refetch();
    }
  }, [startDate, endDate, selectedSongs, refetch, isDateRangeValid]);

  const getStats = () => {
    if (!report?.length) return null;
    const counts = report.map((item: ReportItem) => safeParseNumber(item.count));
    const totalExecucoes = counts.reduce((sum, count) => sum + count, 0);
    return {
      totalMusicas: report.length,
      totalExecucoes,
      media: totalExecucoes / counts.length,
      maxExecucoes: Math.max(...counts),
    };
  };

  const getPeriodText = () => {
    if (timeRange === "custom" && dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`;
    }
    const end = new Date();
    return `${format(subDays(end, Number(timeRange)), "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;
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
    setTimeout(() => {
      void refetchExecutions();
    }, 100);
  };

  const exportToCSV = () => {
    if (!report) return;
    const headers = ["Posição", "Música", "Artista", "Execuções"];
    const csvContent = [
      headers.join(","),
      ...report.map((item, index) =>
        [index + 1, `"${item.title}"`, `"${item.artist || ''}"`, safeParseNumber(item.count)].join(",")
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
    setTimeRange("30");
    setDateRange({ from: undefined, to: undefined });
    setShowSearchResults(false);
  };

  const stats = getStats();
  const showLoading = isLoading && isDateRangeValid;

  return (
    <div className="container mx-auto py-3 sm:py-4 space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary" />
            Relatórios de Louvor
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            Análise de músicas mais executadas
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={!report?.length} size="sm" className="w-full sm:w-auto">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Exportar
        </Button>
      </div>

      <ReportFilters
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
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

      <div className="grid gap-4 sm:gap-6">
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
    </div>
  );
}