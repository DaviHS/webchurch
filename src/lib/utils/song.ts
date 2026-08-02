import type { Song } from "@/types/song";
import type { ReportItem } from "@/types/report";
import { safeParseNumber, formatPercent } from "@/lib/formatters/number";

/**
 * Prepara slides para apresentação de uma música
 */
export function prepareSlides(song: Song): string[] {
  if (!song?.lyrics) return [];

  const slides: string[] = [];
  
  // Slide de título
  slides.push(`Título: ${song.title}\n\nArtista: ${song.artist || "Não informado"}`);

  // Divide por estrofes (separadas por linha em branco)
  const verses = song.lyrics
    .split("\n\n")
    .filter((verse: string) => verse.trim() !== "");
  
  slides.push(...verses);

  return slides;
}

/**
 * Calcula a porcentagem de cada música no relatório
 */
export function calculateSongPercent(item: ReportItem, report: ReportItem[]): string {
  const count = safeParseNumber(item.count);
  const total = report.reduce((sum: number, r: ReportItem) => sum + safeParseNumber(r.count), 0);
  return formatPercent(count, total);
}

/**
 * Encontra uma música em uma lista pelo ID
 */
export function findSongById(songs: Song[], id: number): Song | undefined {
  return songs.find(s => s.id === id);
}

/**
 * Verifica se uma música já está selecionada
 */
export function isSongSelected(selectedSongs: Song[], songId: number): boolean {
  return selectedSongs.some(s => s.id === songId);
}