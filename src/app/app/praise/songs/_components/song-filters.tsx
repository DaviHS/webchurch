"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface SongFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}

export function SongFilters({ search, onSearchChange, category, onCategoryChange }: SongFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      <div className="relative w-full">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por música ou artista..."
          className="pl-10 w-full text-sm sm:text-base"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select
        value={category || "any"}
        onValueChange={(val) => onCategoryChange(val === "any" ? "" : val)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Todas categorias" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Todas categorias</SelectItem>
          <SelectItem value="hymn">Hino</SelectItem>
          <SelectItem value="praise">Louvor</SelectItem>
          <SelectItem value="worship">Adoração</SelectItem>
          <SelectItem value="chorus">Coro</SelectItem>
          <SelectItem value="special">Especial</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}