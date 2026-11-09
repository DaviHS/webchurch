"use client";

import { SearchInput } from "@/components/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SONG_CATEGORY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { songCategories } from "@/validators/song";

/** "noYoutube" e "noSpotify" mostram só as músicas sem o link (mais recentes primeiro). */
export type SongSort = "recent" | "title" | "mostPlayed" | "leastPlayed" | "noYoutube" | "noSpotify";

const SORT_OPTIONS: { value: SongSort; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "title", label: "A–Z" },
  { value: "mostPlayed", label: "Mais tocadas" },
  { value: "leastPlayed", label: "Menos tocadas" },
];

interface SongFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** "" = todas as categorias. */
  category: string;
  onCategoryChange: (value: string) => void;
  sort: SongSort;
  onSortChange: (value: SongSort) => void;
  noLyrics: boolean;
  onNoLyricsChange: (value: boolean) => void;
  isSearching?: boolean;
  /** Categorias que existem no catálogo: só elas viram botão. Com uma só, a faixa nem aparece. */
  availableCategories: string[];
  /** Quantas músicas estão sem letra. O filtro "Sem letra" só aparece se houver alguma. */
  noLyricsCount: number;
  /** As opções "Sem YouTube/Spotify" da lista só aparecem se houver músicas sem o link. */
  noYoutubeCount: number;
  noSpotifyCount: number;
}

/** Busca, ordem e filtros em botões: o que existe fica a um toque, sem abrir listas. */
export function SongFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  noLyrics,
  onNoLyricsChange,
  isSearching,
  availableCategories,
  noLyricsCount,
  noYoutubeCount,
  noSpotifyCount,
}: SongFiltersProps) {
  const categories = songCategories.filter((value) => availableCategories.includes(value));
  const showCategories = categories.length > 1 || category !== "";
  const showChips = showCategories || noLyricsCount > 0 || noLyrics;

  const chip = (active: boolean) =>
    cn(
      "min-h-10 shrink-0 snap-start rounded-full border px-4 text-sm font-medium transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar por música, artista ou trecho da letra…"
          isLoading={isSearching}
        />
        <Select value={sort} onValueChange={(value) => onSortChange(value as SongSort)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Ordenar por">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
            {(noYoutubeCount > 0 || sort === "noYoutube") && <SelectItem value="noYoutube">Sem YouTube ({noYoutubeCount})</SelectItem>}
            {(noSpotifyCount > 0 || sort === "noSpotify") && <SelectItem value="noSpotify">Sem Spotify ({noSpotifyCount})</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {showChips && (
        <div
          role="group"
          aria-label="Filtros"
          className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {showCategories && (
            <>
              <button type="button" aria-pressed={category === ""} onClick={() => onCategoryChange("")} className={chip(category === "")}>
                Todas
              </button>
              {categories.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={category === value}
                  onClick={() => onCategoryChange(category === value ? "" : value)}
                  className={chip(category === value)}
                >
                  {SONG_CATEGORY_LABELS[value]}
                </button>
              ))}
            </>
          )}
          {(noLyricsCount > 0 || noLyrics) && (
            <button type="button" aria-pressed={noLyrics} onClick={() => onNoLyricsChange(!noLyrics)} className={chip(noLyrics)}>
              Sem letra ({noLyricsCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
