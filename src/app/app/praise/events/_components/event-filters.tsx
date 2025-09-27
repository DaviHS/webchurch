// app/praise/events/_components/event-filters.tsx
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface EventFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: string;
  onTypeChange: (value: string) => void;
}

export function EventFilters({ search, onSearchChange, type, onTypeChange }: EventFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      <div className="relative w-full">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos..."
          className="pl-10 w-full text-sm sm:text-base"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Todos os tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Todos os tipos</SelectItem>
          <SelectItem value="cult">Culto</SelectItem>
          <SelectItem value="celebration">Celebração</SelectItem>
          <SelectItem value="meeting">Reunião</SelectItem>
          <SelectItem value="conference">Conferência</SelectItem>
          <SelectItem value="rehearsal">Ensaio</SelectItem>
          <SelectItem value="other">Outro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}