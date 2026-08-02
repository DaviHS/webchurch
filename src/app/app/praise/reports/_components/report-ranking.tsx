import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { List, Music, ChevronRight } from "lucide-react";
import { safeParseNumber } from "@/lib/formatters";
import type { ReportItem, Song } from "@/types";

interface ReportRankingProps {
  report: ReportItem[] | undefined;
  isLoading: boolean;
  isDateRangeValid: boolean;
  onSongClick: (song: Song) => void;
}

export function ReportRanking({ report, isLoading, isDateRangeValid, onSongClick }: ReportRankingProps) {
  if (isLoading) {
    return (
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
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <List className="h-4 w-4 text-primary" />
          Ranking de Músicas
        </CardTitle>
        <p className="text-[10px] sm:text-sm text-muted-foreground">
          Clique em uma música para ver detalhes
        </p>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {report && report.length > 0 ? (
          <div className="space-y-1.5 sm:space-y-2">
            {report.map((item, index) => {
              const count = safeParseNumber(item.count);
              const total = report.reduce((sum, r) => sum + safeParseNumber(r.count), 0);
              const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0';

              return (
                <div
                  key={item.songId}
                  className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => onSongClick({
                    id: item.songId,
                    title: item.title,
                    artist: item.artist!,
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
          <EmptyState
            message="Nenhuma música encontrada"
            subMessage={!isDateRangeValid 
              ? "Selecione um período válido para consultar" 
              : "Ajuste os filtros para ver os resultados"
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message, subMessage }: { message: string; subMessage: string }) {
  return (
    <div className="text-center py-6 sm:py-8 text-muted-foreground">
      <Music className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs sm:text-sm">{subMessage}</p>
    </div>
  );
}