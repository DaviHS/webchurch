"use client";

import { SearchInput } from "@/components/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SONG_CATEGORY_LABELS } from "@/lib/labels";
import { songCategories } from "@/validators/song";

interface SongFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  isSearching?: boolean;
}

export function SongFilters({ search, onSearchChange, category, onCategoryChange, isSearching }: SongFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Buscar por música ou artista..."
        isLoading={isSearching}
      />

      <Select value={category || "any"} onValueChange={(value) => onCategoryChange(value === "any" ? "" : value)}>
        <SelectTrigger className="w-full sm:w-44" aria-label="Categoria">
          <SelectValue placeholder="Todas as categorias" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Todas as categorias</SelectItem>
          {songCategories.map((value) => (
            <SelectItem key={value} value={value}>
              {SONG_CATEGORY_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
