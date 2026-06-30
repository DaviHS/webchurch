"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  Calendar,
  Music,
  TrendingUp,
  Search,
  Filter,
  X,
  ChevronRight,
  BarChart3,
  List,
  PieChart,
} from "lucide-react";
import { api } from "@/trpc/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { COLORS } from "@/lib/contants";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Song {
  id: number;
  title: string;
  artist: string | null;
}

interface ReportItem {
  songId: number;
  title: string;
  artist: string | null;
  count: number | string;
}

interface SongExecution {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: Date;
  eventType: string;
  order: number;
  notes: string | null;
  songId: number;
  songTitle: string;
  songArtist: string | null;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0]?.payload?.artist || "Artista desconhecido"}
        </p>
        <p className="font-medium text-primary">
          {payload[0]?.value} execuções
        </p>
      </div>
    );
  }
  return null;
};

const safeParseNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const formatNumber = (num: any): string => {
  const number = safeParseNumber(num);

  if (number === 0) return '0';
  if (!isFinite(number)) return '0';

  if (number >= 1e21) {
    return number.toExponential(2);
  }

  if (number >= 1e9) {
    return (number / 1e9).toFixed(1) + 'B';
  }
  if (number >= 1e6) {
    return (number / 1e6).toFixed(1) + 'M';
  }
  if (number >= 1e3) {
    return (number / 1e3).toFixed(1) + 'K';
  }

  if (Number.isInteger(number)) {
    return number.toString();
  }
  return number.toFixed(1);
};

const formatMedia = (num: any): string => {
  const number = safeParseNumber(num);

  if (number === 0) return '0';
  if (!isFinite(number)) return '0';

  if (Number.isInteger(number)) {
    return number.toString();
  }

  if (number >= 1e10) {
    return number.toExponential(2);
  }

  return number.toFixed(1);
};

const abbreviateArtist = (name: string): string => {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) return name;
  
  const firstName = parts[0];
  const lastPart = parts[parts.length - 1] || '';
  const lastNameInitial = lastPart.charAt(0);
  
  return `${firstName} ${lastNameInitial}.`;
};

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const [selectedSongForDetails, setSelectedSongForDetails] = useState<Song | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: songsData, isLoading: songsLoading } = api.song.list.useQuery({
    search: searchTerm || undefined,
    limit: 50,
  });
  const allSongs = songsData?.songs || [];

  const getPeriodParams = () => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (timeRange === "custom") {
      if (dateRange.from && dateRange.to) {
        startDate = startOfDay(dateRange.from);
        endDate = endOfDay(dateRange.to);
      } else {
        return { startDate: undefined, endDate: undefined };
      }
    } else {
      endDate = endOfDay(new Date());
      startDate = startOfDay(subDays(endDate, Number(timeRange)));
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getPeriodParams();

  const isDateRangeValid = timeRange !== "custom" || !!(dateRange.from && dateRange.to);

  const { data: report, isLoading, refetch } = api.event.getSongsReport.useQuery(
    {
      startDate,
      endDate,
      songIds: selectedSongs.length > 0 ? selectedSongs.map(s => s.id) : undefined,
    },
    {
      enabled: isDateRangeValid,
      staleTime: 0,
      refetchOnWindowFocus: false,
    }
  );

  const { data: songExecutions, isLoading: isLoadingExecutions, refetch: refetchExecutions } =
    api.event.getSongExecutions.useQuery(
      {
        songId: selectedSongForDetails?.id || 0,
        startDate,
        endDate,
      },
      {
        enabled: false,
      }
    );

  const getCategoryColor = (index: number) => {
    return COLORS[index % COLORS.length];
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (timeRange !== "custom") {
      const endDate = new Date();
      const startDate = subDays(endDate, Number(timeRange));
      setDateRange({
        from: startDate,
        to: endDate,
      });
    }
  }, [timeRange]);

  useEffect(() => {
    if (isDateRangeValid) {
      refetch();
    }
  }, [startDate, endDate, selectedSongs, refetch, isDateRangeValid]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSongs([]);
    setTimeRange("30");
    setDateRange({ from: undefined, to: undefined });
    setShowSearchResults(false);
  };

  const handleSelectSong = (song: Song) => {
    if (!selectedSongs.find(s => s.id === song.id)) {
      setSelectedSongs([...selectedSongs, song]);
    }
    setSearchTerm("");
    setShowSearchResults(false);
  };

  const removeSelectedSong = (songId: number) => {
    setSelectedSongs(selectedSongs.filter(s => s.id !== songId));
  };

  const handleOpenSongDetails = async (song: Song) => {
    setSelectedSongForDetails(song);
    setIsDialogOpen(true);

    setTimeout(() => {
      refetchExecutions();
    }, 100);
  };

  const exportToCSV = () => {
    if (!report) return;

    const headers = ["Posição", "Música", "Artista", "Execuções"];
    const csvContent = [
      headers.join(","),
      ...report.map((item: ReportItem, index: number) =>
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

  const getPeriodText = () => {
    if (timeRange === "custom") {
      if (dateRange.from && dateRange.to) {
        return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`;
      }
      if (dateRange.from) {
        return `De ${format(dateRange.from, "dd/MM/yyyy")} - ...`;
      }
      return "Aguardando seleção";
    }

    const endDate = new Date();
    const startDate = subDays(endDate, Number(timeRange));
    return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
  };

  const getStats = () => {
    if (!report || report.length === 0) return null;

    try {
      const counts = report.map((item: ReportItem) => safeParseNumber(item.count));
      const totalExecucoes = counts.reduce((sum: number, count: number) => sum + count, 0);
      const media = totalExecucoes / counts.length;
      const maxExecucoes = Math.max(...counts);

      return {
        totalMusicas: report.length,
        totalExecucoes,
        media,
        maxExecucoes
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return null;
    }
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

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button onClick={exportToCSV} disabled={!report || report.length === 0} size="sm" className="w-full sm:w-auto">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exportar
          </Button>
        </div>
      </div>

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
              <Select value={timeRange} onValueChange={setTimeRange}>
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
                onChange={setDateRange}
                placeholder={timeRange === "custom" ? "Selecione as datas" : "Período definido"}
                disabled={timeRange !== "custom"}
                className="h-8 sm:h-9 text-xs sm:text-sm"
                closeOnSelect={false}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 space-y-1 relative z-50" ref={searchRef}>
              <Label className="text-[10px] sm:text-xs font-medium">Músicas</Label>

              {selectedSongs.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {selectedSongs.map((song) => (
                    <Badge key={song.id} variant="secondary" className="gap-1 text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                      <span className="max-w-[120px] sm:max-w-[200px] truncate">{song.title}</span>
                      {song.artist && (
                        <span className="text-muted-foreground text-[8px] sm:text-[10px]">
                          {abbreviateArtist(song.artist)}
                        </span>
                      )}
                      <button
                        onClick={() => removeSelectedSong(song.id)}
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
                  placeholder={selectedSongs.length > 0 ? "Adicionar..." : "Digite o nome da música..."}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm) {
                      const foundSong = allSongs.find(s =>
                        s.title.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      if (foundSong) {
                        handleSelectSong(foundSong);
                      }
                    }
                  }}
                  className="pr-7 h-8 sm:h-9 text-xs sm:text-sm"
                />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
              </div>

              {showSearchResults && searchTerm && (
                <div className="absolute z-[9999] w-full mt-1 bg-popover border rounded-lg shadow-2xl max-h-40 sm:max-h-48 overflow-auto">
                  <div className="p-1.5">
                    {songsLoading ? (
                      <div className="text-center py-2 text-xs text-muted-foreground">
                        Carregando...
                      </div>
                    ) : allSongs.length === 0 ? (
                      <div className="text-center py-2 text-xs text-muted-foreground">
                        Nenhuma música encontrada
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {allSongs.map((song: Song) => {
                          const isSelected = selectedSongs.some(s => s.id === song.id);
                          return (
                            <button
                              key={song.id}
                              type="button"
                              onClick={() => handleSelectSong(song)}
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
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3">
            <Button variant="outline" onClick={clearFilters} size="sm" className="h-7 sm:h-8 text-xs">
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

      <div className="grid gap-4 sm:gap-6">
        {showLoading ? (
          <Card className="overflow-hidden">
            <CardHeader className="p-3 sm:p-4">
              <Skeleton className="h-5 w-32 sm:w-48" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <Skeleton className="h-14 sm:h-20 w-full" />
                <Skeleton className="h-14 sm:h-20 w-full" />
                <Skeleton className="h-14 sm:h-20 w-full" />
                <Skeleton className="h-14 sm:h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          stats && (
            <Card className="overflow-hidden">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <PieChart className="h-4 w-4 text-primary" />
                  Estatísticas {isDateRangeValid && `(${getPeriodText()})`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="text-center p-2 sm:p-3 border rounded-lg">
                    <div className="text-base sm:text-xl font-bold text-primary">
                      {stats.totalMusicas}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Músicas diferentes</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 border rounded-lg">
                    <div className="text-base sm:text-xl font-bold text-primary">
                      {formatNumber(stats.totalExecucoes)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Total execuções</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 border rounded-lg">
                    <div className="text-base sm:text-xl font-bold text-primary">
                      {formatMedia(stats.media)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Média por música</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 border rounded-lg">
                    <div className="text-base sm:text-xl font-bold text-primary">
                      {stats.maxExecucoes}x
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Mais executada</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {showLoading ? (
          <Card className="overflow-hidden">
            <CardHeader className="p-3 sm:p-4">
              <Skeleton className="h-5 w-32 sm:w-48" />
              <Skeleton className="h-3 w-40 sm:w-64" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="space-y-2">
                <Skeleton className="h-12 sm:h-16 w-full" />
                <Skeleton className="h-12 sm:h-16 w-full" />
                <Skeleton className="h-12 sm:h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <List className="h-4 w-4 text-primary" />
                Ranking de Músicas
              </CardTitle>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Clique em uma música para ver detalhes</p>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {report && report.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2">
                  {report.map((item: ReportItem, index: number) => {
                    const count = safeParseNumber(item.count);
                    const total = report.reduce((sum: number, r: ReportItem) => sum + safeParseNumber(r.count), 0);
                    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0';

                    return (
                      <div
                        key={item.songId}
                        className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => handleOpenSongDetails({
                          id: item.songId,
                          title: item.title,
                          artist: item.artist
                        })}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0">
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate text-xs sm:text-sm">{item.title}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              {item.artist || "Artista desconhecido"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                          <div className="text-right">
                            <div className="font-bold text-xs sm:text-sm">{count}x</div>
                            <div className="text-[10px] text-muted-foreground hidden sm:block">
                              {percent}%
                            </div>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Music className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Nenhuma música encontrada</p>
                  <p className="text-xs sm:text-sm">
                    {!isDateRangeValid 
                      ? "Selecione um período válido para consultar" 
                      : "Ajuste os filtros para ver os resultados"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showLoading ? (
          <Card className="overflow-hidden">
            <CardHeader className="p-3 sm:p-4">
              <Skeleton className="h-5 w-32 sm:w-48" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <Skeleton className="h-48 sm:h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                Distribuição de Execuções
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {report && report.length > 0 ? (
                <div className="h-48 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={report.slice(0, 10).map(item => ({
                        ...item,
                        count: safeParseNumber(item.count)
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="title"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 10 }}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="count"
                        radius={[4, 4, 0, 0]}
                        onClick={(data) => {
                          if (data && data.payload) {
                            handleOpenSongDetails({
                              id: data.payload.songId,
                              title: data.payload.title,
                              artist: data.payload.artist
                            });
                          }
                        }}
                        cursor="pointer"
                      >
                        {report.slice(0, 10).map((entry: ReportItem, index: number) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Music className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Nenhum dado disponível</p>
                  <p className="text-xs sm:text-sm">
                    {!isDateRangeValid 
                      ? "Selecione um período válido para consultar" 
                      : "Não há execuções de músicas com os filtros selecionados"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
              <Music className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              {selectedSongForDetails?.title || "Detalhes da Música"}
            </DialogTitle>
            {selectedSongForDetails?.artist && (
              <DialogDescription className="text-xs sm:text-sm">
                Artista: {selectedSongForDetails.artist}
              </DialogDescription>
            )}
          </DialogHeader>

          {isLoadingExecutions ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="space-y-2 sm:space-y-3 w-full">
                <Skeleton className="h-10 sm:h-12 w-full" />
                <Skeleton className="h-10 sm:h-12 w-full" />
                <Skeleton className="h-10 sm:h-12 w-full" />
              </div>
            </div>
          ) : songExecutions && songExecutions.length > 0 ? (
            <ScrollArea className="max-h-[40vh] sm:max-h-[50vh]">
              <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-primary">{songExecutions.length}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Total execuções</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm sm:text-2xl font-bold text-primary">
                      {format(new Date(songExecutions[0]?.eventDate || new Date()), "dd/MM/yyyy")}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Última execução</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-primary">
                      {new Set(songExecutions.map(e => e.eventId)).size}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Eventos diferentes</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5 sm:space-y-2">
                  {songExecutions.map((execution: SongExecution, index: number) => (
                    <div
                      key={execution.id}
                      className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 text-primary rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-medium text-xs sm:text-sm truncate">{execution.eventTitle}</span>
                          <Badge variant="outline" className="text-[8px] sm:text-xs">
                            {execution.eventType || "Evento"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="flex items-center gap-0.5 sm:gap-1">
                            <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {format(new Date(execution.eventDate), "dd/MM/yyyy")}
                          </span>

                          {execution.order && (
                            <span className="flex items-center gap-0.5 sm:gap-1">
                              <Music className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              Ordem: {execution.order}
                            </span>
                          )}
                        </div>

                        {execution.notes && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 italic truncate">
                            "{execution.notes}"
                          </p>
                        )}
                      </div>

                      <Badge variant="secondary" className="text-[8px] sm:text-xs flex-shrink-0">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Music className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Nenhuma execução encontrada</p>
              <p className="text-xs sm:text-sm">Para esta música no período selecionado</p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">Fechar</Button>
            </DialogClose>
            {selectedSongForDetails && (
              <Button
                variant="default"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (!selectedSongs.find(s => s.id === selectedSongForDetails.id)) {
                    handleSelectSong(selectedSongForDetails);
                  }
                  setIsDialogOpen(false);
                }}
              >
                Filtrar por esta música
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}